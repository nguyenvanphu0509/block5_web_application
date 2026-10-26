// Compatibility entry point: all restaurant records are migrated from Supabase.
import './migrate-restaurants.js';
import { migrateCatalog } from './migrate-restaurants.js';
import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
try { await client.connect(); console.log(await migrateCatalog(client)); }
catch (error) { console.error('Chuyển catalog thất bại.', { code: error.code || 'DATABASE_ERROR' }); process.exitCode = 1; }
finally { await client.end(); }
