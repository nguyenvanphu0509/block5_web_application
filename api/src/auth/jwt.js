import { SignJWT, jwtVerify } from 'jose';

// Cryptographic verification has no database dependency. Account loading is separate.
export function createJwt({ secret, issuer = 'block6-api', audience = 'block6-spa', ttlSeconds = 900, now = () => Date.now() } = {}) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 900) throw new Error('JWT TTL must be 60–900 seconds');
  const key = new TextEncoder().encode(secret);
  async function sign(user) {
    if (!/^[1-9][0-9]*$/.test(String(user?.id))) throw new Error('Invalid JWT subject');
    const iat = Math.floor(now() / 1000);
    return new SignJWT({ role: user.role }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(String(user.id)).setIssuer(issuer).setAudience(audience).setIssuedAt(iat).setExpirationTime(iat + ttlSeconds).sign(key);
  }
  async function verified(token) {
    if (typeof token !== 'string' || token.length > 4096) throw new Error('Invalid token');
    const { payload, protectedHeader } = await jwtVerify(token, key, {
      algorithms: ['HS256'], issuer, audience, typ: 'JWT', currentDate: new Date(now()), requiredClaims: ['sub', 'exp', 'iat'],
    });
    if (Object.keys(protectedHeader).some(key => !['alg', 'typ'].includes(key)) || typeof payload.sub !== 'string'
      || !/^[1-9][0-9]*$/.test(payload.sub) || Number(payload.sub) > 2147483647
      || !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) || payload.iat > Math.floor(now() / 1000)
      || payload.exp <= payload.iat || payload.exp - payload.iat > ttlSeconds) throw new Error('Invalid claims');
    return payload;
  }
  async function verify(token) { try { return await verified(token); } catch { return null; } }
  async function requireAuth(req, res, next) {
    res.set('Cache-Control', 'no-store');
    try {
      const match = /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(req.headers.authorization || '');
      if (!match) throw new Error('Missing Bearer');
      req.auth = await verified(match[1]);
    } catch (error) {
      const code = error.code === 'ERR_JWT_EXPIRED' ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED';
      return res.set('WWW-Authenticate', 'Bearer').status(401).json({ ok: false, error: { code, message: 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.' } });
    }
    return next();
  }
  return { sign, verify, requireAuth, ttlSeconds };
}
