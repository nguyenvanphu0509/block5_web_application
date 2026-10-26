import { demoDishes, demoChefs, demoIngredients, reviews } from '../api/data/demo.js';
import { normalizeSearch } from '../api/src/lib/search.js';
// Isolated test double for HTTP contracts. Real Prisma/PG tests are separate.
export function createFixture() {
  const storage = { dish: structuredClone(demoDishes), chef: structuredClone(demoChefs), ingredient: structuredClone(demoIngredients) };
  storage.restaurant = [
    { id: 1, name: 'Phở Minh (Sài Gòn)', cuisine: 'Noodles', district: 'Quận 1', notableDishes: ['Phở bò'] },
    { id: 2, name: 'Xôi Gà Number One', cuisine: 'Street Food', district: 'Quận 1', notableDishes: ['Xôi gà'] },
    { id: 3, name: 'Quán Chay Demo', cuisine: 'Vegetarian', district: 'Quận 3', notableDishes: ['Rau xào'] },
  ].map(row => ({ address: 'Địa chỉ minh họa', imagePath: '/images/restaurant.svg', isDemo: true, createdAt: '2026-10-13T00:00:00.000Z', priceMinVnd: null, priceMaxVnd: null, ...row }));
  storage.story = reviews.map((row, i) => ({ ...row, id: i + 1 }));
  storage.dishIngredient = [];
  for (const row of [...storage.dish, ...storage.restaurant]) row.searchText = normalizeSearch([row.name, row.category, row.address, row.district, row.cuisine, ...(row.notableDishes || []), row.cuisine === 'Vegetarian' ? 'món chay' : ''].join(' '));
  const expand = (row, name) => name === 'dish' ? { ...row,
    restaurant: storage.restaurant.find(item => item.id === row.restaurantId) || null,
    chef: storage.chef.find(item => item.id === row.chefId) || null,
    ingredients: storage.dishIngredient.filter(link => link.dishId === row.id).map(link => ({ ...link, ingredient: storage.ingredient.find(i => i.id === link.ingredientId) })),
  } : { ...row, dishes: storage.dish.filter(item => item.restaurantId === row.id) };
  const matches = (row, where) => Object.entries(where || {}).every(([key, value]) => {
    if (key === 'AND') return value.every(term => matches(row, term));
    if (key === 'restaurant') return !!row.restaurant && matches(row.restaurant, value.is || value);
    if (key === 'ingredients') return row.ingredients.some(link => matches(link, value.some));
    if (value && typeof value === 'object') {
      if (value.in) return value.in.includes(row[key]);
      if (value.contains !== undefined) return String(row[key] || '').includes(value.contains);
    }
    return row[key] === value;
  });
  function compare(a,b,spec) {
    const [key, rule] = Object.entries(spec)[0];
    if (rule && typeof rule === 'object' && !rule.sort) return compare(a?.[key],b?.[key],rule);
    const direction = typeof rule === 'string' ? rule : rule.sort;
    const av = a?.[key], bv = b?.[key];
    if (av == null || bv == null) return av == bv ? 0 : av == null ? 1 : -1;
    const result = typeof av === 'number' ? av-bv : String(av).localeCompare(String(bv),'vi');
    return direction === 'desc' ? -result : result;
  }
  function relations(record, data) {
    if (!data.ingredients) return;
    if (data.ingredients.deleteMany) storage.dishIngredient = storage.dishIngredient.filter(link => link.dishId !== record.id);
    for (const link of data.ingredients.create || []) storage.dishIngredient.push({ dishId:record.id, ...link });
  }
  const db = {};
  for (const [name, rows] of Object.entries(storage)) {
    db[name] = {
      async findMany({ where, take, skip = 0, select, distinct, orderBy = {id:'asc'} } = {}) {
        let result = rows.map(row => expand(row,name)).filter(row => matches(row, where));
        const order = Array.isArray(orderBy) ? orderBy : [orderBy];
        result.sort((a,b) => order.reduce((answer,spec) => answer || compare(a,b,spec),0));
        if (distinct) { const seen = new Set(); result = result.filter(row => { const key = JSON.stringify(distinct.map(field => row[field])); if(seen.has(key)) return false; seen.add(key); return true; }); }
        result = result.slice(skip,take == null ? undefined : skip+take);
        return structuredClone(select ? result.map(row => Object.fromEntries(Object.keys(select).map(key => [key,row[key]]))) : result);
      },
      async count({ where } = {}) { return rows.filter(row => matches(expand(row,name), where)).length; },
      async findUnique({ where }) {
        const row = rows.find(row => row.id === where.id);
        return row ? structuredClone(expand(row,name)) : null;
      },
      async create({ data }) {
        const record = { id: Math.max(0, ...rows.map(row => row.id)) + 1, createdAt: new Date(), ...data };
        if(name === 'dish') { relations(record,data); delete record.ingredients; }
        rows.push(record); return structuredClone(record);
      },
      async update({ where, data }) {
        const record = rows.find(row => row.id === where.id);
        if (!record) throw Object.assign(new Error('Missing'), { code: 'P2025' });
        Object.assign(record, data); if(name === 'dish') { relations(record,data); delete record.ingredients; } return structuredClone(record);
      },
      async delete({ where }) {
        const index = rows.findIndex(row => row.id === where.id);
        if (index < 0) throw Object.assign(new Error('Missing'), { code: 'P2025' });
        const removed = rows.splice(index, 1)[0];
        if(name === 'dish') storage.dishIngredient = storage.dishIngredient.filter(link => link.dishId !== where.id);
        if(name === 'ingredient') storage.dishIngredient = storage.dishIngredient.filter(link => link.ingredientId !== where.id);
        if(name === 'chef') storage.dish.forEach(dish => { if(dish.chefId === where.id) dish.chefId = null; });
        return removed;
      },
    };
  }
  // SQL test double for the basic dish-list contract only. Full-text/fuzzy and
  // actual SQL correctness are verified against PostgreSQL in block7.integration.js.
  db.$queryRaw = async sql => {
    const text = sql.text, values = sql.values;
    if (/searchVector|block7_similarity/.test(text)) throw new Error('Use PostgreSQL integration tests for ranked search.');
    let result = storage.dish.map(row => expand(row, 'dish'));
    const folded = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase();
    const search = text.match(/block7_normalize\(\$(\d+)\)/);
    if (search) {
      const literal = values[Number(search[1]) - 1].replace(/!([!%_])/g, '$1');
      result = result.filter(row => folded(row.name).includes(folded(literal)));
    }
    for (const match of text.matchAll(/d\."(restaurantId|chefId|category)" = \$(\d+)/g)) result = result.filter(row => row[match[1]] === values[Number(match[2]) - 1]);
    const available = text.match(/d\.available = \$(\d+)/);
    if (available) result = result.filter(row => row.available === values[Number(available[1]) - 1]);
    for (const match of text.matchAll(/d\.price (>=|<=) \$(\d+)/g)) result = result.filter(row => row.price != null && (match[1] === '>=' ? row.price >= values[Number(match[2]) - 1] : row.price <= values[Number(match[2]) - 1]));
    const district = text.match(/r\.district = \$(\d+)/);
    if (district) result = result.filter(row => row.restaurant?.district === values[Number(district[1]) - 1]);
    const ingredient = text.match(/di\."ingredientId" = \$(\d+)/);
    if (ingredient) result = result.filter(row => row.ingredients.some(x => x.ingredientId === values[Number(ingredient[1]) - 1]));
    if (text.startsWith('SELECT count')) return [{ total: result.length }];
    const sorting = text.match(/ORDER BY (.*?) LIMIT/)[1];
    const order = sorting.includes('d.price') ? [{ price: sorting.includes('price DESC') ? 'desc' : 'asc' }, { id: 'asc' }] : sorting.startsWith('d.name') ? [{ name: 'asc' }, { id: 'asc' }] : [{ id: 'asc' }];
    result.sort((a, b) => order.reduce((answer, spec) => answer || compare(a, b, spec), 0));
    const paging = text.match(/LIMIT \$(\d+) OFFSET \$(\d+)/);
    const take = values[Number(paging[1]) - 1], skip = values[Number(paging[2]) - 1];
    return result.slice(skip, skip + take).map(({ id }) => ({ id }));
  };
  let tail = Promise.resolve();
  db.$transaction = work => {
    const run = tail.then(async () => {
      const snapshot = structuredClone(storage);
      try { return await work(db); }
      catch (error) {
        for (const key of Object.keys(storage)) storage[key].splice(0, storage[key].length, ...snapshot[key]);
        throw error;
      }
    });
    tail = run.catch(() => {});
    return run;
  };
  return { db, storage };
}
