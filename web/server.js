import express from 'express';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { imageSources } from '../shared/image-sources.js';

export function createWebServer() {
  const app = express();
  const dist = fileURLToPath(new URL('./dist/', import.meta.url));
  app.disable('x-powered-by');
  const apiOrigin = new URL(process.env.WEB_API_ORIGIN || process.env.VITE_API_BASE_URL || 'http://localhost:3000').origin;
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY',
      'Content-Security-Policy': `default-src 'self'; connect-src 'self' ${apiOrigin}; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src ${imageSources}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
    }); next();
  });
  app.use('/api', (req, res) => res.status(404).json({ message: 'API chạy ở origin riêng.' }));
  app.use(express.static(dist, { index: false }));
  app.use((req, res, next) => {
    const spaResource = /^\/(?:admin\/)?(?:dishes|chefs|ingredients|restaurants)(?:\/|$)/.test(req.path);
    if (req.method !== 'GET' || !req.accepts('html') || (/\.[^/]+$/.test(req.path) && !spaResource)) return res.status(404).end();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(`${dist}index.html`, error => error && next(error));
  });
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.WEB_PORT || 5173);
  createWebServer().listen(port, '127.0.0.1', () => console.log(`Block6 SPA: http://localhost:${port}`));
}
