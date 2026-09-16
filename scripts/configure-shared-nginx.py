from pathlib import Path

path = Path('/root/salon-saas/infra/nginx/nginx.conf')
text = path.read_text()
path.with_name('nginx.conf.before-shared-tls').write_text(text)

http_server_name = 'server_name chiozp.ru www.chiozp.ru;'
all_http_domains = 'server_name chiozp.ru www.chiozp.ru szntravel.ru www.szntravel.ru infokurort.ru www.infokurort.ru;'
if http_server_name not in text:
    raise SystemExit('HTTP server_name marker not found')
text = text.replace(http_server_name, all_http_domains, 1)

upstream_marker = '''  upstream admin_frontend {
    server admin_web:80;
  }
'''
upstream_extra = upstream_marker + '''
  upstream travelio_frontend {
    server travelio-frontend:80;
  }

  upstream infokurort_frontend {
    server infokurort:80;
  }
'''
if 'upstream travelio_frontend' not in text:
    if upstream_marker not in text:
        raise SystemExit('upstream marker not found')
    text = text.replace(upstream_marker, upstream_extra, 1)

server_template = '''

  server {{
    listen 443 ssl http2;
    server_name {domains};

    ssl_certificate /etc/letsencrypt/live/chiozp.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chiozp.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api/ {{
      proxy_pass http://{upstream}/api/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 120s;
    }}

    location / {{
      proxy_pass http://{upstream}/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }}
  }}
'''
insert_at = text.rfind('\n}')
if insert_at < 0:
  raise SystemExit('http block closing marker not found')
extra_servers = ''
if 'server_name szntravel.ru www.szntravel.ru;' not in text:
  extra_servers += server_template.format(domains='szntravel.ru www.szntravel.ru', upstream='travelio_frontend')
if 'server_name infokurort.ru www.infokurort.ru;' not in text:
  extra_servers += server_template.format(domains='infokurort.ru www.infokurort.ru', upstream='infokurort_frontend')
text = text[:insert_at] + extra_servers + text[insert_at:]

path.write_text(text)
print(path)
