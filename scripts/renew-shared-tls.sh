#!/usr/bin/env bash
set -Eeuo pipefail

# Run from the infrastructure repository that owns the shared reverse proxy.
INFRA_DIR="${INFRA_DIR:-/root/salon-saas/infra}"
WEB_CONTAINER="${WEB_CONTAINER:-salon_web}"
EMAIL="${CERTBOT_EMAIL:-admin@szntravel.ru}"
DOMAINS=(
  -d chiozp.ru
  -d www.chiozp.ru
  -d szntravel.ru
  -d www.szntravel.ru
  -d infokurort.ru
  -d www.infokurort.ru
)

exec 9>/var/lock/shared-tls-renew.lock
flock -n 9 || { echo "Another TLS operation is already running"; exit 0; }

cd "$INFRA_DIR"
backup="/root/nginx-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$backup"
if [[ -d nginx ]]; then cp -a nginx "$backup/"; fi

docker run --rm --network infra_salon_network \
  -v "$INFRA_DIR/certbot/conf:/etc/letsencrypt" \
  -v "$INFRA_DIR/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --cert-name shared-sites \
  --webroot -w /var/www/certbot \
  --non-interactive --agree-tos --email "$EMAIL" \
  "${DOMAINS[@]}"

docker exec "$WEB_CONTAINER" nginx -t
docker exec "$WEB_CONTAINER" nginx -s reload

for domain in chiozp.ru szntravel.ru infokurort.ru; do
  curl --fail --silent --show-error --head --max-time 15 "https://$domain/" >/dev/null
  echo "$domain: HTTPS OK"
done
