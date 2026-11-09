import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const logoPath = fileURLToPath(new URL('../../web/public/images/logo.png', import.meta.url));

function otpEmail({ title, intro, otp, action, footer, resetUrl }) {
  return {
    text: `${intro}\n\nMã OTP của bạn: ${otp}\n\nMã có hiệu lực trong 15 phút và chỉ được sử dụng một lần.${resetUrl ? `\n\nMở trang đặt lại mật khẩu: ${resetUrl}` : ''}\n\n${footer}`,
    html: `
      <!doctype html>
      <html lang="vi">
        <body style="margin:0;padding:0;background:#eef3ef;font-family:Arial,Helvetica,sans-serif;color:#24352c;">
          <div style="background:#294c3d;padding:36px 16px 48px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;">
              <tr>
                <td align="center" style="padding-bottom:22px;">
                  <img src="cid:amthucviet-logo" width="72" height="72" alt="Ẩm Thực Việt" style="display:block;border-radius:18px;background:#ffffff;padding:8px;box-sizing:border-box;">
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border-radius:24px;padding:38px 34px;box-shadow:0 12px 30px rgba(20,46,34,.16);">
                  <h1 style="margin:0 0 12px;text-align:center;color:#294c3d;font-size:26px;line-height:1.25;">${title}</h1>
                  <p style="margin:0 0 24px;text-align:center;color:#637168;font-size:15px;line-height:1.6;">${intro}</p>
                  <div style="margin:0 auto 24px;padding:18px 20px;text-align:center;background:#f0f7f2;border:1px solid #d5e8da;border-radius:14px;">
                    <div style="margin-bottom:7px;color:#637168;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Mã xác thực</div>
                    <strong style="color:#294c3d;font-size:34px;letter-spacing:8px;">${otp}</strong>
                  </div>
                  <p style="margin:0;text-align:center;color:#637168;font-size:13px;line-height:1.6;">Mã có hiệu lực trong <strong style="color:#294c3d;">15 phút</strong> và chỉ được sử dụng một lần.</p>
                  <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e8eee9;text-align:center;color:#849087;font-size:12px;line-height:1.6;">
                    ${action}
                    ${resetUrl ? `<div style="margin-top:18px;"><a href="${resetUrl}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#294c3d;color:#ffffff;text-decoration:none;font-weight:700;">Đặt lại mật khẩu</a></div>` : ''}
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:22px;color:#e3eee6;font-size:12px;line-height:1.6;">${footer}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `,
    attachments: [{ filename: 'logo.png', path: logoPath, cid: 'amthucviet-logo' }],
  };
}

export function mailConfig(env = process.env) {
  return {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 465),
    secure: env.SMTP_SECURE !== 'false',
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM || env.SMTP_USER,
  };
}

export function createMailer(config = mailConfig()) {
  if (!config.host || !config.user || !config.password || !config.from) return null;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return {
    async sendPasswordResetOtp({ to, otp, resetUrl }) {
      const email = otpEmail({
        title: 'Đặt lại mật khẩu',
        intro: 'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Ẩm Thực Việt.',
        otp,
        action: 'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.',
        footer: 'Ẩm Thực Việt · Hương vị thiên nhiên, khơi nguồn cảm hứng',
        resetUrl: resetUrl ? `${resetUrl}&reset=1` : undefined,
      });
      await transporter.sendMail({
        from: config.from,
        to,
        subject: 'Mã OTP đặt lại mật khẩu - Ẩm Thực Việt',
        ...email,
      });
    },
    async sendActivationOtp({ to, otp }) {
      const email = otpEmail({
        title: 'Kích hoạt tài khoản',
        intro: 'Chào mừng bạn đến với Ẩm Thực Việt! Hãy dùng mã dưới đây để kích hoạt tài khoản.',
        otp,
        action: 'Sau khi kích hoạt, bạn có thể đăng nhập và bắt đầu khám phá thực đơn.',
        footer: 'Ẩm Thực Việt · Hương vị thiên nhiên, khơi nguồn cảm hứng',
      });
      await transporter.sendMail({
        from: config.from,
        to,
        subject: 'Mã OTP kích hoạt tài khoản - Ẩm Thực Việt',
        ...email,
      });
    },
  };
}
