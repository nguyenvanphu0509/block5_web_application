import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { testDatabase } from './helpers.js';
import { recipeSuggestion } from '../data/catalog-enrichment.js';

test('demo recipes distinguish complete food names rather than matching substrings',()=>{
  const burger=recipeSuggestion({name:'Burger bò phô mai'});
  assert.ok(burger.ingredients.includes('Thịt bò'));assert.ok(!burger.ingredients.includes('Bánh phở'));
  const salad=recipeSuggestion({name:'Salad bowl rau củ'});
  assert.equal(salad.specialty,'Món chay');assert.ok(!salad.ingredients.includes('Thịt bò'));assert.ok(!salad.ingredients.includes('Sả'));
  const pate=recipeSuggestion({name:'Pâté chaud'});
  assert.equal(pate.specialty,'Bánh & món cuốn');assert.ok(!pate.ingredients.includes('Hàu'));
  assert.ok(!recipeSuggestion({name:'Chả giò gan ngỗng'}).ingredients.includes('Thịt gà'));
});

function setup(count=88) {
  const {db,storage} = testDatabase();
  storage.dish.splice(0,storage.dish.length,...Array.from({length:count},(_,i)=>({
    id:i+1,name:`Món ${String(i+1).padStart(3,'0')}`,price:(i+1)*1000,category:i%2?'Cơm':'Món nước',
    available:i%2===0,restaurantId:i%2+1,chefId:i%2+1,priceIsDemo:true,recipeIsDemo:true,
    photoType:'Ảnh minh họa',searchText:'mon',createdAt:new Date(),
  })));
  storage.dishIngredient.push(...storage.dish.map(d=>({dishId:d.id,ingredientId:d.id%2+1})));
  storage.restaurant[1].district='Quận 3';
  return {app:createApp({db}),storage};
}
function ids(html) { return [...html.matchAll(/class="dish-image[^>]+href="\/dishes\/(\d+)"/g)].map(m=>Number(m[1])); }

test('88 dishes are reachable across eight pages, with no omissions or duplicate cards',async()=>{
  const {app}=setup();const all=[];
  for(let page=1;page<=8;page++) {
    const res=await request(app).get('/dishes').query({page}).expect(200);
    const pageIds=ids(res.text);assert.equal(pageIds.length,page===8?4:12);all.push(...pageIds);
    assert.match(res.text,new RegExp(`Trang ${page} / 8`));
    assert.match(res.text,/88 món/);
    assert.doesNotMatch(res.text,/phù hợp \/ 88 món trong thực đơn|Hiển thị \d+–\d+/);
  }
  assert.deepEqual(all,[...Array.from({length:12},(_,i)=>i+73),...Array.from({length:60},(_,i)=>i+13),...Array.from({length:12},(_,i)=>i+1),...Array.from({length:4},(_,i)=>i+85)]);
  const outside=await request(app).get('/dishes?page=9').expect(200);
  assert.match(outside.text,/Trang này chưa có món/);assert.deepEqual(ids(outside.text),[]);
});
test('combined filters and sort survive page navigation and form submission resets to first page',async()=>{
  const {app}=setup();
  const res=await request(app).get('/dishes').query({q:'mon',restaurantId:1,district:'Quận 1',category:'Món nước',chefId:1,ingredientId:2,available:'true',sort:'price-desc',page:2}).expect(200);
  assert.deepEqual(ids(res.text),[63,61,59,57,55,53,51,49,47,45,43,41]);
  assert.match(res.text,/page=3/);assert.match(res.text,/sort=price-desc/);
  assert.match(res.text,/restaurantId=1/);assert.match(res.text,/ingredientId=2/);
  assert.match(res.text,/Tìm món yêu thích hoặc sắp xếp theo quán, khu vực, giá, loại món, đầu bếp và tên món\./);
  assert.doesNotMatch(res.text,/Giá và công thức bổ sung cho bài tập được ghi rõ là demo/);
  assert.doesNotMatch(res.text,/<input[^>]+name="page"/);
  assert.match(res.text,/data-open-dish-options[^>]*>Tất cả món ăn ↗/);
  const empty=await request(app).get('/dishes?restaurantId=999').expect(200);
  assert.match(empty.text,/Chưa có món phù hợp/);
  for(const query of ['page=0','page=999999999999','sort=sql','restaurantId=x','chefId=-1','ingredientId=1&ingredientId=2','available=yes','district[a]=b']) await request(app).get(`/dishes?${query}`).expect(400);
});
test('sorting by restaurant, district and price groups related records with stable IDs',async()=>{
  const {app}=setup(6);
  assert.deepEqual(ids((await request(app).get('/dishes?sort=restaurant').expect(200)).text),[1,3,5,2,4,6]);
  assert.deepEqual(ids((await request(app).get('/dishes?sort=district').expect(200)).text),[1,3,5,2,4,6]);
  assert.deepEqual(ids((await request(app).get('/dishes?sort=price-asc').expect(200)).text),[1,2,3,4,5,6]);
});
test('admin preserves image, demo labels and dish relationships; rejects unknown references',async()=>{
  const {app,storage}=setup(2);
  const data={name:'Món mới',price:'99000',priceIsDemo:'true',recipeIsDemo:'true',chefId:'1',restaurantId:'1',ingredientIds:['1','2'],imagePath:'https://images.food52.com/example.jpg',available:'true'};
  const created=await request(app).post('/admin/dishes').type('form').send(data).expect(303);
  const id=Number(created.headers.location.match(/\/(\d+)\?/)[1]);
  assert.equal(storage.dish.find(d=>d.id===id).chefId,1);
  assert.equal(storage.dishIngredient.filter(l=>l.dishId===id).length,2);
  const form=await request(app).get(`/admin/dishes/${id}/edit`).expect(200);assert.match(form.text,/Ảnh hiện tại/);
  await request(app).post(`/admin/dishes/${id}?_method=PATCH`).type('form').send({...data,chefId:'2',ingredientIds:['2']}).expect(303);
  assert.deepEqual(storage.dishIngredient.filter(l=>l.dishId===id).map(l=>l.ingredientId),[2]);
  await request(app).post('/admin/dishes').type('form').send({...data,chefId:'999'}).expect(400);
  await request(app).post('/admin/dishes').type('form').send({...data,ingredientIds:['999']}).expect(400);
  await request(app).post(`/admin/dishes/${id}?_method=DELETE`).expect(303);
  assert.equal(storage.dishIngredient.filter(l=>l.dishId===id).length,0);
});
test('admin rejects duplicate ingredient and chef names, and duplicate dishes within the same restaurant',async()=>{
  const {app,storage}=setup(2);
  const ingredientCount=storage.ingredient.length,chefCount=storage.chef.length,dishCount=storage.dish.length;
  const duplicateIngredient=await request(app).post('/admin/ingredients').type('form')
    .send({name:'  gẠo ',unit:'kg'}).expect(400);
  assert.match(duplicateIngredient.text,/Tên nguyên liệu này đã tồn tại/);
  const duplicateChef=await request(app).post('/admin/chefs').type('form')
    .send({name:'an nguyễn',specialty:'Món mới'}).expect(400);
  assert.match(duplicateChef.text,/Tên đầu bếp này đã tồn tại/);
  assert.equal(storage.ingredient.length,ingredientCount);
  assert.equal(storage.chef.length,chefCount);

  const sameNameDifferentRestaurant=await request(app).post('/admin/dishes').type('form')
    .send({name:'mÓN 001',price:'1000',restaurantId:'2',available:'true'}).expect(303);
  const newDishId=Number(sameNameDifferentRestaurant.headers.location.match(/\/(\d+)\?/)[1]);
  const duplicateDish=await request(app).post('/admin/dishes').type('form')
    .send({name:'  món   001 ',price:'1000',restaurantId:'1',available:'true'}).expect(400);
  assert.match(duplicateDish.text,/Món ăn này đã tồn tại tại quán đã chọn/);
  await request(app).post(`/admin/dishes/${newDishId}?_method=PATCH`).type('form')
    .send({name:'mÓN 001',price:'1000',restaurantId:'2',available:'true'}).expect(303);
  assert.equal(storage.dish.length,dishCount+1);
});
test('dish form rejects duplicate quick-added chefs and ingredients without creating partial records',async()=>{
  const {app,storage}=setup(1);
  const chefCount=storage.chef.length,ingredientCount=storage.ingredient.length;
  const duplicateChef=await request(app).post('/admin/dishes').type('form').send({
    name:'Món kiểm tra đầu bếp',price:'50000',newChefName:'AN NGUYỄN',
  }).expect(400);
  assert.match(duplicateChef.text,/Đầu bếp này đã tồn tại/);
  const duplicateIngredient=await request(app).post('/admin/dishes').type('form').send({
    name:'Món kiểm tra nguyên liệu',price:'50000',newIngredientName:['Nguyên liệu mới','nguyên liệu  MỚI'],
    newIngredientUnit:['g','kg'],
  }).expect(400);
  assert.match(duplicateIngredient.text,/Nguyên liệu đã tồn tại hoặc bị lặp/);
  assert.equal(storage.chef.length,chefCount);
  assert.equal(storage.ingredient.length,ingredientCount);
});
test('admin can create and link new restaurant, chef and ingredient from dish form',async()=>{
  const {app,storage}=setup(1);
  const created=await request(app).post('/admin/dishes').type('form').send({
    name:'Món liên kết mới',price:'50000',available:'true',
    newRestaurantName:'Quán mới',newChefName:'Đầu bếp mới',
    newIngredientName:'Nguyên liệu mới',newIngredientUnit:'g',
  }).expect(303);
  const id=Number(created.headers.location.match(/\/(\d+)\?/)[1]);
  const dish=storage.dish.find(row=>row.id===id);
  assert.equal(storage.restaurant.find(row=>row.id===dish.restaurantId).name,'Quán mới');
  assert.equal(storage.chef.find(row=>row.id===dish.chefId).name,'Đầu bếp mới');
  assert.equal(storage.dishIngredient.find(row=>row.dishId===id).ingredientId,storage.ingredient.find(row=>row.name==='Nguyên liệu mới').id);
});
