import { readFile } from 'node:fs/promises';
import { createDatabaseClient } from '../src/db/client.js';
import { normalizeSearch } from '../src/lib/search.js';

// Chỉ thực hiện ghi khi bạn tự chạy: node api/scripts/import-user-dishes.js
// --dry-run đọc/kiểm tra file và in danh sách, không kết nối database.
const allowedHosts = new Set(['images.unsplash.com', 'plus.unsplash.com', 'media.istockphoto.com']);
let prisma;

try {
  const rows = JSON.parse(await readFile(new URL('../data/user-image-dishes.json', import.meta.url), 'utf8'));
  if (!Array.isArray(rows) || rows.length !== 24) throw new Error('INVALID_DATA');
  const keys = new Set();
  const images = new Set();
  const dishes = rows.map(row => {
    const url = new URL(row.imagePath);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.username || url.password
      || typeof row.importKey !== 'string' || !row.importKey || keys.has(row.importKey)
      || images.has(row.imagePath)
      || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 120
      || typeof row.description !== 'string' || row.description.length > 2000
      || !Number.isInteger(row.price) || row.price < 0 || row.price > 2147483647
      || typeof row.category !== 'string' || !row.category.trim() || row.category.length > 80
      || typeof row.available !== 'boolean') throw new Error('INVALID_DATA');
    keys.add(row.importKey);
    images.add(row.imagePath);
    // Whitelist field; không truyền toàn bộ dữ liệu JSON vào Prisma.
    return {
      importKey: row.importKey,
      name: row.name.trim(),
      description: row.description,
      price: row.price,
      category: row.category.trim(),
      available: row.available,
      imagePath: row.imagePath,
      photoType: 'Ảnh minh họa',
      searchText: normalizeSearch(`${row.name} ${row.description} ${row.category}`),
    };
  });

  if (process.argv.includes('--dry-run')) {
    dishes.forEach((dish, index) => console.log(`${index + 1}. ${dish.name} — ${dish.price.toLocaleString('vi-VN')} đ`));
    console.log('Kiểm tra đạt: 24 món, 24 URL, 24 importKey khác nhau. Không ghi database.');
  } else {
    prisma = createDatabaseClient();
    const saved = await prisma.$transaction(async tx => {
      const results = [];
      for (const dish of dishes) {
        results.push(await tx.dish.upsert({
          where: { importKey: dish.importKey },
          create: dish,
          // Chạy lại không nhân đôi, không ghi đè món đã được chỉnh sửa.
          update: {},
          select: { id: true, name: true },
        }));
      }
      return results;
    }, { maxWait: 10000, timeout: 60000 });
    saved.forEach(dish => console.log(`#${dish.id} — ${dish.name}`));
    console.log('Hoàn tất: 24 món đã có trong database. Món có cùng importKey được giữ nguyên.');
    console.log(`Xem thực đơn: ${process.env.SPA_ORIGIN || "http://localhost:5173"}/dishes`);
    console.log('Nếu ảnh Plus/iStock bị chặn, xem scripts/IMPORT-USER-DISHES.md để cập nhật img-src.');
  }
} catch (error) {
  if (error.message === 'INVALID_DATA' || error instanceof SyntaxError || error instanceof TypeError) {
    console.error('File dữ liệu không hợp lệ. Kiểm tra 24 món, tên, giá, URL và importKey trong api/data/user-image-dishes.json.');
  } else {
    console.error('Nhập món chưa thành công. Kiểm tra .env, kết nối PostgreSQL, Prisma Client và schema hiện tại.');
  }
  if (typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)) console.error(`Mã lỗi: ${error.code}`);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
