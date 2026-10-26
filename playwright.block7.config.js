import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'block7.spec.js', workers: 1, fullyParallel: false,
  timeout: 45000, reporter: 'list',
  use: { baseURL: 'http://localhost:5174', channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 }, video: 'on', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node tests/e2e/block7-server.js', url: 'http://localhost:3100/api/config', timeout: 90000, reuseExistingServer: false },
    { command: 'VITE_API_BASE_URL=http://localhost:3100 npm --prefix web run dev -- --port 5174', url: 'http://localhost:5174', reuseExistingServer: false },
  ],
});
