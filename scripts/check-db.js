import { createDatabaseClient } from '../src/db/client.js';
let prisma;
try {
  prisma = createDatabaseClient();
  await prisma.$queryRaw`SELECT 1`;
  console.log('Kết nối PostgreSQL thành công.');
} catch {
  console.error('Chưa kết nối được. Kiểm tra DATABASE_URL trong .env, mật khẩu và Session pooler.');
  process.exitCode = 1;
} finally { await prisma?.$disconnect(); }
