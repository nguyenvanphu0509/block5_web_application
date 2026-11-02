import dotenv from 'dotenv';
if (process.env.SSR_SKIP_ENV !== '1') dotenv.config({path:new URL('../../.env',import.meta.url),quiet:true});
export const origin=process.env.SSR_ORIGIN || 'http://localhost:3001';
export function secret(){ if(!process.env.SSR_SESSION_SECRET || process.env.SSR_SESSION_SECRET.length<32) throw new Error('SSR_SESSION_SECRET must contain at least 32 characters'); return process.env.SSR_SESSION_SECRET; }
