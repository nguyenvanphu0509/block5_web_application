import {randomInt} from 'node:crypto';
import {mac} from './crypto.js';
import {MailDeliveryError} from './mail.js';

export function createActivationDelivery({transaction, send}) {
  return async email => {
    try {
      return await transaction(async client => {
        // Activation and delivery take locks in the same order.
        const user = (await client.query('SELECT * FROM block8_auth.users WHERE email=$1 FOR UPDATE', [email])).rows[0];
        if (!user || user.status !== 'pending') return 'noop';
        const challenge = (await client.query("SELECT * FROM block8_auth.activation WHERE user_id=$1 AND purpose='activation' FOR UPDATE", [user.id])).rows[0];
        if (challenge && new Date(challenge.locked_until) > new Date()) return 'locked';
        if (challenge && Date.now() - new Date(challenge.last_sent_at).getTime() < 60000) return 'cooldown';
        const otp = String(randomInt(100000, 1000000));
        // Preserve the previous code and cooldown if SMTP rejects the new email.
        // SMTP acceptance is not a guarantee of inbox delivery (spam/delay can follow).
        await send(user.email, 'Kích hoạt tài khoản', `Mã OTP của bạn: ${otp}. Có hiệu lực 10 phút.`);
        const sentAt = new Date();
        await client.query(`INSERT INTO block8_auth.activation(user_id,hash,expires_at,last_sent_at,purpose)
          VALUES($1,$2,$3,$4,'activation') ON CONFLICT(user_id) DO UPDATE SET
          hash=$2,expires_at=$3,last_sent_at=$4,used_at=NULL,purpose='activation'`,
          [user.id, mac(`${user.id}:${otp}`), new Date(sentAt.getTime() + 600000), sentAt]);
        return 'sent';
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) return 'failed';
      throw error;
    }
  };
}
