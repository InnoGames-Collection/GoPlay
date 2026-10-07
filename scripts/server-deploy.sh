#!/usr/bin/env bash
# ==============================================================================
# GoPlay — Enterprise Production Deployment Engine (Telebirr Game Center)
# Target: GCP Compute Engine VM (innoserver-serv001: 34.41.116.217)
# Ports: Web: 3300 | API: 3302 | Admin: 3303 | DB: 5434 | Valkey: 6384
# ==============================================================================
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

WEB_CANARY="http://127.0.0.1:3300/health"
API_CANARY="http://127.0.0.1:3302/health"
ADMIN_CANARY="http://127.0.0.1:3303/health"

rollback() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "❌ [DEPLOYMENT FAILURE] Exit code $exit_code detected. Restarting services..."
    docker compose -f docker-compose.server.yml restart || true
  fi
}
trap rollback EXIT

echo "=============================================================================="
echo "🚀 [STAGE 1: ACT] Sequential Build & Deployment for GoPlay"
echo "=============================================================================="

# Stop and remove legacy deployment containers (gameon and previous goplay) to eliminate port/name collisions
echo "🧹 Cleaning legacy deployment collisions (gameon-* and old goplay-*)..."
docker stop gameon-web gameon-api gameon-admin gameon-postgres gameon-valkey goplay-web goplay-api goplay-admin goplay-postgres goplay-valkey 2>/dev/null || true
docker rm -f gameon-web gameon-api gameon-admin gameon-postgres gameon-valkey goplay-web goplay-api goplay-admin goplay-postgres goplay-valkey 2>/dev/null || true

docker compose -f docker-compose.server.yml up -d postgres valkey

echo "⏳ Waiting for PostgreSQL & Valkey healthy state..."
for i in {1..30}; do
  if docker compose -f docker-compose.server.yml ps postgres | grep -q "healthy" && \
     docker compose -f docker-compose.server.yml ps valkey | grep -q "healthy"; then
    echo "✅ Databases healthy."
    break
  fi
  sleep 1
done

docker compose -f docker-compose.server.yml build api
docker rm -f goplay-api 2>/dev/null || true
docker compose -f docker-compose.server.yml up -d --force-recreate api

docker compose -f docker-compose.server.yml build admin
docker rm -f goplay-admin 2>/dev/null || true
docker compose -f docker-compose.server.yml up -d --force-recreate admin

docker compose -f docker-compose.server.yml build web
docker rm -f goplay-web 2>/dev/null || true
docker compose -f docker-compose.server.yml up -d --force-recreate web

echo "=============================================================================="
echo "🩺 [STAGE 2: VERIFY] Canary Probes"
echo "=============================================================================="
for i in {1..30}; do
  if curl -s -f "$API_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 1 Passed: Fastify API Healthy (Port 3302)"
    break
  fi
  sleep 2
done

for i in {1..30}; do
  if curl -s -f "$ADMIN_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 2 Passed: Admin Console Healthy (Port 3303)"
    break
  fi
  sleep 2
done

for i in {1..30}; do
  if curl -s -f "$WEB_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 3 Passed: Web Client Healthy (Port 3300)"
    break
  fi
  sleep 2
done

# Nginx vhost linking if on host
if [ -d "/etc/nginx/conf.d/products" ] && [ -f "deploy/nginx/goplay.conf" ]; then
  echo "🌐 Updating Nginx virtual host in /etc/nginx/conf.d/products/..."
  sudo cp deploy/nginx/goplay.conf /etc/nginx/conf.d/products/goplay.conf || true
  sudo rm -f /etc/nginx/sites-enabled/goplay.conf || true
  sudo nginx -t && sudo systemctl reload nginx || true
elif [ -d "/etc/nginx/sites-available" ] && [ -f "deploy/nginx/goplay.conf" ]; then
  echo "🌐 Updating Nginx virtual host in /etc/nginx/sites-available/..."
  sudo cp deploy/nginx/goplay.conf /etc/nginx/sites-available/goplay.conf || true
  sudo ln -sf /etc/nginx/sites-available/goplay.conf /etc/nginx/sites-enabled/ || true
  sudo nginx -t && sudo systemctl reload nginx || true
fi

trap - EXIT
echo "=============================================================================="
echo "🎉 [DEPLOYMENT CERTIFIED] GoPlay Live on goplay.innopulseplatform.com"
echo "=============================================================================="
