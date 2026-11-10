import { secret } from './config.js';
import { createMac } from '../../../shared/server/auth/crypto.js';
export { token, digest, email, validPassword, hashPassword, verifyPassword as verify } from '../../../shared/server/auth/crypto.js';
export const mac = value => createMac(secret())(value);
