import test from 'node:test';
import assert from 'node:assert/strict';
import { seedDatabase } from '../prisma/seed.js';

test('seed is repeatable, searchable and preserves existing records and database-generated IDs', async () => {
  const rows = {dish:[{id:100,name:'Món nhóm'}],chef:[{id:100,name:'Đầu bếp nhóm'}],ingredient:[{id:100,name:'Nguyên liệu nhóm'}]};
  const db = { async $transaction(work) { return work(this); } };
  for (const model of Object.keys(rows)) db[model] = {
    async upsert({where,update,create}) {
      assert.deepEqual(update,{});
      assert.ok(!Object.hasOwn(create,'id'));
      const [key,value] = Object.entries(where)[0];
      const existing = rows[model].find(row=>row[key]===value);
      if(existing) return existing;
      const row = {id:Math.max(...rows[model].map(row=>row.id))+1,...create};
      rows[model].push(row); return row;
    },
  };
  assert.deepEqual(await seedDatabase(db),{dishes:12,chefs:4,ingredients:10});
  rows.dish[1].name='Món seed đã chỉnh';
  await seedDatabase(db);
  assert.equal(rows.dish.length,13);assert.equal(rows.chef.length,5);assert.equal(rows.ingredient.length,11);
  assert.equal(rows.dish[0].name,'Món nhóm');assert.equal(rows.dish[1].name,'Món seed đã chỉnh');
  assert.ok(rows.dish[1].searchText.includes('pho'));
});
