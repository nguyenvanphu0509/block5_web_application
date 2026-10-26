import '../api/src/config/env.js';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { migrateBlock7 } from '../api/scripts/migrate-block7.js';
export async function isolatedDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Configure TEST_DATABASE_URL or DATABASE_URL for isolated Block 7 tests.');
  const schema = `block7_test_${randomUUID().replaceAll('-', '')}`;
  const control = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  await control.connect();
  let db;
  async function close() {
    await db?.$disconnect();
    await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.end();
  }
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    const url = new URL(connectionString); url.searchParams.set('schema', schema);
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--config', 'api/prisma.config.ts'], { cwd: new URL('..', import.meta.url), env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 60000 });
    await migrateBlock7(control, schema);
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString, options: `-c search_path=${schema},public,extensions` }, { schema }) });
    const [current] = await db.$queryRawUnsafe('SELECT current_schema() AS schema');
    if (current.schema !== schema) throw new Error('Isolated database schema mismatch.');
    return { db, close, schema };
  } catch (error) { await close(); throw error; }
}
