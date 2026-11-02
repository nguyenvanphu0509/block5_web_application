import {origin} from './auth/config.js';
import '../../api/src/config/env.js';
import { createApp } from './app.js';
import { createDatabaseClient } from '../../api/src/db/client.js';
import { createPreviewClient } from './db/preview.js';

const port = Number(process.env.SSR_PORT || 3001);
const preview = process.env.PREVIEW_MODE === 'true';
let db;
try { const database = createDatabaseClient(process.env.SSR_DATABASE_URL || process.env.DATABASE_URL); db = preview ? createPreviewClient(database) : database; }
catch (err) { console.error(err.message); process.exit(1); }
const app = createApp({ db, preview, origin: origin });
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Block5 Kitchen: http://localhost:${port}${preview ? ' — PREVIEW CHỈ ĐỌC' : ''}`);
});
server.on('error', () => {
  console.error(`Không mở được cổng ${port}. Dừng server cũ hoặc đổi PORT và APP_ORIGIN trong .env.`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await app.locals.drainAuthMail?.(); await db.$disconnect?.(); await app.locals.authPool.end(); process.exit(0); });
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 45000).unref();
});
