[CmdletBinding()]
param(
    [string]$ServerIp = '80.87.102.197',
    [string]$SshUser = 'root',
    [Parameter(Mandatory = $true)]
    [string]$SshKeyPath,
    [string]$Email = 'admin@szntravel.ru',
    [string]$InfraDir = '/root/salon-saas/infra',
    [string]$WebContainer = 'salon_web'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $SshKeyPath)) {
    throw "SSH key not found: $SshKeyPath"
}

$remoteScript = @'
set -eu

INFRA_DIR="__INFRA_DIR__"
WEB_CONTAINER="__WEB_CONTAINER__"
DOMAINS="-d chiozp.ru -d www.chiozp.ru -d szntravel.ru -d www.szntravel.ru -d infokurort.ru -d www.infokurort.ru"

exec 9>/var/lock/shared-tls-renew.lock
flock -n 9 || { echo 'Another TLS operation is already running'; exit 0; }

cd "$INFRA_DIR"
backup="/root/nginx-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$backup"
if [ -d nginx ]; then cp -a nginx "$backup/"; fi
printf '\nnginx backup: %s\n' "$backup"

# HTTPS is served by the shared reverse proxy. Application deploys must not
# recreate this container or replace its certificate volume.
docker network connect travelio_travelio-net "$WEB_CONTAINER" 2>/dev/null || true

docker run --rm --network infra_salon_network \
    -v "$INFRA_DIR/certbot/conf:/etc/letsencrypt" \
    -v "$INFRA_DIR/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --cert-name shared-sites --webroot -w /var/www/certbot --non-interactive --agree-tos \
    --email __EMAIL__ $DOMAINS

docker exec "$WEB_CONTAINER" nginx -t
docker exec "$WEB_CONTAINER" nginx -s reload

printf '\n=== Certificate after repair ===\n'
docker exec "$WEB_CONTAINER" nginx -T 2>&1 | grep -nE 'server_name (chiozp|szntravel|inforkurort)|ssl_certificate|ssl_certificate_key'
printf '\n=== Public endpoint ===\n'
for domain in chiozp.ru szntravel.ru infokurort.ru; do
    curl --fail --silent --show-error --head --max-time 15 "https://$domain/" >/dev/null
    echo "$domain: HTTPS OK"
done
'@

$remoteScript = $remoteScript.Replace('__EMAIL__', $Email)
$remoteScript = $remoteScript.Replace('__INFRA_DIR__', $InfraDir)
$remoteScript = $remoteScript.Replace('__WEB_CONTAINER__', $WebContainer)
$remoteScript = $remoteScript -replace "`r`n", "`n"
$remoteScript | & ssh -i $SshKeyPath -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SshUser@$ServerIp" 'bash -s'
if ($LASTEXITCODE -ne 0) {
    throw "Remote TLS repair failed with exit code $LASTEXITCODE"
}
