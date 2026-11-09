import '../src/config/env.js';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { email, validEmail, validPassword, hashPassword } from '../src/auth/crypto.js';
const pool = new pg.Pool({ connectionString: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  if (process.argv.includes('--seed')) {
    const identity = email(process.env.API_SEED_EMAIL), password = process.env.API_SEED_PASSWORD;
    if (!validEmail(identity) || !validPassword(password)) throw new Error('Configure API_SEED_EMAIL and API_SEED_PASSWORD (15–128 characters)');
    await pool.query("INSERT INTO block8_auth.users(email,password_hash,role,status,email_verified_at) VALUES($1,$2,'admin','active',now()) ON CONFLICT(email) DO NOTHING", [identity, await hashPassword(password)]);
    console.log('API administrator seed completed; existing accounts were not changed');
  } else {
    await pool.query(await readFile(new URL('../migrations/001-auth.sql', import.meta.url), 'utf8'));
    console.log('API authentication schema ready');
  }
} finally { await pool.end(); }
