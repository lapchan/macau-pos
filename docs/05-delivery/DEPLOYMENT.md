# Macau POS — Deployment Guide

> **Target:** Alibaba Cloud ECS (Hong Kong)
> **Domain:** hkretailai.com
> **Stack:** Docker Compose + nginx + Certbot (Let's Encrypt)
> **Last updated:** 2026-04-07

---

## Architecture

```
                         ┌─ admin.hkretailai.com     → Admin (3100)
                         ├─ pos.hkretailai.com       → Cashier (3200)
ECS Instance → nginx ───├─ *.shop.hkretailai.com    → Storefront (3300)
          (80/443)       ├─ custom domain             → Storefront (3300)
                         └─ (fallback)                → Storefront (3300)

Internal:
  ├── postgres:16 (port 5432, localhost only)
  ├── admin     (Next.js standalone, port 3100)
  ├── cashier   (Next.js standalone, port 3200)
  ├── storefront (Next.js standalone, port 3300)
  ├── nginx     (reverse proxy + SSL termination)
  └── certbot   (auto-renew every 12h)
```

## Multi-Tenant Domain Routing

Each tenant gets a storefront accessible via two methods:

### 1. Tenant Subdomain (automatic)

```
{tenant-slug}.shop.hkretailai.com
```

- Wildcard DNS `*.shop.hkretailai.com` points to ECS IP
- nginx routes all `*.shop.hkretailai.com` traffic to the storefront app
- Storefront middleware extracts the slug from the hostname
- Looks up `tenants.slug` in the database

### 2. Custom Domain (per-tenant setup)

```
www.mybrand.com → storefront → tenant resolved from DB
```

**Tenant setup steps:**
1. Tenant adds a CNAME record: `www.mybrand.com → shop.hkretailai.com`
2. Admin sets `custom_domain = 'www.mybrand.com'` on the tenant row
3. Run on the server: `./deploy/add-domain.sh www.mybrand.com`
   - Provisions a Let's Encrypt cert for the domain
   - Generates an nginx server block
   - Reloads nginx

**Resolution logic** (in `apps/storefront/src/lib/tenant-resolver.ts`):
1. Check if hostname matches `{slug}.shop.hkretailai.com` → lookup by `tenants.slug`
2. Check if hostname is a custom domain → lookup by `tenants.custom_domain`
3. Fallback → demo tenant (for dev / bare domain)

---

## Prerequisites

### ECS Instance

- **OS:** Ubuntu 22.04+ or similar
- **Specs:** 2 vCPU, 4 GB RAM minimum (handles all 3 apps + postgres)
- **Disk:** 40 GB SSD
- **Ports:** 80 (HTTP), 443 (HTTPS) open in security group
- **Software:** Docker Engine + Docker Compose v2

Install Docker on a fresh instance:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### DNS Records

Set these on your domain registrar (or Alibaba Cloud DNS):

| Type | Name | Value |
|------|------|-------|
| A | admin.hkretailai.com | `<ECS_IP>` |
| A | pos.hkretailai.com | `<ECS_IP>` |
| A | shop.hkretailai.com | `<ECS_IP>` |
| A | *.shop.hkretailai.com | `<ECS_IP>` |
| A | hkretailai.com | `<ECS_IP>` |

> **Note:** Wildcard DNS (`*.shop`) requires the base `shop.hkretailai.com` to also have an A record.

### Environment File

Copy the template and fill in real values:

```bash
cp .env.production.example .env.production
```

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `pos_prod` |
| `DB_PASSWORD` | PostgreSQL password (strong!) | `xK9m...` |
| `DB_NAME` | Database name | `macau_pos` |
| `AUTH_SECRET` | Session signing key (64+ chars) | `openssl rand -hex 32` |
| `PLATFORM_DOMAIN` | Your platform domain | `hkretailai.com` |
| `CERTBOT_EMAIL` | Email for Let's Encrypt | `admin@hkretailai.com` |
| `ECS_HOST` | ECS public IP | `47.xxx.xxx.xxx` |
| `ECS_USER` | SSH user | `root` |

---

## Deployment Steps

### First-Time Setup

```bash
# 1. Fill in .env.production
cp .env.production.example .env.production
vim .env.production

# 2. Deploy files to ECS
./deploy/deploy.sh

# 3. SSH into ECS and provision SSL certs
ssh root@<ECS_IP>
cd /opt/macau-pos
./deploy/init-ssl.sh

# 4. Restart all services (now with SSL)
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# 5. Run database migrations / seed
docker compose -f docker-compose.production.yml exec admin \
  node -e "/* migration script */"
```

### Subsequent Deploys

```bash
# From your local machine:
./deploy/deploy.sh
```

This will:
1. Rsync project files to ECS (excludes node_modules, .next, .git)
2. Upload `.env.production`
3. Build Docker images on the server
4. Restart services with zero-downtime (`docker compose up -d`)

### Adding a Tenant Custom Domain

```bash
# On the ECS instance:
cd /opt/macau-pos

# 1. Provision cert + nginx config
./deploy/add-domain.sh www.mybrand.com

# 2. Set custom_domain in the database
docker compose -f docker-compose.production.yml exec postgres \
  psql -U pos_prod -d macau_pos -c \
  "UPDATE tenants SET custom_domain = 'www.mybrand.com' WHERE slug = 'mybrand'"
```

---

## File Structure

```
macau-pos/
├── Dockerfile                          # Multi-stage build (--build-arg APP=admin|cashier|storefront)
├── .dockerignore                       # Excludes node_modules, .next, .git, .env
├── docker-compose.production.yml       # Full production stack
├── .env.production.example             # Environment template
│
└── deploy/
    ├── deploy.sh                       # One-command deploy (rsync + build + up)
    ├── init-ssl.sh                     # First-time SSL cert provisioning
    ├── add-domain.sh                   # Add tenant custom domain (cert + nginx + reload)
    └── nginx/
        ├── nginx.conf                  # Main nginx config (upstreams, gzip)
        └── conf.d/
            ├── default.conf            # Subdomain routing + SSL + catch-all
            └── custom-domains/         # Auto-generated per-tenant configs
                └── .gitkeep
```

## Docker Images

Each app is built from the same Dockerfile with a different `APP` arg:

```bash
docker build --build-arg APP=admin    --build-arg PORT=3100 -t macau-pos-admin .
docker build --build-arg APP=cashier  --build-arg PORT=3200 -t macau-pos-cashier .
docker build --build-arg APP=storefront --build-arg PORT=3300 -t macau-pos-storefront .
```

The build is multi-stage:
1. **deps** — installs pnpm dependencies (cached layer)
2. **builder** — copies source, runs `next build` with standalone output
3. **runner** — minimal Node.js Alpine image, runs `server.js`

Final image size: ~150-200 MB per app.

---

## SSL Certificates

### Platform Subdomains

Single cert covers `hkretailai.com` + `admin.` + `pos.` + `shop.`:

```bash
# Provisioned by init-ssl.sh via HTTP-01 challenge
certbot certonly --webroot -w /var/www/certbot \
  -d hkretailai.com \
  -d admin.hkretailai.com \
  -d pos.hkretailai.com \
  -d shop.hkretailai.com
```

> **Wildcard certs** (`*.shop.hkretailai.com`) require DNS-01 challenge with Alibaba Cloud DNS API plugin. For the demo, individual tenant subdomains can be added to the cert list. For production, set up the DNS-01 plugin.

### Custom Domains

Each custom domain gets its own cert via `add-domain.sh`:

```bash
certbot certonly --webroot -w /var/www/certbot -d www.mybrand.com
```

### Auto-Renewal

The `certbot` container runs renewal checks every 12 hours. Certs are stored in a Docker volume (`certbot-certs`) shared with nginx.

---

## Monitoring & Maintenance

### Check Service Status

```bash
ssh root@<ECS_IP>
cd /opt/macau-pos
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f --tail 50
```

### View App Logs

```bash
docker compose -f docker-compose.production.yml logs admin --tail 100
docker compose -f docker-compose.production.yml logs cashier --tail 100
docker compose -f docker-compose.production.yml logs storefront --tail 100
```

### Database Backup

```bash
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U pos_prod macau_pos > backup_$(date +%Y%m%d).sql
```

### Restart a Single Service

```bash
docker compose -f docker-compose.production.yml restart admin
```

### Full Rebuild (after code changes)

```bash
docker compose -f docker-compose.production.yml up -d --build
```

---

## Scaling (Future)

The current setup runs everything on one ECS instance. To scale:

| Change | How |
|--------|-----|
| Separate DB | Use Alibaba Cloud RDS for PostgreSQL. Change `DATABASE_URL` in `.env.production` |
| Multiple app instances | Split `docker-compose.production.yml` per service, run on separate ECS instances behind SLB (Server Load Balancer) |
| CDN for static assets | Upload `.next/static` to Alibaba Cloud OSS + CDN, set `assetPrefix` in next.config.ts |
| Container orchestration | Migrate to Alibaba Cloud ACK (managed Kubernetes) or use Docker Swarm |
| Swap SSL to Alibaba cert | Replace Let's Encrypt cert paths in nginx config with Alibaba SSL cert paths |

---

## Troubleshooting

### nginx won't start (cert not found)

Run `init-ssl.sh` first. nginx needs the cert files to exist before it can start with the HTTPS config.

### Custom domain SSL fails

Ensure the tenant's CNAME record is propagated:
```bash
dig www.mybrand.com CNAME
# Should return: shop.hkretailai.com
```

### App container exits immediately

Check logs:
```bash
docker compose -f docker-compose.production.yml logs admin
```

Common causes:
- `DATABASE_URL` not set or wrong
- Port conflict
- Missing `server.js` (build failed silently)

### Database connection refused

Postgres may not be ready yet. The healthcheck ensures dependent services wait, but on first boot it may take a few seconds:
```bash
docker compose -f docker-compose.production.yml logs postgres
```
