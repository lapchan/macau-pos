#!/usr/bin/env bash
# =============================================================================
# Initial SSL certificate provisioning
# Run once on the ECS instance after DNS records are set up.
#
# This gets certs for:
#   - hkretailai.com (base)
#   - admin.hkretailai.com
#   - pos.hkretailai.com
#   - shop.hkretailai.com
#
# For wildcard *.shop.hkretailai.com, you need DNS-01 challenge
# (requires Alibaba Cloud DNS API plugin for certbot).
# For the demo, we provision individual subdomains via HTTP-01.
# =============================================================================
set -euo pipefail

source /opt/macau-pos/.env.production
EMAIL="${CERTBOT_EMAIL:-admin@hkretailai.com}"

cd /opt/macau-pos

# Start nginx with HTTP-only config first (for ACME challenge)
echo "==> Starting nginx for ACME challenge..."

# Create a temporary HTTP-only nginx config
mkdir -p deploy/nginx/conf.d/custom-domains
cat > /tmp/nginx-init.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Macau POS — SSL setup in progress';
        add_header Content-Type text/plain;
    }
}
EOF

# Start only nginx + certbot for cert provisioning
docker compose -f docker-compose.production.yml up -d nginx certbot

# Give nginx a moment
sleep 3

# Provision cert for all subdomains
echo "==> Requesting certificates..."
docker compose -f docker-compose.production.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  -d hkretailai.com \
  -d admin.hkretailai.com \
  -d pos.hkretailai.com \
  -d shop.hkretailai.com

echo "==> SSL certificates provisioned!"
echo "    Now run: ./deploy/deploy.sh to start all services."
