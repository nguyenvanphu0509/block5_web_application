import { searchWhere } from '../lib/search.js';
import { parseId, queryText, queryPage, HttpError } from '../validators/index.js';
export const DISH_PAGE_SIZE = 12;
function swapDefaultPages(dishes) {
  const firstPage = dishes.slice(0, DISH_PAGE_SIZE);
  const seventhPageStart = DISH_PAGE_SIZE * 6;
  const seventhPage = dishes.slice(seventhPageStart, seventhPageStart + DISH_PAGE_SIZE);
  if (seventhPage.length < DISH_PAGE_SIZE) return dishes;
  return [...seventhPage, ...dishes.slice(DISH_PAGE_SIZE, seventhPageStart), ...firstPage, ...dishes.slice(seventhPageStart + DISH_PAGE_SIZE)];
}
const sortOptions = {
  default: { label: 'Mặc định', order: [] },
  name: { label: 'Tên món A–Z', order: [{ name: 'asc' }] },
  'price-asc': { label: 'Giá tăng dần', order: [{ price: { sort: 'asc', nulls: 'last' } }] },
  'price-desc': { label: 'Giá giảm dần', order: [{ price: { sort: 'desc', nulls: 'last' } }] },
  restaurant: { label: 'Theo nhà hàng', order: [{ restaurant: { name: 'asc' } }, { name: 'asc' }] },
  district: { label: 'Theo khu vực', order: [{ restaurant: { district: { sort: 'asc', nulls: 'last' } } }, { restaurant: { name: 'asc' } }, { name: 'asc' }] },
  category: { label: 'Theo loại món', order: [{ category: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }] },
  chef: { label: 'Theo đầu bếp', order: [{ chef: { name: 'asc' } }, { name: 'asc' }] },
};
function optionalId(raw, label) {
  const value = queryText(raw, label);
  if (!value) return null;
  if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) throw new HttpError(400, `${label} không hợp lệ.`);
  return Number(value);
}
export function createDishController(db) {
  return {
    async index(req, res) {
      const q = queryText(req.query.q, 'Từ khóa');
      const state = {
        q, page: queryPage(req.query.page, 'Trang món ăn'),
        sort: queryText(req.query.sort, 'Sắp xếp') || 'default',
        restaurantId: optionalId(req.query.restaurantId, 'Nhà hàng'),
        chefId: optionalId(req.query.chefId, 'Đầu bếp'),
        ingredientId: optionalId(req.query.ingredientId, 'Nguyên liệu'),
        district: queryText(req.query.district, 'Khu vực'), category: queryText(req.query.category, 'Loại món'),
        available: queryText(req.query.available, 'Trạng thái'),
      };
      if (!Object.hasOwn(sortOptions, state.sort) || !['', 'true', 'false'].includes(state.available) || state.page > 1000000) {
        throw new HttpError(400, 'Bộ lọc hoặc cách sắp xếp không hợp lệ.');
      }
      const where = {
        ...searchWhere(q),
        ...(state.restaurantId && { restaurantId: state.restaurantId }),
        ...(state.chefId && { chefId: state.chefId }),
        ...(state.ingredientId && { ingredients: { some: { ingredientId: state.ingredientId } } }),
        ...(state.district && { restaurant: { is: { district: state.district } } }),
        ...(state.category && { category: state.category }),
        ...(state.available && { available: state.available === 'true' }),
      };
      const [orderedDishes, count, total, restaurants, chefs, ingredients, categoryRows] = await Promise.all([
        db.dish.findMany({ where, include: { restaurant: true, chef: true },
          orderBy: [...sortOptions[state.sort].order, { id: 'asc' }], ...(state.sort === 'default' ? {} : { skip: (state.page - 1) * DISH_PAGE_SIZE, take: DISH_PAGE_SIZE }) }),
        db.dish.count({ where }), db.dish.count(),
        db.restaurant.findMany({ orderBy: { name: 'asc' } }),
        db.chef.findMany({ orderBy: { name: 'asc' } }), db.ingredient.findMany({ orderBy: { name: 'asc' } }),
        db.dish.findMany({ select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } }),
      ]);
      const dishes = state.sort === 'default'
        ? swapDefaultPages(orderedDishes).slice((state.page - 1) * DISH_PAGE_SIZE, state.page * DISH_PAGE_SIZE)
        : orderedDishes;
      const pages = Math.ceil(count / DISH_PAGE_SIZE);
      const href = (changes = {}) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries({ ...state, ...changes })) {
          if (value != null && value !== '' && !(key === 'page' && value === 1) && !(key === 'sort' && value === 'default')) params.set(key, value);
        }
        return `/dishes${params.size ? `?${params}` : ''}#menu-results`;
      };
      const pageNumbers = pages <= 12 ? Array.from({ length: pages }, (_, i) => i + 1)
        : [...new Set([1, pages, ...Array.from({ length: 5 }, (_, i) => state.page - 2 + i)])].filter(p => p > 0 && p <= pages).sort((a, b) => a - b);
      res.render('dishes/index', { title: 'Thực đơn', dishes, q, state, count, total, pages, pageNumbers, href,
        pageSize: DISH_PAGE_SIZE, restaurants, chefs, ingredients, sortOptions,
        districts: [...new Set(restaurants.map(r => r.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
        categories: categoryRows.map(r => r.category).filter(Boolean),
      });
    },
    async show(req, res) {
      const dish = await db.dish.findUnique({ where: { id: parseId(req.params.id) }, include: { restaurant: true, chef: true, ingredients: { include: { ingredient: true } } } });
      if (!dish) throw new HttpError(404, 'Món ăn này không tồn tại.');
      res.render('dishes/show', { title: dish.name, dish });
    },
  };
}
