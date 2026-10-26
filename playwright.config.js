import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: '**/*.spec.js', testIgnore: '**/block7.spec.js', workers: 1, fullyParallel: false,
  timeout: 30000, use: { baseURL: 'http://localhost:5174', channel: 'chrome', headless: true, trace: 'retain-on-failure' },
  webServer: [
    { command: 'node tests/e2e/server.js', url: 'http://localhost:3100/api/config', reuseExistingServer: false },
    { command: process.env.BLOCK6_PRODUCTION_TEST === 'true'
      ? 'VITE_API_BASE_URL=http://localhost:3100 npm --prefix web run build && WEB_API_ORIGIN=http://localhost:3100 WEB_PORT=5174 npm --prefix web start'
      : 'VITE_API_BASE_URL=http://localhost:3100 npm --prefix web run dev -- --port 5174', url: 'http://localhost:5174', reuseExistingServer: false },
  ],
});
