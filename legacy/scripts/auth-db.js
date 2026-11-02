import '../src/auth/config.js';
import '../../api/src/config/env.js';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {email,hashPassword,validPassword} from '../src/auth/crypto.js';
const pool=new pg.Pool({connectionString:process.env.SSR_DATABASE_URL||process.env.DATABASE_URL});
try {
 if(process.argv.includes('--seed')){
 const e=email(process.env.SSR_SEED_EMAIL),p=process.env.SSR_SEED_PASSWORD;
 if(!e||!validPassword(p))throw new Error('Set SSR_SEED_EMAIL and SSR_SEED_PASSWORD (15–128 characters)');
 await pool.query("INSERT INTO block8_auth.users(email,password_hash,status,email_verified_at) VALUES($1,$2,'active',now()) ON CONFLICT(email) DO NOTHING",[e,await hashPassword(p)]);
 }else await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 console.log('Auth database ready');
}finally{await pool.end();}
