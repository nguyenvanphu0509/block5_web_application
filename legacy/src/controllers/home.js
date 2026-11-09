import { homeData } from '../../../api/src/home.js';
import { queryText, HttpError, parseId } from '../validators/index.js';
import { homeHref } from '../lib/presentation.js';
import { searchWhere } from '../../../api/src/lib/search.js';

export function createHomeController(db) {
  return async (req, res) => {
    const data = await homeData(db, req.query);
    res.render('home/index', {
      title: 'Khám phá tinh hoa ẩm thực Sài Gòn', ...data,
      href: (changes, anchor) => homeHref(data.state, changes, anchor),
    });
  };
}
export function createRestaurantController(db) {
  return {
    async suggestions(req, res) {
      const query = queryText(req.query.q, 'Từ khóa');
      if (!query) return res.json({ suggestions: [] });
      const suggestions = await db.restaurant.findMany({ where: searchWhere(query), orderBy: { id: 'asc' }, take: 6,
        select: { id: true, name: true, district: true, address: true } });
      res.set('Cache-Control', 'no-store').json({ suggestions });
    },
    async show(req, res) {
      const restaurant = await db.restaurant.findUnique({ where: { id: parseId(req.params.id) }, include: { dishes: { orderBy: { id: 'asc' } } } });
      if (!restaurant) throw new HttpError(404, 'Quán ăn không tồn tại.');
      res.render('restaurants/show', { title: restaurant.name, restaurant });
    },
  };
}
