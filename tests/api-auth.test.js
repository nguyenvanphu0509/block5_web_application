import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { newDb } from 'pg-mem';
import { createAuth } from '../api/src/auth/index.js';
import { createJwt } from '../api/src/auth/jwt.js';
import { createApi } from '../api/src/app.js';
import { createFixture } from './fixtures.js';
const secret = 'test-key-only-at-least-32-bytes-long';
const logger = { error() {}, warn() {} };
async function setup({ recaptchaVerifier = async () => true, mailer, jwt } = {}) {
  const memory = newDb(), { Pool } = memory.adapters.createPg(), pool = new Pool();
  await pool.query(await readFile(new URL('../api/migrations/001-auth.sql', import.meta.url), 'utf8'));
  const messages = [];
  const auth = createAuth({ pool, secret, logger, recaptchaVerifier, jwt, mailer: mailer || { sendMail: async message => { messages.push(message); return { accepted: [message.to] }; } } });
  const fixture = createFixture(), app = createApi({ db: fixture.db, auth, logger });
  return { app, pool, auth, messages, fixture };
}
const payload = { email: 'new@example.com', name: 'New user', password: 'valid-long-password-123', confirmPassword: 'valid-long-password-123', 'g-recaptcha-response': 'captcha' };

test('API registration → OTP → JWT → permissions → forgot/reset with a real SQL adapter', async () => {
  const { app, pool, auth, messages } = await setup();
  try {
    await request(app).post('/api/auth/register').send({ ...payload, confirmPassword: 'mismatch' }).expect(400);
    assert.equal((await pool.query('SELECT * FROM block8_auth.users')).rows.length, 0);
    await request(app).post('/api/auth/register').send({ ...payload, role: 'admin' }).expect(200);
    const user = (await pool.query('SELECT * FROM block8_auth.users')).rows[0];
    assert.equal(user.role, 'viewer'); assert.equal(user.status, 'pending');
    assert.notEqual(user.password_hash, payload.password);
    assert.equal(messages.length, 1);
    await request(app).post('/api/auth/login').send(payload).expect(401);
    const otp = messages[0].text.match(/\d{6}/)[0];
    await request(app).post('/api/auth/activate').send({ email: payload.email, otp: '000000' }).expect(400);
    await request(app).post('/api/auth/activate').send({ email: payload.email, otp }).expect(200);
    await request(app).post('/api/auth/activate').send({ email: payload.email, otp }).expect(400);
    const login = await request(app).post('/api/auth/login').send(payload).expect(200);
    const token = login.body.data.accessToken;
    assert.equal(auth.jwt.verify(token).role, 'viewer');
    assert.equal(login.body.data.user.password_hash, undefined);
    await request(app).get('/api/dishes').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).patch('/api/dishes/1').set('Authorization', `Bearer ${token}`).send({ name: 'Forbidden' }).expect(403);
    await request(app).get('/api/dishes').expect(401);
    await request(app).post('/api/auth/forgot').send({ email: payload.email }).expect(200);
    await auth.drainMail();
    const reset = messages.find(message => message.subject === 'Đặt lại mật khẩu').text.match(/token=([a-f0-9]+)/)[1];
    const next = { token: reset, password: 'new-long-password-123', confirmPassword: 'new-long-password-123' };
    await request(app).post('/api/auth/reset').send(next).expect(200);
    await auth.drainMail();
    await request(app).post('/api/auth/reset').send(next).expect(400);
    await request(app).post('/api/auth/login').send(payload).expect(401);
    await request(app).post('/api/auth/login').send({ ...payload, password: next.password }).expect(200);
    // Stateless JWT intentionally remains valid until its short expiration.
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  } finally { await auth.drainMail(); await pool.end(); }
});

test('register/activate/login require no JWT; only successful login issues an access token', async () => {
  const jwt = createJwt({ secret });
  let verifications = 0, issued = 0;
  const authJwt = {
    ...jwt,
    requireAuth(req, res, next) { verifications++; return jwt.requireAuth(req, res, next); },
    sign(user) { issued++; return jwt.sign(user); },
  };
  const { app, pool, auth, messages } = await setup({ jwt: authJwt });
  try {
    const registered = await request(app).post('/api/auth/register').send(payload).expect(200);
    assert.equal(registered.body.data.accessToken, undefined);
    assert.equal(registered.headers['set-cookie'], undefined);
    assert.equal(issued, 0);
    await request(app).get('/api/dishes').expect(401);
    assert.equal(verifications, 1);
    verifications = 0;
    const pendingLogin = await request(app).post('/api/auth/login').send(payload).expect(401);
    assert.equal(pendingLogin.body.data?.accessToken, undefined);
    assert.equal(issued, 0);
    const otp = messages[0].text.match(/\d{6}/)[0];
    const activated = await request(app).post('/api/auth/activate').send({ email: payload.email, otp }).expect(200);
    assert.equal(activated.body.data.accessToken, undefined);
    assert.equal(issued, 0);
    const wrongLogin = await request(app).post('/api/auth/login').send({ ...payload, password: 'incorrect-password' }).expect(401);
    assert.equal(wrongLogin.body.data?.accessToken, undefined);
    const loggedIn = await request(app).post('/api/auth/login').send(payload).expect(200);
    assert.equal(typeof loggedIn.body.data.accessToken, 'string');
    assert.equal(issued, 1);
    assert.equal(verifications, 0, 'anonymous routes must never call JWT verification');
    await request(app).get('/api/dishes').set('Authorization', `Bearer ${loggedIn.body.data.accessToken}`).expect(200);
    assert.equal(verifications, 1);
  } finally { await auth.drainMail(); await pool.end(); }
});

test('JWT verification and role checks make ZERO database calls, including during DB outage', async () => {
  const { app, pool, auth, fixture } = await setup();
  let calls = 0;
  pool.query = async () => { calls++; throw new Error('Database offline'); };
  pool.connect = async () => { calls++; throw new Error('Database offline'); };
  const viewer = auth.jwt.sign({ id: 12, role: 'viewer' }), admin = auth.jwt.sign({ id: 13, role: 'admin' });
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${viewer}`).expect(200);
  await request(app).get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${viewer}tampered`).expect(401);
  fixture.db.dish.findUnique = async () => { throw new Error('Role denial must precede resource lookup'); };
  await request(app).patch('/api/dishes/1').set('Authorization', `Bearer ${viewer}`).send({ name: 'Denied' }).expect(403);
  await request(app).delete('/api/dishes/1').set('Authorization', `Bearer ${viewer}`).expect(403);
  await request(app).get('/api/auth/me').set('Authorization', `Bearer ${admin}`).expect(200);
  assert.equal(calls, 0, 'verification and permission checks must never query/connect to DB');
  await pool.end();
});

test('JWT rejects tampering, expiration, wrong algorithms, issuer/audience and invalid claims', () => {
  let time = 1000000;
  const jwt = createJwt({ secret, now: () => time });
  const token = jwt.sign({ id: 1, role: 'admin' });
  assert.equal(jwt.verify(token).sub, '1');
  const signed = (claims, header = { alg: 'HS256', typ: 'JWT' }) => {
    const body = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`;
    return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
  };
  const claims = jwt.verify(token);
  for (const update of [{ aud: 'other' }, { iss: 'other' }, { exp: 1000 }, { exp: '1900' }, { iat: 1001 }, { nbf: 1001 }, { sub: '' }, { role: 'superuser' }]) assert.equal(jwt.verify(signed({ ...claims, ...update })), null);
  assert.equal(jwt.verify(signed(claims, { alg: 'none', typ: 'JWT' })), null);
  assert.equal(jwt.verify(signed(claims, { alg: 'HS256', typ: 'JWT', jku: 'https://evil.test/key' })), null);
  assert.equal(jwt.verify(token + 'x'), null);
  time += 900000; assert.equal(jwt.verify(token), null);
});

test('CAPTCHA is enforced on registration and repeated login, with rate limits', async () => {
  const { app, pool } = await setup({ recaptchaVerifier: async () => false });
  try {
    const denied = await request(app).post('/api/auth/register').send(payload).expect(400);
    assert.equal(denied.body.error.captchaRequired, true);
    assert.equal((await pool.query('SELECT * FROM block8_auth.users')).rows.length, 0);
    for (let i = 0; i < 3; i++) await request(app).post('/api/auth/login').send(payload).expect(401);
    const challenge = await request(app).post('/api/auth/login').send(payload).expect(400);
    assert.equal(challenge.body.error.code, 'CAPTCHA_REQUIRED');
    for (let i = 4; i < 10; i++) await request(app).post('/api/auth/login').send(payload).expect(400);
    const limited = await request(app).post('/api/auth/login').send(payload).expect(429);
    assert.equal(limited.headers['retry-after'], '900');
  } finally { await pool.end(); }
});

test('authorization preflight and fail-closed API configuration', async () => {
  const app = createApi({ db: createFixture().db, logger });
  await request(app).get('/api/dishes').expect(503);
  const allowed = await request(app).options('/api/dishes/1').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'PATCH').set('Access-Control-Request-Headers', 'content-type,authorization').expect(204);
  assert.match(allowed.headers['access-control-allow-headers'], /Authorization/);
  await request(app).get('/api/home').expect(200);
});
