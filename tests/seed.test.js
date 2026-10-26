import test from 'node:test';
import assert from 'node:assert/strict';
import { seedDatabase, seedData } from '../api/prisma/seed.js';

function fakeDatabase() {
  const rows = Object.fromEntries(Object.keys(seedData).map(model => [model, []]));
  const queries = [];
  const db = { async $transaction(work) { return work(this); },
    async $queryRawUnsafe(sql) { queries.push(sql); return []; } };
  for (const model of Object.keys(rows)) db[model] = {
    async findMany() { return rows[model]; },
    async upsert({ where, update, create }) {
      assert.deepEqual(update, {});
      const criteria = where.dishId_ingredientId || where;
      const existing = rows[model].find(row => Object.entries(criteria).every(([k, v]) => row[k] === v));
      if (existing) return existing;
      if (model === 'dish') {
        for (const [fk, parent] of [['restaurantId', 'restaurant'], ['chefId', 'chef']]) {
          if (create[fk] != null) assert.ok(rows[parent].some(row => row.id === create[fk]));
        }
      }
      if (model === 'dishIngredient') {
        assert.ok(rows.dish.some(row => row.id === create.dishId));
        assert.ok(rows.ingredient.some(row => row.id === create.ingredientId));
      }
      for (const field of ['createdAt', 'verifiedAt', 'archivedAt']) {
        if (create[field] != null) assert.ok(create[field] instanceof Date && !Number.isNaN(create[field].getTime()));
      }
      rows[model].push({ ...create });
      return create;
    },
  };
  return { db, rows, queries };
}

test('full Supabase snapshot seeds parents before relations; repeated seed preserves edits and counts', async () => {
  const { db, rows, queries } = fakeDatabase();
  const counts = { restaurant: 39, chef: 13, ingredient: 44, dish: 87, dishIngredient: 248, story: 6, restaurantImportArchive: 36 };
  assert.deepEqual(await seedDatabase(db), counts);
  rows.dish[0].description = 'Mô tả đã sửa sau seed';
  rows.chef.push({ id: 999999, name: 'Đầu bếp thêm mới' });
  assert.deepEqual(await seedDatabase(db), counts);
  for (const [model, count] of Object.entries(counts)) assert.equal(rows[model].length, count + (model === 'chef' ? 1 : 0));
  assert.equal(rows.dish[0].description, 'Mô tả đã sửa sau seed');
  assert.equal(queries.length, 10);
  assert.ok(queries.every(sql => sql.includes('setval') && sql.includes('MAX(id)') && !sql.includes('public.')));
});

test('conflicting existing IDs stop seed before any write', async () => {
  const { db, rows, queries } = fakeDatabase();
  rows.restaurant.push({ id: seedData.restaurant[0].id, name: 'Quán khác hoàn toàn' });
  await assert.rejects(seedDatabase(db), /Seed conflict/);
  assert.equal(rows.dish.length, 0);
  assert.equal(rows.chef.length, 0);
  assert.equal(queries.length, 0);
});

test('conflicting unique keys stop seed before any write', async () => {
  const { db, rows } = fakeDatabase();
  const source = seedData.dish.find(row => row.importKey);
  rows.dish.push({ id: 999999, name: source.name, importKey: source.importKey });
  await assert.rejects(seedDatabase(db), /Seed conflict/);
  assert.equal(rows.restaurant.length, 0);
});
