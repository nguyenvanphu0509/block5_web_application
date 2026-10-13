import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('real PostgreSQL: code-first schema and HTTP CRUD', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  // Always uses a freshly named schema. Never pushes/reset schema public.
  const schema = `block5_test_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  const control = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await control.connect();
  let prisma;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push'], {
      cwd: new URL('..', import.meta.url), env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe',
    });
    // search_path isolates this integration schema from public.
    const adapter = new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` }, { schema });
    prisma = new PrismaClient({ adapter });
    const app = createApp({ db: prisma });
    for (const [resource, model, data, lastSeedId] of [
      ['dishes', 'dish', { name: 'Integration dish', price: '55000' }, 0],
      ['chefs', 'chef', { name: 'Integration chef' }, 0],
      ['ingredients', 'ingredient', { name: 'Integration ingredient', unit: 'g' }, 0],
    ]) {
      const base = `/admin/${resource}`;
      const response = await request(app).post(base).type('form').send(data).expect(303);
      const id = Number(response.headers.location.match(/\/(\d+)\?/)[1]);
      assert.ok(id > lastSeedId);
      await request(app).post(`${base}/${id}?_method=PATCH`).type('form').send({ ...data, name: 'Updated integration' }).expect(303);
      assert.equal((await prisma[model].findUnique({ where: { id } })).name, 'Updated integration');
      await request(app).get(`${base}/${id}/delete`).expect(200);
      assert.ok(await prisma[model].findUnique({ where: { id } }));
      await request(app).post(`${base}/${id}?_method=DELETE`).expect(303);
      assert.equal(await prisma[model].findUnique({ where: { id } }), null);
    }
    const restaurant = await prisma.restaurant.create({ data: { name:'Quán test', cuisine:'Món Việt', district:'Quận 1', isDemo:true } });
    const chef = await prisma.chef.create({ data: { name:'Đầu bếp test', isDemo:true } });
    const ingredient = await prisma.ingredient.create({ data: { name:'Nguyên liệu test', unit:'g' } });
    await prisma.dish.createMany({ data:Array.from({length:88},(_,i)=>({name:`Test ${i+1}`,price:i*1000,priceIsDemo:true,recipeIsDemo:true,restaurantId:restaurant.id,chefId:chef.id,searchText:'test',category:'Món Việt'})) });
    const all = await prisma.dish.findMany({orderBy:{id:'asc'}});
    const seen = [];
    for(let page=1;page<=8;page++) {
      const response = await request(app).get('/dishes').query({page,restaurantId:restaurant.id,district:'Quận 1',sort:'price-desc'}).expect(200);
      seen.push(...[...response.text.matchAll(/class="dish-image[^>]+href="\/dishes\/(\d+)"/g)].map(m=>Number(m[1])));
    }
    assert.equal(seen.length,88); assert.equal(new Set(seen).size,88);
    assert.deepEqual(seen,all.toReversed().map(d=>d.id));
    const target = all[0];
    await request(app).post(`/admin/dishes/${target.id}?_method=PATCH`).type('form').send({name:target.name,price:'55000',priceIsDemo:'true',recipeIsDemo:'true',chefId:String(chef.id),restaurantId:String(restaurant.id),ingredientIds:String(ingredient.id)}).expect(303);
    assert.equal(await prisma.dishIngredient.count({where:{dishId:target.id}}),1);
    const linked=await request(app).get('/dishes').query({ingredientId:ingredient.id,chefId:chef.id}).expect(200);
    assert.match(linked.text,/1 món/);
    await prisma.chef.delete({where:{id:chef.id}});
    assert.equal((await prisma.dish.findUnique({where:{id:target.id}})).chefId,null);
    await prisma.dish.delete({where:{id:target.id}});
    assert.equal(await prisma.dishIngredient.count({where:{dishId:target.id}}),0);
    assert.ok(await prisma.ingredient.findUnique({where:{id:ingredient.id}}));
  } finally {
    await prisma?.$disconnect();
    // Name was generated here, not supplied by a request or user input.
    await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.end();
  }
});
