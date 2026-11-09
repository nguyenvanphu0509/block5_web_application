import { hashPassword, randomToken, tokenDigest } from '../auth.js';
import { createCooldown, rateLimited } from './limits.js';
import { BusinessError } from '../validation.js';

const lifetimeMs = 15 * 60_000;
const resendDelayMs = 60_000;
const invalidLink = () => new BusinessError('INVALID_RESET_TOKEN', 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.');

export function registerPasswordResetRoutes(app, { db, origin, mailer, logger }) {
  const pendingMail = new Set();
  const cooldown = createCooldown();
  app.locals.drainPasswordResetMail = () => Promise.all(pendingMail);

  async function reserveResetLink(email) {
    const rawToken = randomToken();
    const record = await db.$transaction(async tx => {
      const [user] = await tx.$queryRaw`
        SELECT id, "tokenVersion" FROM users
        WHERE email = ${email} AND status = 'active'
        FOR NO KEY UPDATE`;
      if (!user) return null;

      const scope = { userId: user.id, tokenVersion: user.tokenVersion };
      const recent = await tx.passwordResetToken.findFirst({
        where: { ...scope, createdAt: { gt: new Date(Date.now() - resendDelayMs) } },
        select: { id: true },
      });
      if (recent) return { limited: true };

      const createdAt = new Date(Date.now());
      return tx.passwordResetToken.create({
        data: { ...scope, tokenHash: tokenDigest(rawToken), createdAt, expiresAt: new Date(createdAt.getTime() + lifetimeMs) },
      });
    });
    if (record?.limited) return record;
    return record ? { record, rawToken } : null;
  }

  async function sendResetLink(email, { record, rawToken }) {
    const resetUrl = new URL('/reset-password', origin);
    resetUrl.hash = new URLSearchParams({ token: rawToken }).toString();
    try {
      await mailer.sendPasswordResetLink({ to: email, resetUrl: resetUrl.href });
    } catch (error) {
      const code = ['EAUTH', 'ECONNECTION', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EDNS', 'ETLS', 'EENVELOPE', 'EMESSAGE', 'ENOENT'].includes(error?.code) ? error.code : 'DELIVERY_FAILED';
      const responseCode = Number.isInteger(error?.responseCode) ? error.responseCode : undefined;
      logger.error('Password reset email delivery failed', { code, responseCode });
      await db.passwordResetToken.deleteMany({ where: { id: record.id, usedAt: null } });
      return;
    }

    await db.passwordResetToken.deleteMany({
      where: { userId: record.userId, tokenVersion: record.tokenVersion, usedAt: null, id: { lt: record.id } },
    });
  }

  app.post('/api/auth/forgot-password', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BusinessError('VALIDATION_FAILED', 'Vui lòng nhập email hợp lệ.');
    }
    if (!mailer) {
      return res.status(503).json({ ok: false, error: { code: 'EMAIL_UNAVAILABLE', message: 'Dịch vụ gửi email chưa được cấu hình.' } });
    }

    if (cooldown(email, res)) return;

    const reservation = await reserveResetLink(email);
    if (reservation?.limited) { rateLimited(res); return; }
    // Delivery starts after the public response.
    const task = new Promise(resolve => setImmediate(resolve))
      .then(() => reservation && sendResetLink(email, reservation))
      .catch(error => {
        logger.error('Password reset email task failed', {
          code: error?.code || 'UNKNOWN',
          responseCode: Number.isInteger(error?.responseCode) ? error.responseCode : undefined,
          message: error?.message || 'Unknown password reset error',
        });
      });
    pendingMail.add(task);
    void task.then(() => pendingMail.delete(task));
    return res.json({ ok: true, data: { message: 'Nếu email đã đăng ký và được kích hoạt, hãy kiểm tra hộp thư đến hoặc thư rác để mở liên kết đặt lại mật khẩu.' } });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const token = req.body?.token;
    const password = req.body?.password;
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw invalidLink();
    if (typeof password !== 'string' || password.length < 15 || password.length > 128) {
      throw new BusinessError('VALIDATION_FAILED', 'Mật khẩu phải dài từ 15 đến 128 ký tự.');
    }

    const record = await db.passwordResetToken.findFirst({
      where: { tokenHash: tokenDigest(token), usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw invalidLink();

    const passwordHash = await hashPassword(password);
    await db.$transaction(async tx => {
      // Change the version first to serialize competing reset links for this account.
      const user = await tx.user.updateMany({
        where: { id: record.userId, tokenVersion: record.tokenVersion, status: 'active' },
        data: { passwordHash, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, captchaRequired: false, loginLockedUntil: null },
      });
      if (!user.count) throw invalidLink();

      const now = new Date();
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (!consumed.count) throw invalidLink();
    });
    return res.json({ ok: true, data: { message: 'Mật khẩu đã được đặt lại.' } });
  });
}
