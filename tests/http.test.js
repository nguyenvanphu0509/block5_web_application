import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPreviewClient } from '../src/db/preview.js';
import { testDatabase } from './helpers.js';

function setup() { const { db, storage } = testDatabase(); return { app: createApp({ db, logger: { error() {} } }), db, storage }; }

test('landing is semantic SSR with native GET navigation', async () => {
  const { app } = setup();
  const res = await request(app).get('/').expect(200).expect('Content-Type', /html/);
  assert.match(res.text, /Khám phá tinh hoa/);
  assert.match(res.text, /id="destinations"/);
  assert.match(res.text, /Phở Minh/);
  assert.match(res.text, /không phải giá từng món/);
  assert.match(res.text, /Nội dung minh họa/);
  assert.doesNotMatch(res.text, /src="\/js\/(home|restaurant-search)\.js"/);
  assert.doesNotMatch(res.text, /onerror=/);
  assert.match(res.headers['content-security-policy'], /script-src 'self'/);
});

test('landing search/paging/toggle preserve state, ranges are labelled correctly', async () => {
  const { app } = setup();
  const first = await request(app).get('/').expect(200);
  assert.match(first.text, /Dưới 150\.000/);
  assert.match(first.text, /Từ 1\.000\.000/);
  const res = await request(app).get('/?destinationPage=2&reviewPage=2&reviewTab=gallery').expect(200);
  assert.match(res.text, /Ănăn Saigon/);
  assert.match(res.text, /destinationPage=2&amp;reviewPage=2#reviews/);
  assert.match(res.text, /gallery-mode/);
  const filtered = await request(app).get('/?destinationQ=PHỞ').expect(200);
  assert.match(filtered.text, /Phở Minh/);
  assert.doesNotMatch(filtered.text.split('id="destinations"')[1].split('id="reviews"')[0], /Hoa Túc/);
  for (const query of ['destinationPage=0', 'destinationPage=1.5', 'destinationQ=a&destinationQ=b', 'reviewTab=video', 'reviewPage=-1']) await request(app).get(`/?${query}`).expect(400);
  const empty = await request(app).get('/?destinationPage=999&reviewPage=999').expect(200);
  assert.match(empty.text, /Chưa tìm thấy địa điểm/);
});

test('public menu search is case insensitive and detail ID validation returns 404', async () => {
  const { app } = setup();
  const res = await request(app).get('/dishes?q=PHỞ').expect(200);
  assert.match(res.text, /Phở bò/); assert.doesNotMatch(res.text, /Cơm tấm Sài Gòn/);
  await request(app).get('/dishes/1').expect(200);
  for (const id of ['abc', '0', '-1', '1.2', '2147483648', '999']) await request(app).get(`/dishes/${id}`).expect(404);
  await request(app).get('/dishes?q=a&q=b').expect(400);
  const empty = await request(app).get('/dishes?q=not-a-dish').expect(200);
  assert.match(empty.text, /Chưa có món phù hợp/);
});

test('restaurant search normalizes accents, filters districts and specialties, and suggests DB names', async () => {
  const { app, storage } = setup();
  for (const q of ['pho', 'PHỞ', 'q.1', 'quan 1', 'mon chay', 'ca tim']) {
    const res = await request(app).get('/').query({ destinationQ: q }).expect(200);
    assert.doesNotMatch(res.text, /Chưa tìm thấy địa điểm/);
  }
  const suggestions = await request(app).get('/api/restaurants/suggestions?q=pho').expect(200);
  assert.ok(suggestions.body.suggestions.some(row => row.name.includes('Phở Minh')));
  assert.ok(suggestions.body.suggestions.length <= 6);
  assert.deepEqual((await request(app).get('/api/restaurants/suggestions').expect(200)).body.suggestions, []);
  await request(app).get('/api/restaurants/suggestions?q=a&q=b').expect(400);
  storage.restaurant[0].name = 'Tên quán từ database';
  assert.match((await request(app).get('/').expect(200)).text, /Tên quán từ database/);
  storage.dish[0].restaurantId = 1;
  assert.match((await request(app).get('/restaurants/1').expect(200)).text, /63\/6 Pasteur/);
  assert.match((await request(app).get('/dishes/1').expect(200)).text, /Tên quán từ database/);
  await request(app).get('/restaurants/999').expect(404);
});

test('admin can manage restaurants and link dishes with unknown prices', async () => {
  const { app, storage } = setup();
  await request(app).get('/admin/restaurants').expect(200);
  await request(app).get('/admin/restaurants/1/edit').expect(200);
  await request(app).post('/admin/restaurants').type('form').send({ name:'Quán kiểm thử', cuisine:'Việt', district:'Quận 1', address:'Địa chỉ kiểm thử', notableDishes:'Phở, Bún', michelinUrl:'https://guide.michelin.com/en/test' }).expect(303);
  assert.deepEqual(storage.restaurant.at(-1).notableDishes, ['Phở', 'Bún']);
  await request(app).post('/admin/dishes').type('form').send({ name:'Món có quán', priceUnknown:'true', restaurantId:'1', available:'true' }).expect(303);
  assert.equal(storage.dish.at(-1).restaurantId, 1);
  assert.equal(storage.dish.at(-1).price, null);
  await request(app).post('/admin/dishes').type('form').send({ name:'Sai quán', price:'5', restaurantId:'999' }).expect(400);
});

for (const [resource, fields] of Object.entries({ dishes: { name: 'Món kiểm thử', price: '25000', available: 'true' }, chefs: { name: 'Đầu bếp kiểm thử', specialty: 'Việt' }, ingredients: { name: 'Nguyên liệu kiểm thử', unit: 'g' } })) {
  test(`${resource}: complete CRUD with POST overrides, confirmation and PRG`, async () => {
    const { app, storage } = setup();
    const base = `/admin/${resource}`, model = { dishes: 'dish', chefs: 'chef', ingredients: 'ingredient' }[resource];
    await request(app).get(base).expect(200);
    await request(app).get(`${base}/new`).expect(200);
    const before = storage[model].length;
    const created = await request(app).post(base).type('form').send(fields).expect(303);
    const id = storage[model].at(-1).id;
    assert.equal(created.headers.location, `${base}/${id}?notice=created`);
    await request(app).get(created.headers.location).expect(200);
    await request(app).get(created.headers.location).expect(200);
    assert.equal(storage[model].length, before + 1);
    await request(app).get(`${base}/${id}/edit`).expect(200);
    await request(app).post(`${base}/${id}?_method=PATCH`).type('form').send({ ...fields, name: 'Đã sửa', available: undefined }).expect(303);
    assert.equal(storage[model].at(-1).name, 'Đã sửa');
    if (resource === 'dishes') assert.equal(storage[model].at(-1).available, false);
    const confirm = await request(app).get(`${base}/${id}/delete`).expect(200);
    assert.match(confirm.text, /Xác nhận xóa/);
    assert.equal(storage[model].length, before + 1);
    await request(app).post(`${base}/${id}?_method=DELETE`).type('form').send({}).expect(303).expect('Location', `${base}?notice=deleted`);
    assert.equal(storage[model].length, before);
    await request(app).get(`${base}/${id}`).expect(404);
    await request(app).delete(`${base}/${id}`).expect(404);
    await request(app).get(`${base}/1?_method=DELETE`).expect(200);
    assert.ok(storage[model].some(row => row.id === 1));
  });
}

test('invalid input preserves raw values, does not write and does not mass-assign', async () => {
  const { app, storage } = setup(); const before = storage.dish.length;
  for (const price of ['', '-1', '1.5', '2147483648']) {
    const res = await request(app).post('/admin/dishes').type('form').send({ name: '  Tên giữ lại  ', price, description: '<b>input</b>' }).expect(400);
    assert.match(res.text, /value="  Tên giữ lại  "/);
    assert.match(res.text, /&lt;b&gt;input&lt;\/b&gt;/);
    assert.equal(storage.dish.length, before);
  }
  await request(app).post('/admin/chefs').type('form').send({ name: ' '.repeat(3) }).expect(400);
  await request(app).post('/admin/ingredients').type('form').send({ name: 'x', unit: '' }).expect(400);
  await request(app).post('/admin/dishes').type('form').send('name=a&name=b&price=5').expect(400);
  await request(app).patch('/admin/dishes/1').type('form').send({ name: 'x', price: '1', imagePath: 'https://bad.example' }).expect(400);
  await request(app).post('/admin/chefs').type('form').send({ name: '<script>bad</script>', id: '9000', unexpected: 'bad' }).expect(303);
  const chef = storage.chef.at(-1); assert.notEqual(chef.id, 9000); assert.equal(chef.unexpected, undefined);
  const detail = await request(app).get(`/admin/chefs/${chef.id}`).expect(200);
  assert.match(detail.text, /&lt;script&gt;bad&lt;\/script&gt;/); assert.doesNotMatch(detail.text, /<script>/);
});

test('missing update, database errors, Origin checks and body limits', async () => {
  const { app, db } = setup();
  await request(app).patch('/admin/chefs/999').type('form').send({ name: 'x' }).expect(404);
  db.chef.update = async () => { throw Object.assign(new Error('gone'), { code: 'P2025' }); };
  await request(app).patch('/admin/chefs/1').type('form').send({ name: 'x' }).expect(404);
  db.dish.findMany = async () => { throw new Error('SECRET database password'); };
  const failed = await request(app).get('/dishes').expect(500);
  assert.doesNotMatch(failed.text, /SECRET|password/);
  const forbidden = await request(app).post('/admin/chefs').set('Origin', 'https://other.example').type('form').send({ name: 'x' }).expect(403);
  assert.match(forbidden.text, /Nguồn gửi biểu mẫu/);
  assert.doesNotMatch(forbidden.text, /ReferenceError|node_modules/);
  await request(app).post('/admin/chefs').set('Origin', 'http://localhost:3000').type('form').send({ name: 'x' }).expect(303);
  const oversized = await request(app).post('/admin/chefs').type('form').send({ name: 'a'.repeat(40000) }).expect(400);
  assert.match(oversized.text, /Biểu mẫu vượt dung lượng/);
  assert.doesNotMatch(oversized.text, /ReferenceError|node_modules/);
});

test('preview is explicitly labelled, read-only, and missing featured dishes have placeholders', async () => {
  const db = createPreviewClient(testDatabase().db); const app = createApp({ db, preview: true });
  const home = await request(app).get('/').expect(200); assert.match(home.text, /Chế độ chỉ đọc/);
  const form = await request(app).get('/admin/dishes/new').expect(200); assert.match(form.text, /disabled/);
  for (const method of ['post', 'patch', 'delete']) await request(app)[method](method === 'post' ? '/admin/dishes' : '/admin/dishes/1').type('form').send({}).expect(503);
  db.restaurant.findMany = async () => [];
  const empty = await request(app).get('/').expect(200); assert.match(empty.text, /Một hương vị mới/);
});
