# Shared TLS for the production server

The server hosts three sites behind one public HTTPS entrypoint:

- `chiozp.ru` and `www.chiozp.ru`
- `szntravel.ru` and `www.szntravel.ru`
- `infokurort.ru` and `www.infokurort.ru`

## Ownership rule

Only the infrastructure project may bind ports `80` and `443`, manage the reverse-proxy container, or renew certificates. Application projects must expose HTTP ports on the private Docker network and must not:

- run `certbot`;
- recreate the reverse proxy;
- delete shared certificate volumes;
- use `docker compose --remove-orphans` against a shared compose project.

Travelio now uses the explicit compose project name `travelio` and does not remove orphan containers during deployment.

## Certificate

Use one SAN certificate for all six names. The reverse proxy must reference the same certificate in every HTTPS server block:

```nginx
ssl_certificate /etc/letsencrypt/live/shared-sites/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/shared-sites/privkey.pem;
```

The directory name is only a storage path; the certificate SANs are what matter. A separate certificate per domain is also valid, but every renewal must be owned by the same infrastructure project.

## Renewal and repair

Run from the infrastructure repository that owns the shared reverse proxy:

```bash
INFRA_DIR=/root/salon-saas/infra \
WEB_CONTAINER=salon_web \
CERTBOT_EMAIL=admin@szntravel.ru \
bash /opt/travelio/scripts/renew-shared-tls.sh
```

The script:

1. takes a lock so two deployments cannot renew simultaneously;
2. requests the fixed certbot lineage `shared-sites` and backs up the nginx configuration;
3. requests/renews one certificate for all domains;
4. validates nginx before reload;
5. reloads nginx without recreating the proxy;
6. checks HTTPS for all three sites.

The PowerShell wrapper `fix-production-tls.ps1` performs the same operation over SSH. It accepts `-InfraDir` and `-WebContainer` for servers where the infrastructure path or container name differs.

## Deployment invariant

Before and after deploying any application, verify that the shared proxy is still the only listener on ports `80/443` and that the certificate contains all names:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
openssl s_client -connect szntravel.ru:443 -servername szntravel.ru </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Do not copy a certificate from another project into the `szntravel.ru` server block. The current incident happened because the proxy served a valid certificate for `chiozp.ru` as the default certificate for `szntravel.ru`; validity alone is not enough, the SAN must contain the requested hostname.

Install renewal once in the infrastructure host, not in each application repository. For example, a root cron entry can run twice daily:

```cron
17 3,15 * * * cd /opt/travelio && INFRA_DIR=/root/salon-saas/infra WEB_CONTAINER=salon_web CERTBOT_EMAIL=admin@szntravel.ru bash /opt/travelio/scripts/renew-shared-tls.sh >> /var/log/shared-tls-renew.log 2>&1
```
