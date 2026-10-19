import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { testDatabase } from './helpers.js';

test('changing image method without a replacement preserves the existing dish photo', async () => {
  const { db, storage } = testDatabase();
  const app = createApp({ db });
  const dish = storage.dish[0];
  const previous = dish.imagePath;
  const data = { name: dish.name, price: String(dish.price), available: 'true' };
  for (const imageMode of ['url', 'file']) {
    await request(app).post(`/admin/dishes/${dish.id}?_method=PATCH`).type('form').send({ ...data, imageMode, imagePath: '' }).expect(303);
    assert.equal(dish.imagePath, previous);
  }
  const page = await request(app).get(`/admin/dishes/${dish.id}/edit`).expect(200);
  assert.match(page.text, /Ảnh hiện tại/);
  assert.match(page.text, /data-image-preview/);
});
test('URL images are optional, trimmed and restricted to allowed HTTPS sources', async () => {
  const { db, storage } = testDatabase();
  const app = createApp({ db });
  const data = { name: 'Ảnh kiểm tra', price: '50000', imageMode: 'url' };
  await request(app).post('/admin/dishes').type('form').send({ ...data, imagePath: '  https://images.unsplash.com/photo-example  ' }).expect(303);
  assert.equal(storage.dish.at(-1).imagePath, 'https://images.unsplash.com/photo-example');
  await request(app).post('/admin/dishes').type('form').send({ ...data, name: 'Ảnh không có URL', imagePath: '' }).expect(303);
  assert.equal(storage.dish.at(-1).imagePath, null);
  const count = storage.dish.length;
  for (const imagePath of ['https://example.com/image.jpg', 'javascript:alert(1)', 'https://user:secret@images.unsplash.com/image.jpg']) {
    await request(app).post('/admin/dishes').type('form').send({ ...data, imagePath }).expect(400);
  }
  await request(app).post('/admin/dishes').type('form').send({ ...data, name: 'Ảnh sai chế độ', imageMode: 'other' }).expect(400);
  assert.equal(storage.dish.length, count);
});
test('unsupported file types return an inline form error before upload or database write', async () => {
  const { db, storage } = testDatabase();
  const count = storage.dish.length;
  const response = await request(createApp({ db })).post('/admin/dishes')
    .field('name', 'File kiểm tra').field('price', '50000').field('imageMode', 'file')
    .attach('imageFile', Buffer.from('invalid'), { filename: 'bad.txt', contentType: 'text/plain' }).expect(400);
  assert.match(response.text, /Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP/);
  assert.match(response.text, /File kiểm tra/);
  assert.equal(storage.dish.length, count);
});
test('restaurants share the image editor, preserve existing photos and reject invalid files', async () => {
  const { db, storage } = testDatabase();
  const app = createApp({ db });
  const data = { name: 'Quán kiểm tra', cuisine: 'Việt Nam', imageMode: 'url', imagePath: 'https://images.unsplash.com/photo-space' };
  const created = await request(app).post('/admin/restaurants').type('form').send(data).expect(303);
  const restaurant = storage.restaurant.at(-1);
  const page = await request(app).get(created.headers.location).expect(200);
  assert.match(page.text, /Danh sách nhà hàng/);
  const edit = await request(app).get(`/admin/restaurants/${restaurant.id}/edit`).expect(200);
  assert.match(edit.text, /multipart\/form-data/);
  assert.match(edit.text, /Ảnh nhà hàng/);
  assert.match(edit.text, /data-image-preview/);
  await request(app).post(`/admin/restaurants/${restaurant.id}?_method=PATCH`).type('form').send({ ...data, imageMode: 'file', imagePath: '' }).expect(303);
  assert.equal(restaurant.imagePath, data.imagePath);
  const count = storage.restaurant.length;
  await request(app).post('/admin/restaurants').field('name','File sai').field('cuisine','Việt Nam').field('imageMode','file')
    .attach('imageFile',Buffer.from('not an image'),{filename:'bad.txt',contentType:'text/plain'}).expect(400);
  assert.equal(storage.restaurant.length,count);
});
test('multiple new ingredients combine with selected ingredients and survive validation errors', async () => {
  const { db, storage } = testDatabase();
  const app = createApp({ db });
  const data = { name:'Món nhiều nguyên liệu',price:'50000',ingredientIds:['1','2'],newIngredientName:['Nấm mới','Rau mới'],newIngredientUnit:['g','g'] };
  const created = await request(app).post('/admin/dishes').type('form').send(data).expect(303);
  const dish = storage.dish.at(-1);
  assert.equal(storage.dishIngredient.filter(link=>link.dishId===dish.id).length,4);
  const page = await request(app).get(created.headers.location).expect(200);
  assert.match(page.text,/Danh sách món ăn/);
  const count = storage.ingredient.length;
  const invalid = await request(app).post('/admin/dishes').type('form').send({...data,price:'bad'}).expect(400);
  assert.match(invalid.text,/value="Nấm mới"/);
  assert.match(invalid.text,/value="Rau mới"/);
  assert.equal(storage.ingredient.length,count);
  await request(app).post('/admin/dishes').type('form').send({...data,newIngredientName:Array(21).fill('x'),newIngredientUnit:Array(21).fill('g')}).expect(400);
  await request(app).post('/admin/dishes').type('form').send({...data,ingredientIds:['999999']}).expect(400);
  assert.equal(storage.ingredient.length,count);
});
