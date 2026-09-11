[CmdletBinding()]
param(
    [string]$ServerIp = '80.87.102.197',
    [string]$SshUser = 'root',
    [Parameter(Mandatory = $true)]
    [string]$SshKeyPath,
    [string]$Email = 'admin@szntravel.ru'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $SshKeyPath)) {
    throw "SSH key not found: $SshKeyPath"
}

$remoteScript = @'
set -eu

INFRA_DIR="/root/salon-saas/infra"
cd "$INFRA_DIR"
backup="/root/nginx-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$backup"
cp -a nginx "$backup/"
printf '\nnginx backup: %s\n' "$backup"

# HTTPS is served by the salon_web Docker container, not systemd nginx.
docker network connect travelio_travelio-net salon_web 2>/dev/null || true

docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot --non-interactive --agree-tos \
  --email __EMAIL__ -d szntravel.ru -d www.szntravel.ru

docker exec salon_web nginx -t
docker exec salon_web nginx -s reload

printf '\n=== Certificate after repair ===\n'
docker exec salon_web nginx -T 2>&1 | grep -nE 'server_name szntravel|ssl_certificate|travelio_frontend'
printf '\n=== Public endpoint ===\n'
curl -I --max-time 15 https://szntravel.ru/
'@

$remoteScript = $remoteScript.Replace('__EMAIL__', $Email)
$remoteScript = $remoteScript -replace "`r`n", "`n"
$remoteScript | & ssh -i $SshKeyPath -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SshUser@$ServerIp" 'bash -s'
if ($LASTEXITCODE -ne 0) {
    throw "Remote TLS repair failed with exit code $LASTEXITCODE"
}
