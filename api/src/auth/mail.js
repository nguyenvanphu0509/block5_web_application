export class MailDeliveryError extends Error {
  constructor() { super('Email service could not accept the message'); this.name = 'MailDeliveryError'; }
}

// Never log recipients, message contents, SMTP response text or credentials.
// One retry only for explicit temporary failures, with the SAME message/OTP.
export function createMailSender(mailer, {from, logger = console} = {}) {
  return async (to, subject, text) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const info = await mailer.sendMail({from, to, subject, text});
        if (Array.isArray(info?.accepted) && info.accepted.length === 0) throw new MailDeliveryError();
        return;
      } catch (error) {
        const code = ['EAUTH','ECONNECTION','ECONNRESET','ECONNREFUSED','ETIMEDOUT','EDNS','EENVELOPE','EMESSAGE'].includes(error.code) ? error.code : 'DELIVERY_FAILED';
        const responseCode = Number.isInteger(error.responseCode) ? error.responseCode : undefined;
        const temporary = ['ECONNECTION','ECONNRESET','ECONNREFUSED','ETIMEDOUT','EDNS'].includes(code) || (responseCode >= 400 && responseCode < 500);
        if (temporary && attempt === 0) {
          logger.warn?.('Temporary API email failure; retrying', {code, responseCode});
          await new Promise(resolve => setTimeout(resolve, 250));
          continue;
        }
        logger.error('API email delivery failed', {code, responseCode, attempts: attempt + 1});
        throw new MailDeliveryError();
      }
    }
  };
}

// Begin delivery only after the HTTP response is sent. Account existence and
// SMTP latency must not influence the public response. Graceful shutdown drains
// pending work; abrupt process failure can require the user to request again.
export function createMailTasks(logger = console) {
  const pending = new Set();
  return {
    afterResponse(res, task) {
      const work = new Promise(resolve => {
        res.once('finish', () => setImmediate(async () => {
          try { await task(); }
          catch (error) {
            if (!(error instanceof MailDeliveryError)) logger.error('API background email task failed');
          } finally { resolve(); }
        }));
        res.once('close', () => { if (!res.writableFinished) resolve(); });
      });
      pending.add(work);
      work.then(() => pending.delete(work));
    },
    async drain() {
      while (pending.size) await Promise.all([...pending]);
    },
  };
}
