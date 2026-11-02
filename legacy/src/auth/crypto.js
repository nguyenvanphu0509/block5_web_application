import {randomBytes,scrypt as raw,timingSafeEqual,createHash,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
import {secret} from './config.js';
const scrypt=promisify(raw);
export const token=()=>randomBytes(32).toString('hex');
export const digest=x=>createHash('sha256').update(String(x)).digest('hex');
export const mac=x=>createHmac('sha256',secret()).update(String(x)).digest('hex');
export const email=x=>String(x||'').trim().toLowerCase();
export function validPassword(p){return typeof p==='string' && p.length>=15 && p.length<=128;}
export async function hashPassword(p,salt=randomBytes(16).toString('hex')){const h=await scrypt(p,salt,64,{N:131072,r:8,p:1,maxmem:256*1024*1024});return `${salt}:${h.toString('hex')}`;}
export async function verify(p,stored){if(typeof p!=='string'||p.length>128)return false;const h=await hashPassword(p,stored.split(':')[0]);return h.length===stored.length&&timingSafeEqual(Buffer.from(h),Buffer.from(stored));}
