import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newDb } from 'pg-mem';
import { createAuth } from '../../api/src/auth/index.js';
import { createApi } from '../../api/src/app.js';
import { createFixture } from '../../tests/fixtures.js';

const memory = newDb(), { Pool } = memory.adapters.createPg(), pool = new Pool();
await pool.query(await readFile(new URL('../../api/migrations/001-auth.sql', import.meta.url), 'utf8'));
const messages = [], errors = [];
const auth = createAuth({ pool, secret: 'integration-test-secret-at-least-32-bytes', siteOrigin: 'http://localhost:5179',
  recaptchaVerifier: async value => value === 'mock-captcha-token',
  mailer: { sendMail: async message => { messages.push(message); return { accepted: [message.to] }; } },
});
const app = createApi({ db: createFixture().db, auth, origin: 'http://localhost:5179' });
const server = await new Promise(resolve => { const server = app.listen(3189, 'localhost', () => resolve(server)); });
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  // Only external CAPTCHA and SMTP are doubles. API requests use the actual server.
  await page.addInitScript(() => {
    window.grecaptcha = { ready: callback => callback(), reset() {}, render(container, options) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Mock CAPTCHA';
      button.onclick = () => options.callback('mock-captcha-token'); container.append(button); return 1;
    } };
  });
  await page.route('**/recaptcha/**', route => route.abort());
  await page.goto('http://localhost:5179/signup');
  await page.locator('#signup-username').fill('API User');
  await page.locator('#signup-email').fill('browser@example.com');
  await page.locator('#signup-password').fill('valid-long-password-123');
  await page.getByLabel('Nhập lại mật khẩu').fill('different-long-password-123');
  await page.getByRole('button', { name: 'Bắt đầu ngay', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Mật khẩu nhập lại không khớp.' }).waitFor();
  assert.equal(messages.length, 0);
  await page.getByLabel('Nhập lại mật khẩu').fill('valid-long-password-123');
  await page.getByRole('button', { name: 'Bắt đầu ngay', exact: true }).click();
  await page.getByRole('button', { name: 'Mock CAPTCHA' }).click();
  await page.getByRole('button', { name: 'Đăng ký và nhận OTP' }).click();
  await page.getByLabel('Mã OTP').waitFor();
  assert.equal(messages.length, 1);
  await page.getByLabel('Mã OTP').fill(messages[0].text.match(/\d{6}/)[0]);
  await page.getByRole('button', { name: 'Xác minh email', exact: true }).click();
  await page.locator('#login-identity').fill('browser@example.com');
  await page.locator('#login-pass').fill('valid-long-password-123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/dishes');
  await page.locator('.dish-card').first().waitFor();
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('viet_cuisine_session')).accessToken);
  assert.equal(auth.jwt.verify(token).role, 'viewer');
  const avatar = page.getByRole('button', { name: 'Tài khoản của API User', exact: true });
  assert.equal(await avatar.textContent(), 'A');
  await avatar.click();
  const account = page.getByRole('region', { name: 'Thông tin tài khoản' });
  await account.getByText('browser@example.com', { exact: true }).waitFor();
  await account.getByText('API User', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await avatar.getAttribute('aria-expanded'), 'false');
  await avatar.click();
  await page.locator('main h1').click();
  assert.equal(await avatar.getAttribute('aria-expanded'), 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  await avatar.click();
  const bounds = await account.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390, 'account popup must fit mobile viewport');
  await page.screenshot({ path: '/tmp/block6-account-menu.png', fullPage: false });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('http://localhost:5179/admin/dishes/1/delete');
  await page.getByRole('button', { name: 'Xóa bản ghi', exact: true }).click();
  await page.getByText('Bạn không có quyền thực hiện thao tác này.').waitFor();
  // Verify directly through the SPA origin: no auth DB reads, even when offline.
  const query = pool.query.bind(pool), connect = pool.connect.bind(pool);
  let calls = 0;
  pool.query = async () => { calls++; throw new Error('DB offline'); };
  pool.connect = async () => { calls++; throw new Error('DB offline'); };
  const status = await page.evaluate(async token => (await fetch('http://localhost:3189/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })).status, token);
  assert.equal(status, 200); assert.equal(calls, 0);
  pool.query = query; pool.connect = connect;
  await page.getByRole('button', { name: /^Tài khoản của / }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.waitForURL('**/login?redirect=*');
  await page.getByText('Quên mật khẩu?', { exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('browser@example.com');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('status').filter({ hasText: 'Nếu email phù hợp' }).waitFor();
  await auth.drainMail();
  const resetToken = messages.find(message => message.subject === 'Đặt lại mật khẩu').text.match(/token=([a-f0-9]+)/)[1];
  await page.goto(`http://localhost:5179/reset?token=${resetToken}`);
  await page.getByLabel('Mật khẩu mới').fill('new-long-password-123');
  await page.getByLabel('Nhập lại mật khẩu').fill('new-long-password-123');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('status').filter({ hasText: 'Đã đổi mật khẩu' }).waitFor();
  await page.locator('#login-identity').fill('browser@example.com');
  await page.locator('#login-pass').fill('new-long-password-123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/dishes');
  await page.locator('.dish-card').first().waitFor();
  assert.deepEqual(errors, []);
  console.log('SPA/API integration passed: signup, CAPTCHA, OTP, real login/token, catalog, permissions, zero-DB JWT verification, forgot/reset, new password login.');
} finally {
  await browser?.close(); await auth.drainMail();
  await new Promise(resolve => server.close(resolve)); await pool.end();
}
