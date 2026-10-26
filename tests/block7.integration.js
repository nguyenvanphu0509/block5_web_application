import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import request from 'supertest';
import { isolatedDatabase } from './block7-db.js';
import { createApi } from '../api/src/app.js';
import { seedBlock7 } from '../api/scripts/seed-block7.js';
import { dishQueries, queryState } from '../api/src/catalog.js';

test('Block 7: PostgreSQL search, paging, trigger CRUD and idempotent seed', { timeout: 120000 }, async () => {
  const { db, close } = await isolatedDatabase();
  try {
    const app = createApi({ db });
    const made = await db.dish.createMany({ data: [
      { name: 'Phở bò', description: 'hương vị thảo mộc độc đáo', price: 0, category: 'Test', available: false },
      { name: 'Phở gà', price: 30000, category: 'Test', available: true },
      { name: '100% SQL_notes!', price: 50000, category: 'Literal' },
      { name: 'SQL notes', price: null, category: 'Literal' },
    ] });
    assert.equal(made.count, 4);
    const get = async query => { const res = await request(app).get('/api/dishes').query(query).expect(200); assert.equal(res.body.ok, true, JSON.stringify(res.body)); return res.body.data; };
    const basic = await get({ q: 'PHO' });
    assert.equal(basic.total, 2); assert.deepEqual(basic, await get({ mode: 'advanced', q: 'PHO' }));
    const combined = await get({ mode: 'advanced', q: 'pho', minPrice: 0, maxPrice: 0, available: 'false', category: 'Test' });
    assert.equal(combined.total, 1); assert.equal(combined.items[0].price, 0);
    for (const q of ['100%', 'SQL_', '!']) assert.equal((await get({ q })).total, 1);
    assert.equal((await get({ q: 'nothing matches' })).total, 0);
    assert.equal((await get({ mode: 'fulltext', q: 'thao moc' })).items[0].name, 'Phở bò');
    for (const q of ['nay toi muon an pho bo', 'Hôm nay tôi muốn ăn phở bò nhé']) {
      const result = await get({ mode: 'fulltext', q });
      assert.equal(result.total, 1);
      assert.equal(result.items[0].name, 'Phở bò');
    }
    assert.equal((await get({ mode: 'fulltext', q: 'Tôi muốn ăn thảo mộc' })).items[0].name, 'Phở bò');
    assert.equal((await get({ mode: 'fulltext', q: 'Tôi muốn ăn phở -gà' })).items[0].name, 'Phở bò');
    assert.equal((await get({ mode: 'fulltext', q: 'Tôi muốn ăn' })).total, 0);
    assert.equal((await get({ mode: 'basic', q: 'nay toi muon an pho bo' })).total, 0);
    assert.equal((await get({ mode: 'fuzzy', q: 'pho bo' })).items[0].name, 'Phở bò');
    assert.equal((await get({ mode: 'fuzzy', q: 'pho boo' })).items[0].name, 'Phở bò');
    for (const mode of ['fulltext', 'fuzzy']) {
      const query = { mode, q: 'pho', category: 'Test' };
      const ascending = await get({ ...query, sort: 'price-asc' });
      const descending = await get({ ...query, sort: 'price-desc' });
      assert.equal(ascending.total, 2);
      assert.equal(descending.total, 2);
      assert.deepEqual(ascending.items.map(item => item.price), [0, 30000]);
      assert.deepEqual(descending.items.map(item => item.price), [30000, 0]);
      assert.equal((await get({ ...query, sort: 'price-desc', pageSize: 1, page: 2 })).items[0].price, 0);
    }
    for (const query of [{ minPrice: 5, maxPrice: 0 }, { page: 0 }, { pageSize: 101 }, { available: 'no' }, { minPrice: '1x' }, { mode: 'invalid' }]) {
      assert.equal((await request(app).get('/api/dishes').query(query)).body.error.code, 'VALIDATION_FAILED');
    }
    const a = await get({ q: 'pho', pageSize: 1, page: 1 });
    const b = await get({ q: 'pho', pageSize: 1, page: 2 });
    assert.equal(a.total, 2); assert.equal(b.total, 2); assert.notEqual(a.items[0].id, b.items[0].id);
    assert.deepEqual((await get({ q: 'pho', page: 999 })).items, []);
    const created = (await request(app).post('/api/dishes').send({ name: 'Món kiểm tra', price: 1, description: 'bạch quả' })).body;
    assert.equal(created.ok, true, JSON.stringify(created));
    assert.equal((await get({ mode: 'fulltext', q: 'bach qua' })).total, 1);
    assert.equal((await request(app).patch(`/api/dishes/${created.data.id}`).send({ name: 'Tên mới', description: 'hạt sen' })).body.ok, true);
    assert.equal((await get({ q: 'ten moi' })).total, 1);
    assert.equal((await get({ mode: 'fulltext', q: 'bach qua' })).total, 0);
    assert.equal((await get({ mode: 'fulltext', q: 'hat sen' })).total, 1);
    assert.equal((await request(app).delete(`/api/dishes/${created.data.id}`)).body.ok, true);
    assert.equal((await get({ q: 'ten moi' })).total, 0);
    const fulltextFixtures = await db.dish.createManyAndReturn({ data: [
      { name: 'Bún nghệ', description: 'Món nóng', category: 'Fulltext' },
      { name: 'Mì rau', description: 'Bún nghệ', category: 'Fulltext' },
      { name: 'Bún tươi nghệ', description: null, category: 'Fulltext' },
    ] });
    const fulltext = q => get({ mode: 'fulltext', q, category: 'Fulltext' });
    assert.equal((await fulltext('bun nghe')).total, 3);
    assert.equal((await fulltext('"bún nghệ"')).total, 2);
    assert.equal((await fulltext('"nghe bun"')).total, 0);
    assert.equal((await fulltext('nong OR rau')).total, 2);
    assert.equal((await fulltext('bun -tuoi')).total, 2);
    assert.equal((await fulltext('bun -nghe')).total, 0);
    assert.equal((await fulltext('"bun nghe"')).items[0].name, 'Bún nghệ');
    for (const q of ['"bun nghe', 'bun OR', '---', '"', "bun'); DROP TABLE dishes; --"]) {
      await fulltext(q);
    }
    await db.dish.update({ where: { id: fulltextFixtures[0].id }, data: { description: 'Hương vị mè rang' } });
    assert.equal((await fulltext('"me rang"')).total, 1);
    assert.equal((await fulltext('nong')).total, 0);
    await db.dish.deleteMany({ where: { category: 'Fulltext' } });
    const firstSeed = await seedBlock7(db);
    await db.dish.update({ where: { importKey: 'block7:demo:1' }, data: { description: 'User edit preserved' } });
    const secondSeed = await seedBlock7(db);
    assert.equal(firstSeed.inserted, 1000); assert.equal(secondSeed.inserted, 0); assert.equal(firstSeed.after, secondSeed.after);
    assert.equal((await db.dish.findUnique({ where: { importKey: 'block7:demo:1' } })).description, 'User edit preserved');
    const sql = dishQueries(queryState({ mode: 'fulltext', q: 'pho', page: '2' }));
    const explain = await db.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql.items.text}`, ...sql.items.values);
    await mkdir('artifacts/block7', { recursive: true });
    await writeFile('artifacts/block7/postgres-test.json', JSON.stringify({ schema: 'isolated (removed after test)', passed: ['four search modes', 'accent folding', 'literal wildcard', 'false and zero', 'validation', 'two distinct pages and correct total', 'out-of-range empty', 'CRUD search triggers', 'seed repeat preserves edits'], firstSeed, secondSeed, pagination: [a, b], query: { sql: sql.items.text, parameters: sql.items.values }, count: { sql: sql.count.text, parameters: sql.count.values }, explain }, null, 2));
  } finally { await close(); }
});
