import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';

// ── Настройка sitemap ─────────────────────────────────────────────────────────
// Домен сайта (можно переопределить через .env: VITE_SITE_URL)
const SITE_URL = process.env.VITE_SITE_URL ?? 'https://szntravel.ru';

// Публичные страницы для индексации. Добавляйте сюда новые страницы.
const PUBLIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  // Раскомментируйте когда страница будет готова:
  // { path: '/guides/krasnaya-polyana-spring', changefreq: 'monthly', priority: '0.8' },
];
// ─────────────────────────────────────────────────────────────────────────────

function sitemapPlugin(): Plugin {
  function generate(): string {
    const today = new Date().toISOString().split('T')[0];
    const urls = PUBLIC_ROUTES.map(
      (r) =>
        `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    ).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }

  return {
    name: 'sitemap',
    // Записывает sitemap.xml в public/ перед каждой сборкой
    buildStart() {
      fs.writeFileSync(path.resolve(__dirname, 'public/sitemap.xml'), generate(), 'utf-8');
    },
    // В dev-режиме раздаёт sitemap динамически
    configureServer(server) {
      server.middlewares.use('/sitemap.xml', (_req, res) => {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.end(generate());
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
