import '../src/config/env.js';
import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../src/db/client.js';
const dishes = ['Phở bò', 'Bún gà', 'Cơm tấm', 'Gỏi cuốn', 'Bánh mì', 'Mì xào', 'Cháo nấm', 'Bún cá', 'Cơm rau', 'Bánh cuốn'];
const styles = ['truyền thống', 'nướng sả', 'sốt tiêu', 'rau thơm', 'đặc biệt', 'chay', 'miền Nam', 'miền Trung', 'miền Bắc', 'gia đình'];
export const block7Dishes = Array.from({ length: 1000 }, (_, i) => ({
  importKey: `block7:demo:${i + 1}`, name: `${dishes[i % 10]} ${styles[Math.floor(i / 10) % 10]} ${Math.floor(i / 100) + 1}`,
  description: `Dữ liệu demo Block 7. ${dishes[i % 10]} với ${styles[Math.floor(i / 10) % 10]}, hương vị ${i % 2 ? 'thanh mát' : 'đậm đà'}. Khẩu phần minh họa ${i + 1}.`,
  category: ['Món nước', 'Món nước', 'Cơm', 'Khai vị', 'Bánh', 'Mì', 'Món chay', 'Món nước', 'Món chay', 'Bánh'][i % 10],
  price: (i % 41) * 5000, available: i % 4 !== 0, priceIsDemo: true, recipeIsDemo: true,
  imagePath: ['/images/noodles.svg', '/images/rice.svg', '/images/rolls.svg', '/images/greens.svg'][i % 4], photoType: 'Ảnh minh họa · Món demo Block 7',
}));
export async function seedBlock7(db) {
  const before = await db.dish.count();
  // No fixed IDs, relation changes, image uploads or updates to existing records.
  const { count: inserted } = await db.dish.createMany({ data: block7Dishes, skipDuplicates: true });
  return { before, inserted, after: await db.dish.count(), demo: await db.dish.count({ where: { importKey: { startsWith: 'block7:demo:' } } }) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = createDatabaseClient();
  try { console.log(JSON.stringify(await seedBlock7(db))); }
  catch (error) { console.error('Block 7 seed failed:', error.code || error.name); process.exitCode = 1; }
  finally { await db.$disconnect(); }
}
