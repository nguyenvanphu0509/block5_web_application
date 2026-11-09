import './config/env.js';
import { createDatabaseClient } from './db/client.js';
import { createApi } from './app.js';
import { createAuth } from './auth/index.js';
import pg from 'pg';
import nodemailer from 'nodemailer';

const db = createDatabaseClient();
const port = Number(process.env.API_PORT || process.env.PORT || 3000);
const pool = new pg.Pool({ connectionString: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
const auth = createAuth({
  pool, secret: process.env.JWT_SECRET, challengeSecret: process.env.AUTH_CHALLENGE_SECRET || process.env.JWT_SECRET,
  siteOrigin: process.env.SPA_ORIGIN || 'http://localhost:5173', from: process.env.SMTP_FROM,
  mailer: nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === '465',
    requireTLS: true, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  }),
});
const app = createApi({ db, auth, preview: process.env.PREVIEW_MODE === 'true', origin: process.env.SPA_ORIGIN || 'http://localhost:5173' });
const server = app.listen(port, '127.0.0.1', () => console.log(`Block6 API: http://localhost:${port}`));
server.on('error', () => { console.error(`Không mở được cổng API ${port}. Dừng server cũ hoặc đổi API_PORT.`); process.exitCode = 1; Promise.all([db.$disconnect(), pool.end()]); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { await auth.drainMail(); await Promise.all([db.$disconnect(), pool.end()]); process.exit(0); });
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 30000).unref();
});
