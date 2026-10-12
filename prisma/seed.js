import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../src/db/client.js';
import { demoDishes, demoChefs, demoIngredients } from '../data/demo.js';

export async function seedDatabase(prisma) {
  await prisma.$transaction(async tx => {
    for (const [model, rows] of [['dish', demoDishes], ['chef', demoChefs], ['ingredient', demoIngredients]]) {
      for (const row of rows) {
        const { id, createdAt, ...data } = row;
        await tx[model].upsert({ where: { id }, create: { id, createdAt, ...data }, update: data });
      }
    }
    // Fixed seed IDs must also advance each sequence before normal inserts.
    // Table names are constants; no request values are used in these SQL statements.
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('dishes', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM dishes), (SELECT last_value FROM dishes_id_seq)), true)`;
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('chefs', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM chefs), (SELECT last_value FROM chefs_id_seq)), true)`;
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('ingredients', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM ingredients), (SELECT last_value FROM ingredients_id_seq)), true)`;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = createDatabaseClient();
  try { await seedDatabase(prisma); console.log('Seed xong: 12 món, 4 đầu bếp, 10 nguyên liệu demo.'); }
  catch { console.error('Seed thất bại. Kiểm tra cấu hình và cấu trúc database.'); process.exitCode = 1; }
  finally { await prisma.$disconnect(); }
}
