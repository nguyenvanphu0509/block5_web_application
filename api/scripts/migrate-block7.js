import '../src/config/env.js';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
export const migration = (await Promise.all([
  '../prisma/migrations/20261026_block7_search/migration.sql',
  '../prisma/migrations/20261026_block7_fulltext_websearch/migration.sql',
].map(path => readFile(new URL(path, import.meta.url), 'utf8')))).join('\n');
export async function migrateBlock7(client, schema = 'public') {
  await client.query('BEGIN');
  try {
    await client.query("SELECT set_config('search_path', quote_ident($1) || ', public, extensions', true)", [schema]);
    await client.query(migration);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try { await client.connect(); await migrateBlock7(client); console.log('Block 7 search migration completed.'); }
  catch (error) { console.error('Migration failed:', error.code || error.name); process.exitCode = 1; }
  finally { await client.end(); }
}
