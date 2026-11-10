import '../api/src/config/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import request from 'supertest';
import { createAuth } from '../api/src/auth/index.js';
import { createApi } from '../api/src/app.js';
import { createFixture } from './fixtures.js';
const connectionString = process.env.AUTH_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL || (process.env.AUTH_TEST_USE_CONFIGURED_DB === '1' ? process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL : undefined);
test('PostgreSQL: OTP/reset consumption is atomic, expiration preserves password, resend cooldown', { skip: !connectionString, timeout: 90000 }, async () => {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 10000 });
  const schema = `auth_test_${randomUUID().replaceAll('-', '')}`, messages = [];
  const auth = createAuth({ pool, schema, secret: 'isolated-postgres-test-secret-32-bytes', recaptchaVerifier: async () => true, mailer: { sendMail: async message => { messages.push(message); return { accepted: [message.to] }; } } });
  try {
    await pool.query((await readFile(new URL('../api/migrations/001-auth.sql', import.meta.url), 'utf8')).replaceAll('block8_auth', schema));
    const app = createApi({ db: createFixture().db, auth });
    const payload = { email: 'isolated@example.test', password: 'isolated-password-123', confirmPassword: 'isolated-password-123', captcha: 'test' };
    await request(app).post('/api/auth/register').send(payload).expect(200); await auth.drainMail();
    await request(app).post('/api/auth/activate/resend').send({ email: payload.email }).expect(429);
    const otp = messages[0].text.match(/\d{6}/)[0];
    const activate = () => request(app).post('/api/auth/activate').send({ email: payload.email, otp });
    const outcomes = await Promise.all([activate(), activate()]);
    assert.equal(outcomes.filter(result => result.body.ok).length, 1);
    const login = await request(app).post('/api/auth/login').send(payload).expect(200);
    assert.ok(login.body.data.accessToken);
    const forgot = async () => { await request(app).post('/api/auth/forgot').send({ email: payload.email }); await auth.drainMail(); return messages.findLast(message => message.subject === 'Đặt lại mật khẩu').text.match(/token=([a-f0-9]+)/)[1]; };
    const resetToken = await forgot();
    const before = (await pool.query(`SELECT password_hash FROM ${schema}.users`)).rows[0].password_hash;
    await pool.query(`UPDATE ${schema}.resets SET expires_at=now()-interval '1 minute'`);
    const reset = { token: resetToken, password: 'new-isolated-password-123', confirmPassword: 'new-isolated-password-123' };
    assert.equal((await request(app).post('/api/auth/reset').send(reset)).body.error.code, 'INVALID_RESET_TOKEN');
    assert.equal((await pool.query(`SELECT password_hash FROM ${schema}.users`)).rows[0].password_hash, before);
    reset.token = await forgot();
    const changed = await Promise.all([request(app).post('/api/auth/reset').send(reset), request(app).post('/api/auth/reset').send(reset)]);
    assert.equal(changed.filter(result => result.body.ok).length, 1);
    await auth.drainMail();
    assert.ok((await request(app).post('/api/auth/login').send({ ...payload, password: reset.password })).body.data.accessToken);
  } finally {
    await auth.drainMail(); await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await pool.end();
  }
});
