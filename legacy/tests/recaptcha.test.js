import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecaptchaVerifier, RecaptchaUnavailableError } from '../src/auth/recaptcha.js';

function response(body, ok = true) {
  return { ok, async json() { return body; } };
}

test('reCAPTCHA v2 accepts successful response for an allowed hostname', async () => {
  let request;
  const verify = createRecaptchaVerifier({
    secretKey: 'server-secret',
    allowedHostnames: 'localhost,127.0.0.1',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({ success: true, hostname: 'localhost' });
    },
  });
  assert.equal(await verify('google-token', '127.0.0.1'), true);
  assert.equal(request.url, 'https://www.google.com/recaptcha/api/siteverify');
  assert.equal(request.options.method, 'POST');
  assert.match(String(request.options.body), /secret=server-secret/);
  assert.match(String(request.options.body), /response=google-token/);
});

test('reCAPTCHA v2 rejects failed or unexpected-host responses', async () => {
  const failed = createRecaptchaVerifier({
    secretKey: 'server-secret',
    allowedHostnames: 'localhost',
    fetchImpl: async () => response({ success: false }),
  });
  assert.equal(await failed('bad-token'), false);

  const wrongHost = createRecaptchaVerifier({
    secretKey: 'server-secret',
    allowedHostnames: 'localhost',
    fetchImpl: async () => response({ success: true, hostname: 'evil.example' }),
  });
  assert.equal(await wrongHost('token'), false);
});

test('reCAPTCHA v2 fails closed when Google is unavailable or configuration is missing', async () => {
  const unavailable = createRecaptchaVerifier({
    secretKey: 'server-secret',
    logger: { warn() {} },
    fetchImpl: async () => { throw new Error('network'); },
  });
  await assert.rejects(() => unavailable('token'), RecaptchaUnavailableError);

  const missing = createRecaptchaVerifier({ secretKey: '' });
  assert.equal(await missing('token'), false);
});
