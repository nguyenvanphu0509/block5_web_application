import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { seedDatabase } from '../prisma/seed.js';
import { createApp } from '../src/app.js';

test('real PostgreSQL: code-first, seed idempotency, sequence advancement and HTTP CRUD', { skip: !process.env.TEST_DATABASE_URL }, async () => {
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
    // search_path also isolates raw sequence queries in the seed script.
    const adapter = new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` }, { schema });
    prisma = new PrismaClient({ adapter });
    await seedDatabase(prisma);
    await seedDatabase(prisma);
    assert.deepEqual(await Promise.all([prisma.dish.count(), prisma.chef.count(), prisma.ingredient.count()]), [12, 4, 10]);
    const app = createApp({ db: prisma });
    for (const [resource, model, data, lastSeedId] of [
      ['dishes', 'dish', { name: 'Integration dish', price: '55000' }, 12],
      ['chefs', 'chef', { name: 'Integration chef' }, 4],
      ['ingredients', 'ingredient', { name: 'Integration ingredient', unit: 'g' }, 10],
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
  } finally {
    await prisma?.$disconnect();
    // Name was generated here, not supplied by a request or user input.
    await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await control.end();
  }
});
