import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Guard the original visual assets and complete banner markup against redesigns.
const originalPage = execFileSync('git', ['show', 'HEAD:web/src/pages/AuthPage.jsx'], { encoding: 'utf8' });
const pageSource = readFileSync(new URL('../src/pages/AuthPage.jsx', import.meta.url), 'utf8');
const bannerStart = '{/* Cột phải:';
assert.equal(pageSource.slice(pageSource.indexOf(bannerStart)), originalPage.slice(originalPage.indexOf(bannerStart)));
assert.equal(readFileSync(new URL('../src/pages/auth.css', import.meta.url), 'utf8'), execFileSync('git', ['show', 'HEAD:web/src/pages/auth.css'], { encoding: 'utf8' }));

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [], calls = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.grecaptcha = {
      ready: callback => callback(), reset: () => {},
      render: (container, options) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Mock CAPTCHA';
        button.onclick = () => options.callback('mock-captcha-token'); container.append(button); return 1;
      },
    };
  });
  await page.route('**/recaptcha/**', route => route.abort());
  await page.route('http://localhost:3000/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    calls.push(path);
    let status = 200, body = { ok: true, data: {} };
    if (path === '/api/auth/login') {
      const data = request.postDataJSON();
      assert.equal(data.email, 'user@example.com');
      if (data.password === 'wrong-password') {
        status = 401; body = { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' } };
      } else {
        const claims = Buffer.from(JSON.stringify({ sub: '1', role: 'user', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
        body.data = { accessToken: `header.${claims}.signature`, user: { id: 1, email: data.email } };
      }
    }
    if (path === '/api/auth/register') {
      const data = request.postDataJSON();
      assert.equal(data.password, data.confirmPassword);
      assert.equal(data['g-recaptcha-response'], 'mock-captcha-token');
    }
    if (path === '/api/dishes') {
      assert.ok(request.headers().authorization?.startsWith('Bearer '));
      status = 403; body = { ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } };
    }
    await route.fulfill({ status, json: body, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('http://localhost:5179/admin/dishes');
  await page.waitForURL('**/login?redirect=*');
  await page.locator('#login-identity').fill('user@example.com');
  await page.locator('#login-pass').fill('wrong-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Email hoặc mật khẩu không đúng.' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('viet_cuisine_session')), null);
  await page.locator('#login-pass').fill('correct-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/admin/dishes');
  await page.getByText('Bạn không có quyền thực hiện thao tác này.').waitFor();
  await page.reload();
  await page.getByText('Bạn không có quyền thực hiện thao tác này.').waitFor();
  await page.getByRole('button', { name: /^Tài khoản của / }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.waitForURL('**/login?redirect=*');
  await page.goto('http://localhost:5179/signup');
  await page.locator('#signup-username').fill('eli_trekker');
  await page.locator('#signup-email').fill('user@example.com');
  await page.locator('#signup-password').fill('a-long-password-123');
  await page.screenshot({ path: '/tmp/block6-signup-preserved.png', fullPage: true });
  await page.getByLabel('Nhập lại mật khẩu').fill('different-password-123');
  await page.getByRole('button', { name: 'Bắt đầu ngay' }).click();
  await page.getByRole('alert').filter({ hasText: 'Mật khẩu nhập lại không khớp.' }).waitFor();
  await page.getByLabel('Nhập lại mật khẩu').fill('a-long-password-123');
  await page.getByRole('button', { name: 'Bắt đầu ngay' }).click();
  await page.getByRole('button', { name: 'Mock CAPTCHA' }).click();
  await page.getByRole('button', { name: 'Đăng ký và nhận OTP' }).click();
  await page.getByLabel('Mã OTP').waitFor();
  assert.equal(await page.getByRole('button', { name: /Gửi lại OTP sau/ }).isDisabled(), true);
  await page.getByLabel('Mã OTP').fill('123456');
  await page.getByRole('button', { name: 'Xác minh email', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Email đã xác minh' }).waitFor();
  await page.getByText('Quên mật khẩu?', { exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('user@example.com');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('status').filter({ hasText: 'Nếu email phù hợp' }).waitFor();
  await page.goto('http://localhost:5179/reset?token=reset-token');
  await page.getByLabel('Mật khẩu mới').fill('new-password-long-123');
  await page.getByLabel('Nhập lại mật khẩu').fill('new-password-long-123');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('status').filter({ hasText: 'Đã đổi mật khẩu' }).waitFor();
  for (const path of ['login', 'register', 'activate', 'forgot', 'reset']) assert.ok(calls.includes(`/api/auth/${path}`));
  assert.deepEqual(errors, []);
  console.log('Passed: original CSS/banner preserved; login, token, admin guard, 403, reload, logout, registration, confirmation, CAPTCHA, OTP, forgot/reset.');
} finally { await browser.close(); }
