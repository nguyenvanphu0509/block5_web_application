import { HttpError } from '../validators/index.js';
import { imageSources } from '../../../shared/image-sources.js';
export function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src ${imageSources}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
  });
  next();
}
export function checkOrigin(origin) {
  const expected = new URL(origin).origin;
  return (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== expected) {
      return next(new HttpError(403, 'Nguồn gửi biểu mẫu không được phép.'));
    }
    next();
  };
}
