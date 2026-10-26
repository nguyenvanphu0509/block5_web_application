import { queryText, queryPage, HttpError, parseId } from '../validators/index.js';
import { homeHref } from '../lib/presentation.js';
import { searchWhere } from '../../../api/src/lib/search.js';

export function createHomeController(db) {
  return async (req, res) => {
    const state = {
      destinationQ: queryText(req.query.destinationQ, 'Từ khóa địa điểm'),
      destinationPage: queryPage(req.query.destinationPage, 'Trang địa điểm'),
      reviewTab: queryText(req.query.reviewTab, 'Loại nội dung') || 'text',
      reviewPage: queryPage(req.query.reviewPage, 'Trang cảm hứng'),
    };
    if (!['text', 'gallery'].includes(state.reviewTab)) throw new HttpError(400, 'Loại nội dung không hợp lệ.');
    const where = searchWhere(state.destinationQ);
    const featuredNames = ['Ốc nhồi thịt hấp sả', 'Chả cá Lã Vọng', 'Phở bò'];
    const [restaurants, destinationCount, totalRestaurants, featuredDishes, gallery, reviews, reviewCount] = await Promise.all([
      db.restaurant.findMany({ where, orderBy: { id: 'asc' }, skip: (state.destinationPage - 1) * 6, take: 6 }),
      db.restaurant.count({ where }), db.restaurant.count(),
      db.dish.findMany({ where: { name: { in: featuredNames } }, orderBy: { id: 'asc' }, take: 3 }),
      db.restaurant.findMany({ orderBy: { id: 'asc' }, skip: ((state.reviewPage - 1) % 4) * 9, take: 9 }),
      db.story.findMany({ orderBy: { id: 'asc' }, skip: (state.reviewPage - 1) * 3, take: 3 }), db.story.count(),
    ]);
    const featured = featuredNames.map(name => featuredDishes.find(dish => dish.name === name)).filter(Boolean);
    res.render('home/index', {
      title: 'Khám phá tinh hoa ẩm thực Sài Gòn', featured, state, restaurants, totalRestaurants,
      destinationCount, destinationPages: Math.ceil(destinationCount / 6),
      reviewPhotos: Array.from({ length: 3 }, (_, index) => gallery.slice(index * 3, index * 3 + 3)),
      reviews, reviewPages: Math.ceil(reviewCount / 3),
      href: (changes, anchor) => homeHref(state, changes, anchor),
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
