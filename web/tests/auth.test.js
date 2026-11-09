import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/api.js';
import { validSession, tokenClaims, safeRedirect, setSession, getSession } from '../src/session.js';
const token = exp => `header.${Buffer.from(JSON.stringify({ sub: '42', role: 'user', exp })).toString('base64url')}.signature`;
const session = { accessToken: token(Math.floor(Date.now() / 1000) + 300) };
const response = (status, body) => new Response(JSON.stringify(body), { status });
test('login sends credentials without Bearer; mutations send Bearer', async () => {
  const api = createClient('http://example.test', async (url, options) => {
    if (url.endsWith('/auth/login')) {
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(JSON.parse(options.body).email, 'user@example.test');
    } else assert.equal(options.headers.Authorization, `Bearer ${session.accessToken}`);
    return response(200, { ok: true, data: session });
  }, { session: () => session });
  await api('/auth/login', { auth: false, method: 'POST', data: { email: 'user@example.test', password: 'secret' } });
  await api('/dishes/3', { method: 'PATCH', data: {} });
});
test('register, activate and login stay anonymous even with a saved token', async () => {
  let sessionReads = 0;
  const paths = ['/auth/register', '/auth/activate', '/auth/login'];
  const seen = [];
  const api = createClient('http://example.test', async (url, options) => {
    seen.push(url);
    assert.equal(options.headers.Authorization, undefined);
    return response(200, { ok: true, data: null });
  }, { session: () => { sessionReads++; return session; } });
  for (const path of paths) await api(path, { auth: false, method: 'POST', data: {} });
  assert.equal(seen.length, 3);
  assert.equal(sessionReads, 0, 'anonymous requests must not read the stored token');
});
test('protected requests attach a token only after login has supplied one', async () => {
  let active = null;
  const headers = [];
  const api = createClient('', async (_, options) => {
    headers.push(options.headers.Authorization);
    return response(200, { ok: true, data: null });
  }, { session: () => active });
  await api('/dishes');
  active = session;
  await api('/dishes');
  assert.deepEqual(headers, [undefined, `Bearer ${session.accessToken}`]);
});
test('401 clears session; 403 preserves session; late 401 preserves newer login', async () => {
  let cleared = 0, active = session;
  for (const status of [401, 403]) {
    const api = createClient('', async () => response(status, { ok: false, error: { code: 'DENIED' } }), { session: () => active, clearSession: () => cleared++ });
    await assert.rejects(api('/dishes'), error => error.status === status);
  }
  assert.equal(cleared, 1);
  const api = createClient('', async () => { active = { accessToken: 'new-token' }; return response(401, {}); }, { session: () => active, clearSession: () => cleared++ });
  await assert.rejects(api('/dishes'));
  assert.equal(cleared, 1);
});
test('API retains validation errors and CAPTCHA requirements', async () => {
  for (const status of [200, 422]) {
    const api = createClient('', async () => response(status, { ok: false, error: { code: 'CAPTCHA_REQUIRED', captchaRequired: true, fields: { email: 'Invalid' } } }));
    await assert.rejects(api('/auth/login', { auth: false }), error => error.captchaRequired && error.fields.email === 'Invalid');
  }
});
test('UI checks expiry and rejects external redirect destinations', () => {
  assert.equal(tokenClaims(session.accessToken).sub, '42');
  assert.equal(validSession(session), true);
  assert.equal(validSession({ accessToken: token(1) }), false);
  assert.equal(validSession({ accessToken: 'invalid' }), false);
  assert.equal(safeRedirect('/admin/dishes?page=2'), '/admin/dishes?page=2');
  for (const value of ['//evil.test', 'https://evil.test', '/\\evil.test', '/\nevil.test']) assert.equal(safeRedirect(value), '/dishes');
});
test('remember choice switches stores and removes demo credentials', () => {
  const storage = () => { const map = new Map(); return { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  localStorage.setItem('viet_cuisine_accounts', 'plaintext passwords');
  setSession(session, true);
  assert.equal(localStorage.getItem('viet_cuisine_accounts'), undefined);
  assert.ok(localStorage.getItem('viet_cuisine_session'));
  setSession(session, false);
  assert.equal(localStorage.getItem('viet_cuisine_session'), undefined);
  assert.ok(sessionStorage.getItem('viet_cuisine_session'));
  setSession(null); assert.equal(getSession(), null);
});
