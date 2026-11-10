import { createLimits, loginNeedsCaptcha } from '../../../shared/server/auth/limits.js';
import { Router } from 'express';
import { createJwt } from './jwt.js';
import { email, validEmail, validPassword, hashPassword, verifyPassword, token, digest, createMac } from './crypto.js';
import { createMailSender, createMailTasks } from './mail.js';
import { createActivationDelivery } from './activation.js';
import { createRecaptchaVerifier, RecaptchaUnavailableError } from './recaptcha.js';

export function createAuth({ pool, mailer, secret, challengeSecret = secret, schema = 'block8_auth', siteOrigin = 'http://localhost:5173', from, logger = console, recaptchaVerifier = createRecaptchaVerifier(), jwt = createJwt({ secret }) } = {}) {
  if (!pool || !mailer || !/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid API auth configuration');
  if (typeof challengeSecret !== 'string' || Buffer.byteLength(challengeSecret) < 32) throw new Error('Auth challenge secret must contain at least 32 bytes');
  siteOrigin = new URL(siteOrigin).origin;
  const sql = statement => statement.replaceAll('block8_auth.', `${schema}.`);
  const q = (statement, params = []) => pool.query(sql(statement), params);
  async function tx(work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const value = await work({ query: (statement, params) => client.query(sql(statement), params) });
      await client.query('COMMIT'); return value;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const mac = createMac(challengeSecret);
  const send = createMailSender(mailer, { from, logger });
  const mailTasks = createMailTasks(logger);
  const deliverActivation = createActivationDelivery({ transaction: tx, send, mac });
  let dummyHash;
  const router = Router();
  const ok = (res, data = null) => res.json({ ok: true, data });
  const fail = (res, status, code, message, details = {}) => res.status(status).json({ ok: false, error: { code, message, ...details } });
  const limited = res => { res.set('Retry-After', '900'); return fail(res, 429, 'RATE_LIMITED', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'); };
  const limits = createLimits(q);
  const count = key => limits.count(key, true);
  async function attempts(req, purpose, identity) {
    const a = await count(`api:${purpose}:email:${identity}`), b = await count(`api:${purpose}:ip:${req.ip}`);
    return [a, b];
  }
  async function quota(req, purpose, identity, perEmail, perIp) {
    const [a, b] = await attempts(req, purpose, identity); return a > perEmail || b > perIp;
  }
  async function captcha(req, res) {
    try {
      const value = req.body.captcha ?? req.body['g-recaptcha-response'];
      if (typeof value !== 'string' || !value) { fail(res, 200, 'CAPTCHA_REQUIRED', 'Vui lòng xác nhận CAPTCHA.', { captchaRequired: true }); return false; }
      if (await recaptchaVerifier(value, req.ip)) return true;
      fail(res, 200, 'INVALID_CAPTCHA', 'CAPTCHA không hợp lệ. Vui lòng xác nhận lại.', { captchaRequired: true });
    } catch (error) {
      if (!(error instanceof RecaptchaUnavailableError)) throw error;
      fail(res, 503, 'CAPTCHA_UNAVAILABLE', 'Dịch vụ CAPTCHA tạm thời không khả dụng.', { captchaRequired: true });
    }
    return false;
  }
  function credentials(req, res, confirm = false) {
    if (!validPassword(req.body.password)) { fail(res, 200, 'VALIDATION_FAILED', 'Mật khẩu cần từ 15 đến 128 ký tự.', { fields: { password: 'Mật khẩu cần 15–128 ký tự.' } }); return false; }
    if (confirm && req.body.confirmPassword !== req.body.password) { fail(res, 200, 'VALIDATION_FAILED', 'Mật khẩu nhập lại không khớp.', { fields: { confirmPassword: 'Mật khẩu không khớp.' } }); return false; }
    return true;
  }
  async function claimResend(identity) {
    return tx(async client => {
      const key = `api:activation:${identity}`;
      await client.query('INSERT INTO block8_auth.mail_cooldowns(key,available_at) VALUES($1,$2) ON CONFLICT(key) DO NOTHING', [key, new Date(0)]);
      const row = (await client.query('SELECT available_at>now() AS waiting FROM block8_auth.mail_cooldowns WHERE key=$1 FOR UPDATE', [key])).rows[0];
      if (row.waiting) return false;
      await client.query("UPDATE block8_auth.mail_cooldowns SET available_at=now()+interval '60 seconds' WHERE key=$1", [key]); return true;
    });
  }
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    if (req.method === 'POST' && (!req.is('application/json') || !req.body || Array.isArray(req.body) || typeof req.body !== 'object')) return fail(res, 200, 'INVALID_REQUEST', 'Cần gửi dữ liệu JSON hợp lệ.');
    next();
  });
  const publicUser = user => ({ id: user.id, email: user.email, name: user.name, role: user.role });
  async function loadUser(req, res, next) {
    try {
      const user = (await q('SELECT id,email,name,role,status,email_verified_at FROM block8_auth.users WHERE id=$1', [Number(req.auth.sub)])).rows[0];
      if (!user || user.status !== 'active' || !user.email_verified_at) return fail(res, 401, 'UNAUTHENTICATED', 'Tài khoản không còn hoạt động. Vui lòng đăng nhập lại.');
      req.user = publicUser(user); return next();
    } catch (error) { return next(error); }
  }
  const requireAuth = (req, res, next) => jwt.requireAuth(req, res, () => loadUser(req, res, next));
  router.get('/me', requireAuth, (req, res) => ok(res, req.user));
  router.post('/register', async (req, res) => {
    const identity = email(req.body.email);
    if (!validEmail(identity)) return fail(res, 200, 'VALIDATION_FAILED', 'Email không hợp lệ.', { fields: { email: 'Email không hợp lệ.' } });
    if (!credentials(req, res, true)) return;
    if (await quota(req, 'register', identity, 3, 10)) return limited(res);
    if (!await captcha(req, res)) return;
    // Hash only after CAPTCHA, with the same work for new and existing addresses.
    const hashed = await hashPassword(req.body.password);
    await q('INSERT INTO block8_auth.users(email,name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING', [identity, typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 100) : '', hashed]);
    if (await claimResend(identity)) mailTasks.afterResponse(res, () => deliverActivation(identity));
    ok(res, { email: identity, requiresActivation: true, resendAfter: 60 });
  });
  router.post('/activate/resend', async (req, res) => {
    const identity = email(req.body.email);
    if (!validEmail(identity)) return fail(res, 200, 'VALIDATION_FAILED', 'Email không hợp lệ.');
    if (await quota(req, 'resend', identity, 5, 20)) return limited(res);
    if (!await claimResend(identity)) { res.set('Retry-After', '60'); return fail(res, 429, 'RATE_LIMITED', 'Vui lòng chờ trước khi gửi lại OTP.'); }
    mailTasks.afterResponse(res, () => deliverActivation(identity));
    ok(res, { resendAfter: 60 });
  });
  router.post('/activate', async (req, res) => {
    const identity = email(req.body.email), otp = req.body.otp;
    if (!validEmail(identity) || typeof otp !== 'string' || !/^[0-9]{6}$/.test(otp)) return fail(res, 200, 'INVALID_OTP', 'Nhập email và OTP gồm 6 chữ số.');
    if (await quota(req, 'activate', identity, 30, 100)) return limited(res);
    const result = await tx(async client => {
      const user = (await client.query('SELECT * FROM block8_auth.users WHERE email=$1 FOR UPDATE', [identity])).rows[0];
      if (!user || user.status !== 'pending') return 'bad';
      const challenge = (await client.query("SELECT * FROM block8_auth.activation WHERE user_id=$1 AND purpose='activation' FOR UPDATE", [user.id])).rows[0];
      if (!challenge || challenge.used_at) return 'bad';
      if (new Date(challenge.locked_until) > new Date()) return 'locked';
      if (challenge.locked_until) { challenge.attempts = 0; await client.query('UPDATE block8_auth.activation SET attempts=0,locked_until=NULL WHERE user_id=$1', [user.id]); }
      if (new Date(challenge.expires_at) <= new Date() || challenge.hash !== mac(`${user.id}:${otp}`)) {
        await client.query("UPDATE block8_auth.activation SET attempts=attempts+1,locked_until=CASE WHEN attempts+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE user_id=$1", [user.id]);
        return challenge.attempts + 1 >= 5 ? 'locked' : 'bad';
      }
      await client.query("UPDATE block8_auth.users SET status='active',email_verified_at=now() WHERE id=$1", [user.id]);
      await client.query('UPDATE block8_auth.activation SET used_at=now() WHERE user_id=$1', [user.id]); return 'ok';
    });
    if (result === 'locked') return limited(res);
    if (result !== 'ok') return fail(res, 200, 'INVALID_OTP', 'Mã không hợp lệ, hết hạn hoặc đã được sử dụng.');
    ok(res, { activated: true });
  });
  router.post('/login', async (req, res) => {
    const identity = email(req.body.email);
    if (!validEmail(identity) || typeof req.body.password !== 'string' || !req.body.password || req.body.password.length > 128) return fail(res, 200, 'VALIDATION_FAILED', 'Vui lòng nhập email và mật khẩu hợp lệ.');
    const keys = [`api:login:email:${identity}`, `api:login:ip:${req.ip}`];
    const failures = async key => (await q("SELECT count,locked_until FROM block8_auth.limits WHERE key=$1 AND (started_at>now()-interval '15 minutes' OR locked_until>now())", [key])).rows[0];
    const [emailFailures, ipFailures] = await Promise.all(keys.map(failures));
    const a = emailFailures?.count || 0, b = ipFailures?.count || 0;
    if (a >= 10 || b >= 50 || [emailFailures, ipFailures].some(row => row?.locked_until && new Date(row.locked_until) > new Date())) return limited(res);
    if (loginNeedsCaptcha(a, b) && !await captcha(req, res)) return;
    const user = (await q('SELECT * FROM block8_auth.users WHERE email=$1', [identity])).rows[0];
    dummyHash ||= hashPassword('dummy-password-for-timing');
    const correct = await verifyPassword(req.body.password, user?.password_hash || await dummyHash);
    if (!user || !correct) {
      const [x, y] = await Promise.all(keys.map(count));
      for (const [i, value] of [x, y].entries()) if (value >= (i ? 50 : 10)) await q("UPDATE block8_auth.limits SET locked_until=now()+interval '15 minutes' WHERE key=$1", [keys[i]]);
      if (x >= 10 || y >= 50) return limited(res);
      return fail(res, 200, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.', { captchaRequired: loginNeedsCaptcha(x, y) });
    }
    if (user.status !== 'active' || !user.email_verified_at) return fail(res, 200, 'ACCOUNT_NOT_ACTIVATED', 'Tài khoản chưa được kích hoạt. Vui lòng xác minh email.');
    ok(res, { accessToken: await jwt.sign(user), expiresIn: jwt.ttlSeconds, user: publicUser(user) });
  });
  router.post('/forgot', async (req, res) => {
    const identity = email(req.body.email);
    if (!validEmail(identity)) return fail(res, 200, 'VALIDATION_FAILED', 'Email không hợp lệ.');
    if (await quota(req, 'forgot', identity, 3, 10)) return limited(res);
    mailTasks.afterResponse(res, async () => {
      const user = (await q("SELECT * FROM block8_auth.users WHERE email=$1 AND status='active'", [identity])).rows[0];
      if (!user) return;
      const value = token();
      await tx(async client => {
        await client.query('SELECT id FROM block8_auth.users WHERE id=$1 FOR UPDATE', [user.id]);
        await send(identity, 'Đặt lại mật khẩu', `${siteOrigin}/reset?token=${value}`);
        await client.query('UPDATE block8_auth.resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [user.id]);
        await client.query('INSERT INTO block8_auth.resets(hash,user_id,expires_at) VALUES($1,$2,$3)', [digest(value), user.id, new Date(Date.now() + 900000)]);
      });
    });
    ok(res, { message: 'Nếu email phù hợp, liên kết đặt lại mật khẩu sẽ được gửi.' });
  });
  router.post('/reset', async (req, res) => {
    if (!credentials(req, res, true)) return;
    if (typeof req.body.token !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.token)) return fail(res, 200, 'INVALID_RESET_TOKEN', 'Liên kết đặt lại mật khẩu không hợp lệ.');
    if (await quota(req, 'reset', req.ip, 10, 10)) return limited(res);
    const hashed = await hashPassword(req.body.password);
    const recipient = await tx(async client => {
      const candidate = (await client.query('SELECT user_id FROM block8_auth.resets WHERE hash=$1', [digest(req.body.token)])).rows[0];
      if (!candidate) return null;
      const user = (await client.query('SELECT id,email,status FROM block8_auth.users WHERE id=$1 FOR UPDATE', [candidate.user_id])).rows[0];
      const reset = (await client.query('SELECT * FROM block8_auth.resets WHERE hash=$1 FOR UPDATE', [digest(req.body.token)])).rows[0];
      if (!reset || reset.used_at || new Date(reset.expires_at) <= new Date() || user?.status !== 'active') return null;
      await client.query('UPDATE block8_auth.users SET password_hash=$1,version=version+1 WHERE id=$2', [hashed, user.id]);
      await client.query('UPDATE block8_auth.resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [user.id]);
      // Invalidate SSR sessions too. JWTs intentionally remain valid until exp.
      await client.query("DELETE FROM block8_auth.session WHERE sess->>'userId'=$1", [String(user.id)]);
      return user.email;
    });
    if (!recipient) return fail(res, 200, 'INVALID_RESET_TOKEN', 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.');
    mailTasks.afterResponse(res, () => send(recipient, 'Mật khẩu đã được thay đổi', `Mật khẩu của bạn đã được thay đổi. Nếu bạn không thực hiện, hãy yêu cầu đặt lại tại ${siteOrigin}/forgot.`));
    ok(res, { changed: true });
  });
  return { router, requireAuth, jwt, pool, drainMail: () => mailTasks.drain() };
}
