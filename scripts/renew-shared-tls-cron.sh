#!/usr/bin/env bash
set -Eeuo pipefail

INFRA_DIR="/root/salon-saas/infra"
WEB_CONTAINER="salon_web"

exec 9>/var/lock/shared-tls-renew.lock
flock -n 9 || exit 0

cd "$INFRA_DIR"
docker run --rm --network infra_salon_network \
	-v "$INFRA_DIR/certbot/conf:/etc/letsencrypt" \
	-v "$INFRA_DIR/certbot/www:/var/www/certbot" \
	certbot/certbot renew --cert-name shared-sites

docker exec "$WEB_CONTAINER" nginx -t
docker exec "$WEB_CONTAINER" nginx -s reload
