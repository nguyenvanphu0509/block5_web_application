import { parseId, queryText, HttpError } from '../validators/index.js';
export function createDishController(db) {
  return {
    async index(req, res) {
      const q = queryText(req.query.q, 'Từ khóa');
      const dishes = await db.dish.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, orderBy: { id: 'asc' } });
      res.render('dishes/index', { title: 'Thực đơn', dishes, q });
    },
    async show(req, res) {
      const dish = await db.dish.findUnique({ where: { id: parseId(req.params.id) } });
      if (!dish) throw new HttpError(404, 'Món ăn này không tồn tại.');
      res.render('dishes/show', { title: dish.name, dish });
    },
  };
}
