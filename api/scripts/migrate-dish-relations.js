import '../src/config/env.js';
import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const sql = await readFile(new URL('../prisma/migrations/20261013_dish_relations/migration.sql', import.meta.url), 'utf8');
if (!process.argv.includes('--apply')) {
  console.log('Migration bổ sung quan hệ món–đầu bếp–nguyên liệu và metadata demo. Không xóa/reset dữ liệu.');
  console.log('Chạy với --apply để áp dụng vào DATABASE_URL.');
} else {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Đã bổ sung schema. Chạy npm run db:generate trước khi dùng client mới.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration chưa hoàn tất.', { code: error.code || 'DATABASE_ERROR' });
    process.exitCode = 1;
  } finally { await client.end(); }
}
