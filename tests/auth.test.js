import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApi } from '../api/src/app.js';
import { createJwt, hashPassword, tokenDigest } from '../api/src/auth.js';
import { createFixture } from './fixtures.js';

const password = 'a valid password for auth tests';
const passwordHash = await hashPassword(password);
const auth = { secret: 'test-only-secret', expiresIn: '15m', recaptchaLoginThreshold: 3, recaptchaSecret: 'test', recaptchaAllowedHostnames: ['localhost'] };
function setup(status = 'active') {
  const { db, storage } = createFixture();
  const users = [{ id: 1, email: 'viewer@example.test', username: 'viewer', role: 'viewer', status, tokenVersion: 0, passwordHash, failedLoginAttempts: 0, captchaRequired: false }];
  const tokens = [];
  const matches = (row, where) => Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(part => matches(row, part));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('gt' in value) return row[key] > value.gt;
    }
    return (row[key] ?? null) === value;
  });
  const model = rows => ({
    async findFirst({ where }) { return structuredClone([...rows].reverse().find(row => matches(row, where)) || null); },
    async findUnique({ where }) { return this.findFirst({ where }); },
    async create({ data }) { const row = { id: rows.length + 1, createdAt: new Date(), attempts: 0, usedAt: null, ...data }; rows.push(row); return structuredClone(row); },
    async update({ where, data }) {
      const row = rows.find(row => matches(row, where));
      for (const [key, value] of Object.entries(data)) row[key] = value?.increment ? row[key] + value.increment : value;
      return structuredClone(row);
    },
    async updateMany({ where, data }) { const selected = rows.filter(row => matches(row, where)); for (const row of selected) await this.update({ where: { id: row.id }, data }); return { count: selected.length }; },
    async deleteMany({ where }) { for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], where)) rows.splice(i, 1); },
  });
  db.user = model(users); db.accountToken = model(tokens);
  const raw = db.$queryRaw;
  db.$queryRaw = (query, ...args) => /FROM users/.test(query.join?.('') || query.text) ? Promise.resolve([{ id: 1 }]) : raw(query, ...args);
  const mail = [];
  const app = createApi({ db, auth, mailer: { sendActivationOtp: async data => mail.push(data) }, logger: { error() {} } });
  const jwt = (options = {}) => createJwt({ sub: '1', tokenVersion: users[0].tokenVersion }, { ...auth, ...options });
  return { app, db, storage, users, tokens, mail, jwt, model };
}

test('all active roles have CRUD; chefs and ingredients require tokens for every route', async () => {
  const { app, users, jwt } = setup();
  for (const resource of ['chefs', 'ingredients']) {
    for (const method of ['get', 'head', 'post', 'patch', 'delete']) {
      const path = `/api/${resource}${['head', 'patch', 'delete'].includes(method) ? '/1' : ''}`;
      await request(app)[method](path).expect(401);
    }
    await request(app).get(`/api/${resource}/1`).expect(401);
  }
  for (const role of ['viewer', 'chef', 'editor', 'admin']) {
    users[0].role = role;
    for (const [resource, payload] of Object.entries({ chefs: { name: role }, ingredients: { name: role, unit: 'g' }, dishes: { name: role, price: 1, chefId: 1 }, restaurants: { name: role, cuisine: 'Việt' } })) {
      const call = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${jwt()}`);
      const made = await call('post', `/api/${resource}`).send(payload).expect(200);
      assert.equal(made.body.ok, true);
      const path = `/api/${resource}/${made.body.data.id}`;
      assert.equal((await call('get', path)).body.ok, true);
      assert.equal((await call('patch', path).send({ name: 'Updated', ...(resource === 'dishes' ? { chefId: 2 } : {}) })).body.ok, true);
      assert.equal((await call('delete', path)).body.ok, true);
    }
  }
  users[0].status = 'disabled';
  await request(app).post('/api/dishes').set('Authorization', `Bearer ${jwt()}`).send({ name: 'Denied' }).expect(401);
});

test('registration new, duplicate email and duplicate username share exact HTTP 200 body', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, hostname: 'localhost' }));
  const { app, users, mail } = setup();
  const register = data => request(app).post('/api/auth/register').send({ email: 'new@example.test', username: 'new', password, captchaToken: 'test', role: 'admin', ...data }).expect(200);
  const fresh = await register({});
  assert.equal(users[1].role, 'viewer'); assert.equal(users[1].status, 'pending');
  assert.equal(mail.length, 1);
  assert.deepEqual((await register({ username: 'other' })).body, fresh.body);
  assert.deepEqual((await register({ email: 'other@example.test' })).body, fresh.body);
  assert.equal(mail.length, 1); assert.equal(fresh.body.data.otp, undefined);
});

test('OTP wrong attempts persist, fifth attempt blocks even the correct code; resend enforces cooldown', async () => {
  const { app, tokens, users, mail } = setup('pending');
  tokens.push({ id: 1, userId: 1, purpose: 'activation-otp', tokenHash: tokenDigest('123456'), usedAt: null, attempts: 0, createdAt: new Date(), expiresAt: new Date(Date.now() + 900_000) });
  const activate = otp => request(app).post('/api/auth/activate').send({ email: users[0].email, otp });
  for (let i = 0; i < 4; i++) assert.equal((await activate('000000').expect(200)).body.error.code, 'INVALID_OTP');
  await activate('000000').expect(429);
  await activate('123456').expect(429);
  assert.equal(tokens[0].attempts, 5); assert.equal(users[0].status, 'pending');
  const resend = () => request(app).post('/api/auth/resend-activation').send({ email: users[0].email });
  await resend().expect(429); assert.equal(mail.length, 0);
});

test('fresh resend invalidates old OTP, activates once and rejects repeated sends', async () => {
  const { app, users, tokens, mail } = setup('pending');
  tokens.push({ id: 1, userId: 1, purpose: 'activation-otp', tokenHash: tokenDigest('old'), usedAt: null, attempts: 5, createdAt: new Date(Date.now() - 61_000), expiresAt: new Date(Date.now() + 900_000) });
  const resend = () => request(app).post('/api/auth/resend-activation').send({ email: users[0].email });
  await resend().expect(200); await resend().expect(429);
  assert.equal(mail.length, 1); assert.equal(tokens.length, 1);
  const activate = () => request(app).post('/api/auth/activate').send({ email: users[0].email, otp: mail[0].otp });
  assert.equal((await activate().expect(200)).body.ok, true);
  assert.equal((await activate().expect(200)).body.error.code, 'INVALID_OTP');
});

test('login locks for fifteen minutes after five failures, then recovers and resets counters', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, hostname: 'localhost' }));
  const { app, users } = setup();
  const login = value => request(app).post('/api/auth/login').send({ email: users[0].email, password: value, captchaToken: 'test' });
  for (let i = 0; i < 4; i++) await login('wrong').expect(200);
  const locked = await login('wrong').expect(429); assert.equal(locked.headers['retry-after'], '900');
  await login(password).expect(429);
  users[0].loginLockedUntil = new Date(Date.now() - 1);
  const success = await login(password).expect(200);
  assert.ok(success.body.data.accessToken); assert.equal(users[0].failedLoginAttempts, 0); assert.equal(users[0].loginLockedUntil, null);
});

test('expired signed JWT differs from tampered/revoked JWT; password reset revokes old access', async () => {
  const { app, db, users, jwt, model } = setup();
  const me = token => request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal((await me(jwt({ expiresIn: '0s' })).expect(401)).body.error.code, 'TOKEN_EXPIRED');
  assert.equal((await me(jwt({ secret: 'wrong' })).expect(401)).body.error.code, 'UNAUTHENTICATED');
  const oldJwt = jwt(); await me(oldJwt).expect(200);
  const rawToken = 'a'.repeat(43);
  const resets = [{ id: 1, userId: 1, tokenVersion: 0, tokenHash: tokenDigest(rawToken), usedAt: null, expiresAt: new Date(Date.now() + 900_000) }];
  db.passwordResetToken = model(resets);
  const reset = () => request(app).post('/api/auth/reset-password').send({ token: rawToken, password });
  assert.equal((await reset().expect(200)).body.ok, true);
  assert.equal(users[0].tokenVersion, 1);
  assert.equal((await me(oldJwt).expect(401)).body.error.code, 'UNAUTHENTICATED');
  assert.equal((await reset().expect(200)).body.error.code, 'INVALID_RESET_TOKEN');
});
