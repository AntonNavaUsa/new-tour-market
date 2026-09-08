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

printf '\n=== Current nginx TLS configuration ===\n'
nginx -T 2>&1 | grep -nE 'server_name|listen[[:space:]]+443|ssl_certificate' || true

printf '\n=== Current certificate for szntravel.ru ===\n'
openssl s_client -connect 127.0.0.1:443 -servername szntravel.ru </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName || true

backup="/root/nginx-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$backup"
cp -a /etc/nginx "$backup/"
printf '\nnginx backup: %s\n' "$backup"

if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
elif ! certbot plugins 2>/dev/null | grep -q nginx; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y python3-certbot-nginx
fi

mkdir -p /etc/nginx/conf.d
cat > /etc/nginx/conf.d/szntravel.ru.conf <<'NGINX'
server {
    listen 80;
    server_name szntravel.ru www.szntravel.ru;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

nginx -t
systemctl reload nginx

certbot --nginx --non-interactive --agree-tos --redirect \
  --email __EMAIL__ \
  -d szntravel.ru -d www.szntravel.ru

nginx -t
systemctl reload nginx

printf '\n=== Certificate after repair ===\n'
openssl s_client -connect 127.0.0.1:443 -servername szntravel.ru </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
printf '\n=== Public endpoint ===\n'
curl -I --max-time 15 https://szntravel.ru/
'@

$remoteScript = $remoteScript.Replace('__EMAIL__', $Email)
$remoteScript | & ssh -i $SshKeyPath -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SshUser@$ServerIp" 'bash -s'
if ($LASTEXITCODE -ne 0) {
    throw "Remote TLS repair failed with exit code $LASTEXITCODE"
}
