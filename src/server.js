import 'dotenv/config';
import { createApp } from './app.js';
import { createDatabaseClient } from './db/client.js';
import { createPreviewClient } from './db/preview.js';

const port = Number(process.env.PORT || 3000);
const preview = process.env.PREVIEW_MODE === 'true';
let db;
try { db = preview ? createPreviewClient() : createDatabaseClient(); }
catch (err) { console.error(err.message); process.exit(1); }
const app = createApp({ db, preview, origin: process.env.APP_ORIGIN || `http://localhost:${port}` });
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Block5 Kitchen: http://localhost:${port}${preview ? ' — PREVIEW CHỈ ĐỌC' : ''}`);
});
server.on('error', () => {
  console.error(`Không mở được cổng ${port}. Dừng server cũ hoặc đổi PORT và APP_ORIGIN trong .env.`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await db.$disconnect?.(); process.exit(0); });
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 1500).unref();
});
