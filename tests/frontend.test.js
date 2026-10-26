import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import request from 'supertest';
import { createClient, ApiError } from '../web/src/api.js';
import { createWebServer } from '../web/server.js';

test('API client distinguishes transport, HTTP, protocol and business errors', async () => {
  for (const [fetcher, kind, code] of [
    [async () => { throw new TypeError('network'); }, 'technical'],
    [async () => new Response('broken', { status: 500 }), 'technical'],
    [async () => new Response('html', { status: 200 }), 'technical'],
    [async () => Response.json({ wrong: true }), 'technical'],
    [async () => Response.json({ ok: true }), 'technical'],
    [async () => Response.json({ ok: false, error: { code: 'NOT_FOUND', message: 'missing' } }), 'business', 'NOT_FOUND'],
    [async () => Response.json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'invalid', fields: { name: 'required' } } }), 'business', 'VALIDATION_FAILED'],
  ]) {
    await assert.rejects(createClient('http://api', fetcher)('/dishes'), error => error instanceof ApiError && error.type === kind && error.code === code);
  }
});
test('API client keeps base URL, JSON headers and multipart payload in one place', async () => {
  let seen;
  const signal = new AbortController().signal;
  const client = createClient('http://api/', async (url, options) => { seen = { url, options }; return Response.json({ ok: true, data: { id: 1 } }); });
  const result = await client('/dishes/1', { method: 'PATCH', data: { available: false }, signal });
  assert.equal(result.data.id, 1); assert.equal(seen.url, 'http://api/api/dishes/1');
  assert.equal(seen.options.headers['Content-Type'], 'application/json'); assert.equal(seen.options.signal, signal);
  assert.deepEqual(JSON.parse(seen.options.body), { available: false });
  await client('/dishes', { method: 'POST', data: { name: 'x' }, file: new File(['image'], 'x.png', { type: 'image/png' }) });
  assert.equal(seen.options.headers['Content-Type'], undefined);
  assert.deepEqual(JSON.parse(seen.options.body.get('payload')), { name: 'x' });
  assert.equal(seen.options.body.get('imageFile').name, 'x.png');
});
test('API client preserves aborts instead of displaying a technical error', async () => {
  const abort = new DOMException('aborted', 'AbortError');
  const client = createClient('', async () => { throw abort; });
  await assert.rejects(client('/dishes'), error => error === abort);
});

test('production SPA fallback serves deep links while API and missing assets remain 404', { skip: !existsSync(new URL('../web/dist/index.html', import.meta.url)) }, async () => {
  const app = createWebServer();
  for (const path of ['/', '/dishes/1', '/dishes/1.5', '/admin/ingredients/1/edit', '/unknown']) {
    const res = await request(app).get(path).set('Accept', 'text/html').expect(200).expect('Content-Type', /html/);
    assert.match(res.text, /id="root"/); assert.doesNotMatch(res.text, /DATABASE_URL|SERVICE_ROLE_KEY/);
    assert.match(res.headers['content-security-policy'], /connect-src 'self' http:\/\/localhost:3000/);
  }
  await request(app).get('/api/wrong').set('Accept', 'text/html').expect(404);
  await request(app).get('/assets/missing.js').expect(404);
  await request(app).post('/dishes/1').expect(404);
});
