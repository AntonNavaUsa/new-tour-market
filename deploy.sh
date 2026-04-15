#!/bin/bash
# Deploy script for Travelio on production VPS
# Usage: bash deploy.sh
set -e

APP_DIR="/opt/travelio"
REPO="https://github.com/AntonNavaUsa/new-tour-market.git"

echo "=== Travelio Deploy ==="

# Clone or pull latest code
if [ -d "$APP_DIR/.git" ]; then
  echo "Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "Cloning repo to $APP_DIR..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# Check .env.prod exists
if [ ! -f "$APP_DIR/.env.prod" ]; then
  echo ""
  echo "ERROR: $APP_DIR/.env.prod not found!"
  echo "Create it from the example:"
  echo "  cp $APP_DIR/.env.prod.example $APP_DIR/.env.prod"
  echo "  nano $APP_DIR/.env.prod"
  exit 1
fi

# Build and start containers
echo "Building and starting containers..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo ""
echo "=== Done! ==="
echo "Frontend: http://80.87.102.197:8090"
echo "MinIO Console: http://80.87.102.197:9011 (internal only)"
echo ""
echo "Check logs: docker compose -f docker-compose.prod.yml logs -f"
