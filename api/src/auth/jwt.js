import { createHmac, timingSafeEqual } from 'node:crypto';

// Deliberately has no database/store dependency. Verification is entirely local.
export function createJwt({ secret, issuer = 'block6-api', audience = 'block6-spa', ttlSeconds = 900, now = () => Date.now() } = {}) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 900) throw new Error('JWT TTL must be 60–900 seconds');
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = value => createHmac('sha256', secret).update(value).digest();
  const roles = ['viewer', 'editor', 'admin'];
  function sign(user) {
    if (!user?.id || !roles.includes(user.role)) throw new Error('Invalid JWT subject/role');
    const iat = Math.floor(now() / 1000);
    const payload = { sub: String(user.id), role: user.role, iss: issuer, aud: audience, iat, exp: iat + ttlSeconds };
    const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`;
    return `${unsigned}.${signature(unsigned).toString('base64url')}`;
  }
  function verify(token) {
    try {
      if (typeof token !== 'string' || token.length > 4096) return null;
      const parts = token.split('.');
      if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
      const [header, payload, signed] = parts;
      const actual = Buffer.from(signed, 'base64url'), expected = signature(`${header}.${payload}`);
      if (actual.toString('base64url') !== signed || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
      const meta = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
      if (meta.alg !== 'HS256' || meta.typ !== 'JWT' || Object.keys(meta).some(key => !['alg', 'typ'].includes(key))) return null;
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const time = Math.floor(now() / 1000);
      if (!claims || typeof claims.sub !== 'string' || !/^[1-9][0-9]*$/.test(claims.sub) || !roles.includes(claims.role)
        || claims.iss !== issuer || claims.aud !== audience || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat)
        || claims.exp <= time || claims.iat > time || claims.exp <= claims.iat || claims.exp - claims.iat > ttlSeconds
        || (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > time))) return null;
      return claims;
    } catch { return null; }
  }
  function requireAuth(req, res, next) {
    res.set('Cache-Control', 'no-store');
    const match = /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(req.headers.authorization || '');
    const claims = match && verify(match[1]);
    if (!claims) return res.set('WWW-Authenticate', 'Bearer').status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.' } });
    req.auth = claims; next();
  }
  const requireRole = (...allowed) => (req, res, next) => allowed.includes(req.auth?.role) ? next()
    : res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } });
  return { sign, verify, requireAuth, requireRole, ttlSeconds };
}
