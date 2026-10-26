import '../src/config/env.js';
import { Client } from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import request from 'supertest';
import { createDatabaseClient } from '../src/db/client.js';
import { createApi } from '../src/app.js';
import { migrateBlock7 } from './migrate-block7.js';
import { seedBlock7 } from './seed-block7.js';
import { normalizeSearch } from '../src/lib/search.js';
import { dishQueries, queryState } from '../src/catalog.js';
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const db = createDatabaseClient();
try {
  await client.connect();
  // Reproduce the exact pre-fix total/count algorithm on the same collection.
  const oldRows = await db.dish.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } });
  const q = 'pho';
  const matched = oldRows.filter(x => normalizeSearch(x.name).includes(normalizeSearch(q)));
  const before = { method: 'pre-fix listRecords algorithm reproduced against real Supabase rows', q, meta: { count: matched.length, total: oldRows.length }, returned: matched.slice(0, 12).map(x => x.id) };
  await migrateBlock7(client);
  const seed = await seedBlock7(db), repeatSeed = await seedBlock7(db);
  const app = createApi({ db });
  const urls = ['/api/dishes?q=pho&page=1&pageSize=12', '/api/dishes?q=pho&page=2&pageSize=12', '/api/dishes?mode=advanced&q=pho&minPrice=0&available=false', '/api/dishes?mode=fulltext&q=thanh%20mat', '/api/dishes?mode=fuzzy&q=pho%20boo'];
  const network = [];
  for (const url of urls) { const res = await request(app).get(url); if (!res.body.ok) throw new Error('API verification failed'); network.push({ url, status: res.status, body: res.body }); }
  const counts = (await client.query('SELECT count(*)::int AS total, count(*) FILTER (WHERE "importKey" LIKE \'block7:demo:%\')::int AS demo FROM public.dishes')).rows;
  const s = dishQueries(queryState({ mode: 'fulltext', q: 'pho', page: '2' }));
  const explain = (await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${s.items.text}`, s.items.values)).rows;
  const extensions = (await client.query("SELECT extname, nspname FROM pg_extension JOIN pg_namespace ON pg_namespace.oid=extnamespace WHERE extname IN ('unaccent','pg_trgm')")).rows;
  const receipt = { source: 'Configured Supabase PostgreSQL, public.dishes', at: new Date().toISOString(), countSQL: 'SELECT count(*) FROM public.dishes', counts, seed, repeatSeed, extensions, before, after: network[0], network, queries: { items: { text: s.items.text, parameters: s.items.values }, count: { text: s.count.text, parameters: s.count.values } }, explain };
  await mkdir('artifacts/block7', { recursive: true });
  await writeFile('artifacts/block7/supabase-verification.json', JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ counts, seed, repeatSeed, oldTotalBug: before.meta, fixedTotal: network[0].body.data.total }));
} catch (error) { console.error('Block 7 preparation failed:', error.code || error.name); process.exitCode = 1; }
finally { await db.$disconnect(); await client.end(); }
