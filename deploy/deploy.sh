#!/usr/bin/env bash
# =============================================================================
# Macau POS — Deploy to ECS
# Usage: ./deploy/deploy.sh
#
# Prerequisites:
#   1. ECS instance with Docker + Docker Compose installed
#   2. DNS records pointing to ECS IP:
#      - admin.hkretailai.com  → ECS_IP
#      - pos.hkretailai.com    → ECS_IP
#      - *.shop.hkretailai.com → ECS_IP
#   3. .env.production file with real values (copy from .env.production.example)
#   4. SSH access to ECS instance
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load production env
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
  echo "ERROR: .env.production not found. Copy .env.production.example and fill in values."
  exit 1
fi
source "$PROJECT_DIR/.env.production"

ECS_HOST="${ECS_HOST:?Set ECS_HOST in .env.production}"
ECS_USER="${ECS_USER:-root}"
REMOTE_DIR="/opt/macau-pos"

echo "==> Deploying to ${ECS_USER}@${ECS_HOST}..."

# 1. Sync project files to ECS
echo "==> Syncing files..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  --exclude .env.local \
  "$PROJECT_DIR/" "${ECS_USER}@${ECS_HOST}:${REMOTE_DIR}/"

# 2. Copy production env
echo "==> Uploading .env.production..."
scp "$PROJECT_DIR/.env.production" "${ECS_USER}@${ECS_HOST}:${REMOTE_DIR}/.env.production"

# 3. Build and start on remote
echo "==> Building and starting services..."
ssh "${ECS_USER}@${ECS_HOST}" << 'REMOTE_SCRIPT'
  set -euo pipefail
  cd /opt/macau-pos

  # Symlink .env.production → .env for docker compose
  ln -sf .env.production .env

  # Build all images
  docker compose -f docker-compose.production.yml build

  # Start services
  docker compose -f docker-compose.production.yml up -d

  # Wait for postgres
  echo "Waiting for postgres..."
  sleep 5

  # Run migrations
  docker compose -f docker-compose.production.yml exec admin \
    node -e "
      const { Pool } = require('pg');
      const fs = require('fs');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const sql = fs.readFileSync('/app/packages/database/drizzle/0000_flaky_jimmy_woo.sql', 'utf8');
      pool.query(sql).then(() => { console.log('Migrations applied'); pool.end(); }).catch(e => { console.log('Migration skipped (tables may already exist):', e.message); pool.end(); });
    " || true

  echo "==> Services running:"
  docker compose -f docker-compose.production.yml ps
REMOTE_SCRIPT

echo ""
echo "==> Deploy complete!"
echo "    Admin:      https://admin.hkretailai.com"
echo "    Cashier:    https://pos.hkretailai.com"
echo "    Storefront: https://shop.hkretailai.com"
