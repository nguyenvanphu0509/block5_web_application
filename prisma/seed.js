import { pathToFileURL } from 'node:url';
import { demoDishes, demoChefs, demoIngredients } from '../data/demo.js';
import { normalizeSearch } from '../src/lib/search.js';
import { createDatabaseClient } from '../src/db/client.js';

// Stable keys identify only these seed records. Existing records are never overwritten.
export async function seedDatabase(db) {
  return db.$transaction(async tx => {
    for (const dish of demoDishes) {
      const { id, createdAt, ...data } = dish;
      await tx.dish.upsert({
        where: { importKey: `block5:seed:dish:${id}` }, update: {},
        create: { ...data, importKey: `block5:seed:dish:${id}`, priceIsDemo: true, recipeIsDemo: true,
          photoType: 'Ảnh minh họa', searchText: normalizeSearch(`${dish.name} ${dish.category || ''}`) },
      });
    }
    for (const chef of demoChefs) {
      const { id, createdAt, ...data } = chef;
      await tx.chef.upsert({ where: { catalogKey: `block5:seed:chef:${id}` }, update: {},
        create: { ...data, catalogKey: `block5:seed:chef:${id}`, isDemo: true } });
    }
    for (const ingredient of demoIngredients) {
      const { id, createdAt, ...data } = ingredient;
      await tx.ingredient.upsert({ where: { catalogKey: `block5:seed:ingredient:${id}` }, update: {},
        create: { ...data, catalogKey: `block5:seed:ingredient:${id}`, isDemo: true } });
    }
    return { dishes: demoDishes.length, chefs: demoChefs.length, ingredients: demoIngredients.length };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let db;
  try {
    db = createDatabaseClient();
    const result = await seedDatabase(db);
    console.log(`Seed hoàn tất: ${result.dishes} món, ${result.chefs} đầu bếp, ${result.ingredients} nguyên liệu. Bản ghi đã seed được giữ nguyên.`);
  } catch {
    console.error('Seed thất bại. Kiểm tra kết nối và chạy db:generate, db:push cho database mới trước khi seed.');
    process.exitCode = 1;
  } finally { await db?.$disconnect(); }
}
