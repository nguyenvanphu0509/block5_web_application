import '../src/config/env.js';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { reviews } from '../data/demo.js';

export async function migrateCatalog(client) {
  // The SQL moves existing Supabase data; it never imports the old catalog JSON.
  const sql = readFileSync(new URL('../prisma/migrations/20261012_restaurant_catalog/migration.sql', import.meta.url), 'utf8');
  await client.query(sql);
  for (const [index, story] of reviews.entries()) {
    await client.query('INSERT INTO public.stories (id,name,location,initials,text) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      [index + 1, story.name, story.location, story.initials, story.text]);
  }
  await client.query("SELECT setval(pg_get_serial_sequence('public.stories','id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.stories),1),1),true)");
  return (await client.query('SELECT (SELECT count(*) FROM public.restaurants) AS restaurants, (SELECT count(*) FROM public.dishes) AS dishes, (SELECT count(*) FROM public.restaurant_import_archive) AS archived')).rows[0];
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try { await client.connect(); console.log(await migrateCatalog(client)); }
  catch (error) { console.error('Chuyển catalog thất bại.', { code: error.code || 'DATABASE_ERROR' }); process.exitCode = 1; }
  finally { await client.end(); }
}
