import { createHash, createHmac, randomBytes, scrypt as rawScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(rawScrypt);
const ALGORITHM = 'HS256';

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function parseDuration(value) {
  const match = /^(\d+)([smhd])$/.exec(value || '15m');
  if (!match) throw new Error('JWT_EXPIRES_IN phải có dạng số kèm s, m, h hoặc d.');
  return Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[match[2]]);
}

function hashToken(value, secret) {
  return createHmac('sha256', secret).update(value).digest();
}

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const digest = await scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return `${salt}:${digest.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const [salt] = stored.split(':');
  if (!salt) return false;
  const candidate = await hashPassword(password, salt);
  const left = Buffer.from(candidate);
  const right = Buffer.from(stored);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createJwt(payload, { secret, expiresIn = '15m' }) {
  if (!secret) throw new Error('JWT_SECRET chưa được cấu hình.');
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: ALGORITHM, typ: 'JWT' }));
  const body = base64Url(JSON.stringify({ ...payload, iat: now, exp: now + parseDuration(expiresIn) }));
  const content = `${header}.${body}`;
  const signature = base64Url(hashToken(content, secret));
  return `${content}.${signature}`;
}

export function verifyJwt(token, { secret }, { allowExpired = false } = {}) {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  let parsedHeader;
  let parsedPayload;
  try {
    parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());
    parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
  if (!parsedHeader || typeof parsedHeader !== 'object' || !parsedPayload || typeof parsedPayload !== 'object') return null;
  if (parsedHeader.alg !== ALGORITHM || parsedHeader.typ !== 'JWT') return null;
  const expected = hashToken(`${header}.${payload}`, secret);
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  if (!Number.isInteger(parsedPayload.exp) || (!allowExpired && parsedPayload.exp <= Math.floor(Date.now() / 1000))) return null;
  return parsedPayload;
}

export function authConfig(env = process.env) {
  return {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN || '15m',
    exposeDevTokens: env.AUTH_EXPOSE_DEV_TOKENS === 'true',
    recaptchaSecret: env.RECAPTCHA_SECRET_KEY,
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY,
    recaptchaAllowedHostnames: (env.RECAPTCHA_ALLOWED_HOSTNAMES || 'localhost,127.0.0.1').split(',').map(value => value.trim()).filter(Boolean),
    recaptchaLoginThreshold: Number(env.RECAPTCHA_LOGIN_THRESHOLD || 3),
  };
}

export function bearerToken(header) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(String(header || ''));
  return match?.[1] || null;
}

export function randomToken() {
  return randomBytes(32).toString('base64url');
}

export function randomOtp() {
  return String(100000 + (randomBytes(4).readUInt32BE(0) % 900000));
}

export function tokenDigest(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}
