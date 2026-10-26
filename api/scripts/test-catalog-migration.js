import '../src/config/env.js';
import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const schema = `catalog_check_${Date.now()}`;
try {
  await client.connect();
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`CREATE TABLE ${schema}.dishes (LIKE public.dishes INCLUDING DEFAULTS INCLUDING CONSTRAINTS)`);
  await client.query(`CREATE SEQUENCE ${schema}.dishes_id_seq OWNED BY ${schema}.dishes.id`);
  await client.query(`ALTER TABLE ${schema}.dishes ALTER COLUMN id SET DEFAULT nextval('${schema}.dishes_id_seq')`);
  await client.query(`ALTER TABLE ${schema}.dishes ADD PRIMARY KEY (id)`);
  const migrated = (await client.query("SELECT to_regclass('public.restaurant_import_archive') AS archive")).rows[0].archive;
  if (migrated) {
    await client.query(`INSERT INTO ${schema}.dishes SELECT (json_populate_record(NULL::${schema}.dishes,record::json)).* FROM public.restaurant_import_archive`);
    await client.query(`INSERT INTO ${schema}.dishes SELECT * FROM public.dishes WHERE "restaurantId" IS NULL AND "importKey" IS NULL AND "michelinUrl" IS NULL`);
  } else await client.query(`INSERT INTO ${schema}.dishes SELECT * FROM public.dishes`);
  const sql = readFileSync(new URL('../prisma/migrations/20261012_restaurant_catalog/migration.sql', import.meta.url), 'utf8').replaceAll('public.', `${schema}.`).replaceAll('search_path=public', `search_path=${schema}`);
  await client.query(sql);
  const counts = (await client.query(`SELECT (SELECT count(*)::int FROM ${schema}.restaurants) restaurants, (SELECT count(*)::int FROM ${schema}.dishes) dishes, (SELECT count(*)::int FROM ${schema}.restaurant_import_archive) archived`)).rows[0];
  assert.deepEqual(counts, { restaurants: 36, dishes: 69, archived: 36 });
  assert.equal((await client.query(`SELECT name FROM ${schema}.dishes WHERE id=39`)).rows[0].name, 'ice_cream');
  assert.ok((await client.query(`SELECT id FROM ${schema}.restaurants WHERE "searchText" LIKE '%quan 1%'`)).rowCount > 0);
  assert.ok((await client.query(`SELECT id FROM ${schema}.restaurants WHERE "searchText" LIKE '%mon chay%'`)).rowCount > 0);
  await client.query(sql);
  assert.equal((await client.query(`SELECT count(*)::int count FROM ${schema}.dishes`)).rows[0].count, 69);
  await client.query(`UPDATE ${schema}.dishes SET name='Món kiểm thử độc nhất' WHERE "importKey"=(SELECT "importKey" FROM ${schema}.dishes WHERE "restaurantId"=1 LIMIT 1)`);
  assert.ok((await client.query(`SELECT id FROM ${schema}.restaurants WHERE id=1 AND "searchText" LIKE '%mon kiem thu doc nhat%'`)).rowCount === 1);
  console.log('Migration verified: archive, preserved user dish, 36 restaurants, 68 linked dishes, idempotency, search triggers.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Migration check failed:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => {});
  await client.end();
}
