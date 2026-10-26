import '../api/src/config/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { migrateBlock7 } from '../api/scripts/migrate-block7.js';
import { createApi } from '../api/src/app.js';

test('Block6 API on PostgreSQL: CRUD, filters, relations, transaction rollback and delete policies', { skip: !process.env.TEST_DATABASE_URL, timeout: 120000 }, async () => {
  const schema = `block6_test_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.TEST_DATABASE_URL); url.searchParams.set('schema', schema);
  const control = new Client({ connectionString: process.env.TEST_DATABASE_URL, connectionTimeoutMillis: 10000 });
  await control.connect(); let db;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--config', 'api/prisma.config.ts'], { cwd: new URL('..', import.meta.url), env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe', timeout: 60000 });
    await migrateBlock7(control, schema);
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` }, { schema }) });
    const current = await db.$queryRawUnsafe('SELECT current_schema() AS schema');
    assert.equal(current[0].schema, schema);
    const app = createApi({ db, logger: { error() {} } });
    for (const [resource, payload] of Object.entries({ dishes: { name: 'Integration dish', price: 55000 }, chefs: { name: 'Integration chef' }, ingredients: { name: 'Integration ingredient', unit: 'g' }, restaurants: { name: 'Integration restaurant', cuisine: 'Việt' } })) {
      const made = (await request(app).post(`/api/${resource}`).send(payload).expect(200)).body;
      assert.equal(made.ok, true, JSON.stringify(made));
      const id = made.data.id;
      const edited = (await request(app).patch(`/api/${resource}/${id}`).send({ name: 'Updated' })).body;
      assert.equal(edited.data.name, 'Updated');
      assert.equal((await request(app).get(`/api/${resource}/${id}`)).body.ok, true);
      assert.deepEqual((await request(app).delete(`/api/${resource}/${id}`)).body, { ok: true, data: null });
    }
    const made = (await request(app).post('/api/dishes').send({ name: 'Phở bò', category: 'Món nước', price: null, available: false, newRestaurantName: 'Quán demo', newChefName: 'Bếp demo', newIngredients: [{ name: 'Muối', unit: 'g' }] })).body;
    assert.equal(made.ok, true, JSON.stringify(made));
    const dish = made.data;
    assert.equal(dish.ingredients.length, 1); assert.equal(dish.chef.name, 'Bếp demo');
    assert.equal((await request(app).get('/api/home?destinationQ=pho')).body.data.restaurants.length, 1);
    assert.equal((await request(app).get('/api/restaurants/suggestions?q=quan%20demo')).body.data.length, 1);
    await request(app).patch(`/api/dishes/${dish.id}`).send({ name: 'Phở gà' });
    const preserved = (await request(app).get(`/api/dishes/${dish.id}`)).body.data;
    assert.equal(preserved.price, null); assert.equal(preserved.available, false); assert.equal(preserved.ingredients.length, 1);
    const filtered = (await request(app).get('/api/dishes').query({ q: 'pho', chefId: dish.chefId, ingredientId: dish.ingredients[0].ingredientId, available: 'false', page: 1 })).body;
    assert.equal(filtered.data.items.length, 1);
    await request(app).patch(`/api/dishes/${dish.id}`).send({ ingredientIds: [] });
    assert.equal(await db.dishIngredient.count(), 0);
    const before = [await db.chef.count(), await db.restaurant.count(), await db.ingredient.count()];
    const failureDb = Object.fromEntries(['dish', 'chef', 'ingredient', 'restaurant', 'story'].map(key => [key, db[key]]));
    failureDb.$transaction = work => db.$transaction(tx => work(new Proxy(tx, { get(target, key) { return key === 'dish' ? new Proxy(target.dish, { get(model, method) { return method === 'create' ? async () => { throw new Error('forced write failure'); } : model[method]; } }) : target[key]; } })));
    await request(createApi({ db: failureDb, logger: { error() {} } })).post('/api/dishes').send({ name: 'Rollback', price: 1, newChefName: 'Rolled back chef', newRestaurantName: 'Rolled back restaurant', newIngredients: [{ name: 'Rolled back ingredient', unit: 'g' }] }).expect(500);
    assert.deepEqual([await db.chef.count(), await db.restaurant.count(), await db.ingredient.count()], before);
    await request(app).delete(`/api/chefs/${dish.chefId}`);
    assert.equal((await db.dish.findUnique({ where: { id: dish.id } })).chefId, null);
    await request(app).delete(`/api/restaurants/${dish.restaurantId}`);
    assert.equal((await db.dish.findUnique({ where: { id: dish.id } })).restaurantId, null);
    const ingredientId = dish.ingredients[0].ingredientId;
    await request(app).patch(`/api/dishes/${dish.id}`).send({ ingredientIds: [ingredientId] });
    await request(app).delete(`/api/ingredients/${ingredientId}`);
    assert.equal(await db.dishIngredient.count(), 0);
    assert.ok(await db.dish.findUnique({ where: { id: dish.id } }));
    await db.dish.createMany({ data: Array.from({ length: 88 }, (_, i) => ({ name: `Page ${i}`, price: i, category: 'Test' })) });
    const seen = [];
    for (let page = 1; page <= 8; page++) {
      const result = (await request(app).get('/api/dishes').query({ page, category: 'Test', sort: 'price-desc' })).body;
      assert.equal(result.data.total, 88); seen.push(...result.data.items.map(x => x.id));
    }
    assert.equal(seen.length, 88); assert.equal(new Set(seen).size, 88);
  } finally {
    await db?.$disconnect();
    await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.end();
  }
});
