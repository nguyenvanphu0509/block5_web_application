const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export class RecaptchaUnavailableError extends Error {
  constructor() {
    super('reCAPTCHA verification service unavailable');
    this.name = 'RecaptchaUnavailableError';
  }
}

export function createRecaptchaVerifier({
  secretKey = process.env.RECAPTCHA_SECRET_KEY,
  allowedHostnames = process.env.RECAPTCHA_ALLOWED_HOSTNAMES,
  fetchImpl = fetch,
  logger = console,
} = {}) {
  const hostnames = String(allowedHostnames || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  return async (response, remoteIp) => {
    if (!secretKey || !response) return false;
    const body = new URLSearchParams({ secret: secretKey, response });
    if (remoteIp) body.set('remoteip', remoteIp);
    let result;
    try {
      const verification = await fetchImpl(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!verification.ok) throw new RecaptchaUnavailableError();
      result = await verification.json();
    } catch (error) {
      if (error instanceof RecaptchaUnavailableError) throw error;
      logger.warn?.('reCAPTCHA verification failed', { code: 'VERIFY_UNAVAILABLE' });
      throw new RecaptchaUnavailableError();
    }
    return result?.success === true
      && hostnames.length > 0
      && hostnames.includes(String(result.hostname || '').toLowerCase());
  };
}
