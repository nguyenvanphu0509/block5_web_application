import { randomBytes, scrypt as raw, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(raw);
export const token = () => randomBytes(32).toString('hex');
export const digest = value => createHash('sha256').update(String(value)).digest('hex');
export const email = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const validPassword = value => typeof value === 'string' && value.length >= 15 && value.length <= 128;
export const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const createMac = secret => value => createHmac('sha256', secret).update(String(value)).digest('hex');
// Compatible with SSR password hashes so the same account database can be used.
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128 || typeof stored !== 'string' || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored)) return false;
  const actual = await hashPassword(password, stored.split(':')[0]);
  return timingSafeEqual(Buffer.from(actual), Buffer.from(stored));
}
