#!/usr/bin/env bash
# =============================================================================
# Add a custom domain for a tenant's storefront
# Usage: ./deploy/add-domain.sh www.mybrand.com
# =============================================================================
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain>}"
CONF_DIR="$(dirname "$0")/nginx/conf.d/custom-domains"
CONF_FILE="${CONF_DIR}/${DOMAIN}.conf"

echo "==> Provisioning SSL cert for ${DOMAIN}..."
docker compose -f docker-compose.production.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  --email admin@hkretailai.com \
  --agree-tos --no-eff-email \
  -d "${DOMAIN}"

echo "==> Generating nginx config..."
cat > "${CONF_FILE}" <<EOF
# Auto-generated for custom domain: ${DOMAIN}
server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://storefront;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "==> Reloading nginx..."
docker compose -f docker-compose.production.yml exec nginx nginx -s reload

echo "==> Done! ${DOMAIN} is now routing to the storefront."
echo "    Don't forget to set custom_domain='${DOMAIN}' on the tenant row in the DB."
