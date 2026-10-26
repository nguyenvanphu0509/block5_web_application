import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApi } from '../api/src/app.js';
import { createFixture } from './fixtures.js';

const origin = 'http://localhost:5173';
function setup(options = {}) { const fixture = createFixture(); return { ...fixture, app: createApi({ db: fixture.db, logger: { error() {} }, ...options }) }; }
for (const [resource, payload] of Object.entries({ dishes: { name: 'Món thử', price: 1000, available: false }, chefs: { name: 'Bếp thử', specialty: 'Món Việt' }, ingredients: { name: 'Muối', unit: 'g' }, restaurants: { name: 'Quán thử', cuisine: 'Việt', notableDishes: ['Phở'] } })) {
  test(`API ${resource}: CRUD, validation, missing IDs and response contract`, async () => {
    const { app } = setup(); const base = `/api/${resource}`;
    const list = await request(app).get(base).expect(200);
    assert.equal(list.body.ok, true); assert.ok(Array.isArray(resource === 'dishes' ? list.body.data.items : list.body.data));
    const made = await request(app).post(base).send(payload).expect(200);
    assert.equal(made.body.ok, true); const id = made.body.data.id;
    assert.equal((await request(app).get(`${base}/${id}`)).body.data.name, payload.name);
    const updated = await request(app).patch(`${base}/${id}`).send({ name: 'Đã sửa' }).expect(200);
    assert.equal(updated.body.data.name, 'Đã sửa');
    if (resource === 'dishes') { assert.equal(updated.body.data.available, false); assert.equal(updated.body.data.price, 1000); }
    const invalid = await request(app).patch(`${base}/${id}`).send({ name: ' ' }).expect(200);
    assert.equal(invalid.body.error.code, 'VALIDATION_FAILED'); assert.ok(invalid.body.error.fields.name);
    assert.equal((await request(app).get(`${base}/${id}`)).body.data.name, 'Đã sửa');
    for (const invalidId of ['abc', '0', '-1', '1.5', '2147483648', '999999']) {
      for (const method of ['get', 'patch', 'delete']) {
        const res = await request(app)[method](`${base}/${invalidId}`).send(method === 'patch' ? { name: 'x' } : undefined).expect(200);
        assert.equal(res.body.error.code, 'NOT_FOUND');
      }
    }
    const deleted = await request(app).delete(`${base}/${id}`).expect(200);
    assert.deepEqual(deleted.body, { ok: true, data: null });
    assert.equal((await request(app).get(`${base}/${id}`)).body.error.code, 'NOT_FOUND');
  });
}
test('API: technical errors and CORS including readable error responses', async () => {
  const { app, db } = setup();
  for (const path of ['/api/bok', '/api', '/dishes/1']) {
    const res = await request(app).get(path).set('Origin', origin).expect(404);
    assert.equal(res.body.ok, undefined); assert.equal(res.headers['access-control-allow-origin'], origin);
  }
  const malformed = await request(app).post('/api/dishes').set('Origin', origin).set('Content-Type', 'application/json').send('{').expect(400);
  assert.equal(malformed.body.ok, undefined); assert.equal(malformed.headers['access-control-allow-origin'], origin);
  await request(app).post('/api/dishes').type('form').send({ name: 'x' }).expect(415);
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    const preflight = await request(app).options('/api/dishes/1').set('Origin', origin).set('Access-Control-Request-Method', method).set('Access-Control-Request-Headers', 'content-type').expect(204);
    assert.equal(preflight.headers['access-control-allow-origin'], origin);
    assert.match(preflight.headers['access-control-allow-methods'], /PATCH/);
  }
  const denied = await request(app).post('/api/chefs').set('Origin', 'https://bad.example').send({ name: 'x' }).expect(403);
  assert.equal(denied.headers['access-control-allow-origin'], undefined); assert.equal(denied.body.ok, undefined);
  await request(app).options('/api/chefs').set('Origin', origin).set('Access-Control-Request-Headers', 'authorization').expect(403);
  db.dish.findMany = async () => { throw new Error('SECRET password'); };
  const failed = await request(app).get('/api/dishes').set('Origin', origin).expect(500);
  assert.equal(failed.body.ok, undefined); assert.doesNotMatch(failed.text, /SECRET|password/);
  assert.equal(failed.headers['access-control-allow-origin'], origin);
});
test('API: JSON types, whitelisting, empty collections, GET never writes', async () => {
  const { app, storage } = setup(); const before = structuredClone(storage);
  await request(app).get('/api/dishes/1?_method=DELETE').expect(200);
  assert.deepEqual(storage, before);
  for (const price of [-1, 1.5, '5', true, 2147483648]) {
    const res = await request(app).post('/api/dishes').send({ name: 'x', price }).expect(200);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');
  }
  const boolean = await request(app).patch('/api/dishes/1').send({ available: 'false' }).expect(200);
  assert.ok(boolean.body.error.fields.available);
  const mass = await request(app).patch('/api/dishes/1').send({ name: 'Tên mới', id: 9999, importKey: 'BAD', createdAt: 'BAD', restaurant: { delete: true } });
  assert.equal(mass.body.data.id, 1); assert.notEqual(mass.body.data.importKey, 'BAD');
  assert.equal((await request(app).patch('/api/dishes/1').send({ price: null, available: false })).body.data.price, null);
  assert.equal((await request(app).get('/api/dishes?q=khongtimthay')).body.data.items.length, 0);
  for (const query of ['q=a&q=b', 'page=0', 'sort=bad', 'available=no', 'chefId=abc']) assert.equal((await request(app).get(`/api/dishes?${query}`)).body.error.code, 'VALIDATION_FAILED');
  assert.equal(storage.dish.length, before.dish.length);
});
test('API: relation PATCH retains omitted links, [] clears, transaction rolls back new parents', async () => {
  const { app, db, storage } = setup();
  await request(app).patch('/api/dishes/1').send({ chefId: 1, restaurantId: 1, ingredientIds: [1, 1, 2] });
  let dish = (await request(app).get('/api/dishes/1')).body.data;
  assert.equal(dish.ingredients.length, 2);
  await request(app).patch('/api/dishes/1').send({ name: 'Giữ liên kết', available: false });
  dish = (await request(app).get('/api/dishes/1')).body.data;
  assert.equal(dish.chefId, 1); assert.equal(dish.ingredients.length, 2); assert.equal(dish.available, false);
  await request(app).patch('/api/dishes/1').send({ ingredientIds: [] });
  assert.equal((await request(app).get('/api/dishes/1')).body.data.ingredients.length, 0);
  const counts = [storage.chef.length, storage.restaurant.length, storage.ingredient.length];
  const original = db.dish.create;
  db.dish.create = async () => { throw new Error('write failed'); };
  await request(app).post('/api/dishes').send({ name: 'Fail', price: 1, newChefName: 'New chef', newRestaurantName: 'New restaurant', newIngredients: [{ name: 'New ingredient', unit: 'g' }] }).expect(500);
  assert.deepEqual([storage.chef.length, storage.restaurant.length, storage.ingredient.length], counts);
  db.dish.create = original;
  const bad = await request(app).post('/api/dishes').send({ name: 'Fail', price: 1, chefId: 999 });
  assert.ok(bad.body.error.fields.chefId);
  const made = await request(app).post('/api/dishes').send({ name: 'OK', price: 1, newChefName: 'New chef', newIngredients: [{ name: 'New ingredient', unit: '' }] });
  assert.equal(made.body.ok, true); assert.equal(storage.ingredient.at(-1).unit, 'phần');
});
test('API: image validation, multipart, cleanup and preserving existing image', async () => {
  const removed = []; const { app, db, storage } = setup({ storage: { upload: async () => 'https://example.supabase.co/storage/v1/object/public/dish-images/test.png', remove: async url => removed.push(url) } });
  storage.dish[0].imagePath = '/images/noodles.svg';
  await request(app).patch('/api/dishes/1').send({ name: 'No replacement', imagePath: '' });
  assert.equal(storage.dish[0].imagePath, '/images/noodles.svg');
  for (const imagePath of ['javascript:alert(1)', 'https://evil.example/x.png']) assert.ok((await request(app).patch('/api/dishes/1').send({ imagePath })).body.error.fields.imagePath);
  const invalid = await request(app).patch('/api/dishes/1').field('payload', '{}').attach('imageFile', Buffer.from('text'), { filename: 'bad.txt', contentType: 'text/plain' });
  assert.ok(invalid.body.error.fields.imageFile);
  const oversized = await request(app).patch('/api/dishes/1').field('payload', '{}').attach('imageFile', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'big.png', contentType: 'image/png' });
  assert.ok(oversized.body.error.fields.imageFile);
  await request(app).patch('/api/dishes/1').field('payload', '{').expect(400);
  db.dish.update = async () => { throw new Error('fail'); };
  await request(app).patch('/api/dishes/1').field('payload', '{}').attach('imageFile', Buffer.from('image'), { filename: 'x.png', contentType: 'image/png' }).expect(500);
  assert.equal(removed.length, 1);
});
test('API: preview denies writes, home and suggestions share the contract', async () => {
  const { app } = setup({ preview: true });
  assert.equal((await request(app).get('/api/config')).body.data.preview, true);
  for (const method of ['post', 'patch', 'delete']) {
    const res = await request(app)[method](method === 'post' ? '/api/dishes' : '/api/dishes/1').send({}).expect(503);
    assert.equal(res.body.ok, undefined);
  }
  const home = await request(app).get('/api/home?destinationQ=pho').expect(200);
  assert.equal(home.body.ok, true); assert.ok(home.body.data.restaurants.length);
  const suggestions = await request(app).get('/api/restaurants/suggestions?q=pho');
  assert.ok(Array.isArray(suggestions.body.data)); assert.equal(suggestions.body.ok, true);
});

test('API: restaurant search reflects new and renamed linked dishes without legacy DB triggers', async () => {
  const { app } = setup();
  const made = (await request(app).post('/api/dishes').send({ name: 'Món mới độc đáo', price: 5, newRestaurantName: 'Quán mới thử nghiệm' })).body;
  assert.equal(made.ok, true);
  assert.equal((await request(app).get('/api/restaurants/suggestions?q=quan%20moi%20thu%20nghiem')).body.data.length, 1);
  let home = (await request(app).get('/api/home?destinationQ=mon%20moi%20doc%20dao')).body;
  assert.equal(home.data.restaurants.length, 1);
  await request(app).patch(`/api/dishes/${made.data.id}`).send({ name: 'Hương vị khác biệt' });
  home = (await request(app).get('/api/home?destinationQ=huong%20vi%20khac%20biet')).body;
  assert.equal(home.data.restaurants.length, 1);
  assert.equal((await request(app).get('/api/restaurants?q=mon%20moi%20doc%20dao')).body.data.length, 0);
});
