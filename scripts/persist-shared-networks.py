from pathlib import Path

path = Path('/root/salon-saas/infra/docker-compose.yml')
text = path.read_text()
web_marker = '''    networks:
      - salon_network

  # Certbot for SSL certificates
'''
web_replacement = '''    networks:
      - salon_network
      - travelio_net
      - infokurort_net

  # Certbot for SSL certificates
'''
if '- travelio_net' not in text:
    if web_marker not in text:
        raise SystemExit('web networks marker not found')
    text = text.replace(web_marker, web_replacement, 1)
network_marker = '''networks:
  salon_network:
    driver: bridge
'''
network_replacement = '''networks:
  salon_network:
    driver: bridge
  travelio_net:
    external: true
    name: travelio_travelio-net
  infokurort_net:
    external: true
    name: infokurort_web
'''
if 'name: travelio_travelio-net' not in text:
    if network_marker not in text:
        raise SystemExit('network definitions marker not found')
    text = text.replace(network_marker, network_replacement, 1)
path.write_text(text)
print(path)
