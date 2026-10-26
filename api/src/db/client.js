import '../config/env.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createDatabaseClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString || connectionString.includes('YOUR_')) {
    throw new Error('DATABASE_URL chưa được cấu hình. Điền api/.env để kết nối Supabase.');
  }
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 });
  return new PrismaClient({ adapter });
}
