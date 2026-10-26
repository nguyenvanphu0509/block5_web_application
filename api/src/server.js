import './config/env.js';
import { createDatabaseClient } from './db/client.js';
import { createApi } from './app.js';

const db = createDatabaseClient();
const port = Number(process.env.API_PORT || process.env.PORT || 3000);
const app = createApi({ db, preview: process.env.PREVIEW_MODE === 'true', origin: process.env.SPA_ORIGIN || 'http://localhost:5173' });
const server = app.listen(port, '127.0.0.1', () => console.log(`Block6 API: http://localhost:${port}`));
server.on('error', () => { console.error(`Không mở được cổng API ${port}. Dừng server cũ hoặc đổi API_PORT.`); process.exitCode = 1; db.$disconnect(); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await db.$disconnect(); process.exit(0); });
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 1500).unref();
});
