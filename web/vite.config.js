import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  server: { host: 'localhost', port: Number(process.env.WEB_PORT || 5173), strictPort: true },
  preview: { host: 'localhost', port: 5173, strictPort: true },
  // API requests deliberately go cross-origin, without a dev proxy.
});
