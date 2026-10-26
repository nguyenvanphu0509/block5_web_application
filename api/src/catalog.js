import { Prisma } from '@prisma/client';
import { normalizeSearch } from './lib/search.js';
import { prepareFulltextQuery } from './lib/fulltext-query.js';
import { queryText, queryPage } from './validators/query.js';
import { BusinessError } from './validation.js';
import { filterRestaurants } from './home.js';

export const sorts = {
  default: { label: 'Mặc định', order: [] }, name: { label: 'Tên món A–Z', order: [{ name: 'asc' }] },
  'price-asc': { label: 'Giá tăng dần', order: [{ price: { sort: 'asc', nulls: 'last' } }] },
  'price-desc': { label: 'Giá giảm dần', order: [{ price: { sort: 'desc', nulls: 'last' } }] },
  restaurant: { label: 'Theo nhà hàng', order: [{ restaurant: { name: 'asc' } }, { name: 'asc' }] },
  district: { label: 'Theo khu vực', order: [{ restaurant: { district: { sort: 'asc', nulls: 'last' } } }, { restaurant: { name: 'asc' } }, { name: 'asc' }] },
  category: { label: 'Theo loại món', order: [{ category: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }] },
  chef: { label: 'Theo đầu bếp', order: [{ chef: { name: 'asc' } }, { name: 'asc' }] },
};
export function queryState(query) {
  try {
    const state = { q: queryText(query.q, 'Từ khóa'), mode: queryText(query.mode, 'Chế độ') || 'basic', page: queryPage(query.page, 'Trang'), pageSize: query.pageSize === undefined ? 12 : queryPage(query.pageSize, 'Số món'), sort: queryText(query.sort, 'Sắp xếp') || 'default', district: queryText(query.district, 'Khu vực'), category: queryText(query.category, 'Loại món'), available: queryText(query.available, 'Trạng thái') };
    if (state.page > 1000000 || state.pageSize > 100 || !['basic', 'advanced', 'fulltext', 'fuzzy'].includes(state.mode) || !Object.hasOwn(sorts, state.sort) || !['', 'true', 'false'].includes(state.available)) throw new Error();
    for (const field of ['restaurantId', 'chefId', 'ingredientId']) {
      const value = queryText(query[field], field);
      if (value && (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647)) throw new Error();
      state[field] = value ? Number(value) : null;
    }
    for (const field of ['minPrice', 'maxPrice']) {
      const value = queryText(query[field], field);
      if (value && (!/^\d+$/.test(value) || Number(value) > 2147483647)) throw new Error();
      state[field] = value === '' ? null : Number(value);
    }
    if (state.minPrice !== null && state.maxPrice !== null && state.minPrice > state.maxPrice) throw new Error();
    return state;
  } catch { throw new BusinessError('VALIDATION_FAILED', 'Tham số tìm kiếm không hợp lệ.', { q: 'Kiểm tra chế độ, trang, khoảng giá và bộ lọc.' }); }
}
// Every SQL fragment below is constant or bound with Prisma.sql. No input becomes SQL syntax.
export function dishQueries(s) {
  const predicates = [Prisma.sql`TRUE`];
  const normalized = Prisma.sql`block7_normalize(${s.q})`;
  let score = null;
  if (s.q) {
    if (s.mode === 'fulltext') {
      const keywords = Prisma.sql`block7_normalize(${prepareFulltextQuery(s.q)})`;
      const tsq = Prisma.sql`websearch_to_tsquery('simple', ${keywords})`;
      predicates.push(Prisma.sql`d."searchVector" @@ ${tsq}`);
      score = Prisma.sql`ts_rank(d."searchVector", ${tsq})`;
    } else if (s.mode === 'fuzzy') {
      score = Prisma.sql`block7_similarity(d."nameSearch", ${normalized})`;
      predicates.push(Prisma.sql`${score} >= 0.3`);
    } else {
      const escaped = s.q.replace(/[!%_]/g, '!$&');
      predicates.push(Prisma.sql`d."nameSearch" ILIKE ('%' || block7_normalize(${escaped}) || '%') ESCAPE '!'`);
    }
  }
  for (const [key, column] of [['restaurantId', 'restaurantId'], ['chefId', 'chefId'], ['category', 'category']]) {
    if (s[key] !== null && s[key] !== '') predicates.push(Prisma.sql`${Prisma.raw(`d."${column}"`)} = ${s[key]}`);
  }
  if (s.available !== '') predicates.push(Prisma.sql`d.available = ${s.available === 'true'}`);
  if (s.minPrice !== null) predicates.push(Prisma.sql`d.price >= ${s.minPrice}`);
  if (s.maxPrice !== null) predicates.push(Prisma.sql`d.price <= ${s.maxPrice}`);
  if (s.district) predicates.push(Prisma.sql`r.district = ${s.district}`);
  if (s.ingredientId) predicates.push(Prisma.sql`EXISTS (SELECT 1 FROM dish_ingredients di WHERE di."dishId" = d.id AND di."ingredientId" = ${s.ingredientId})`);
  const order = { default: 'd.id ASC', name: 'd.name ASC, d.id ASC', 'price-asc': 'd.price ASC NULLS LAST, d.id ASC', 'price-desc': 'd.price DESC NULLS LAST, d.id ASC', restaurant: 'r.name ASC NULLS LAST, d.name ASC, d.id ASC', district: 'r.district ASC NULLS LAST, r.name ASC NULLS LAST, d.name ASC, d.id ASC', category: 'd.category ASC NULLS LAST, d.name ASC, d.id ASC', chef: 'c.name ASC NULLS LAST, d.name ASC, d.id ASC' };
  const from = Prisma.sql`FROM dishes d LEFT JOIN restaurants r ON r.id = d."restaurantId" LEFT JOIN chefs c ON c.id = d."chefId" WHERE ${Prisma.join(predicates, ' AND ')}`;
  const ordering = score && s.sort === 'default' ? Prisma.sql`${score} DESC, d.id ASC` : Prisma.raw(order[s.sort]);
  return {
    items: Prisma.sql`SELECT d.id ${from} ORDER BY ${ordering} LIMIT ${s.pageSize} OFFSET ${(s.page - 1) * s.pageSize}`,
    count: Prisma.sql`SELECT count(*)::int AS total ${from}`,
  };
}
export async function listRecords(db, resource, model, query) {
  const state = queryState(query);
  if (resource !== 'dishes') {
    const rows = await model.findMany({ ...(resource === 'restaurants' ? { include: { dishes: true } } : {}), orderBy: { id: 'asc' } });
    const filtered = resource === 'restaurants' ? filterRestaurants(rows, state.q) : rows.filter(x => normalizeSearch(x.name).includes(normalizeSearch(state.q)));
    const start = (state.page - 1) * state.pageSize;
    return { data: filtered.slice(start, start + state.pageSize), meta: { count: filtered.length, total: filtered.length, page: state.page, pageSize: state.pageSize, preview: false } };
  }
  const queries = dishQueries(state);
  return db.$transaction(async tx => {
    const ids = await tx.$queryRaw(queries.items);
    const [{ total }] = await tx.$queryRaw(queries.count);
    const rows = ids.length ? await tx.dish.findMany({ where: { id: { in: ids.map(x => x.id) } }, include: { restaurant: true, chef: true } }) : [];
    const byId = new Map(rows.map(row => [row.id, row]));
    const categories = await tx.dish.findMany({ select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } });
    return { data: { items: ids.map(x => byId.get(x.id)), total, page: state.page, pageSize: state.pageSize }, meta: { categories: categories.map(x => x.category).filter(Boolean) } };
  }, { isolationLevel: 'RepeatableRead' });
}
