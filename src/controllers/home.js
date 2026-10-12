import { readFileSync } from 'node:fs';
import { reviews } from '../../data/demo.js';
import { queryText, queryPage, HttpError } from '../validators/index.js';
import { homeHref } from '../lib/presentation.js';

const restaurants = JSON.parse(readFileSync(new URL('../../data/michelin-restaurants.json', import.meta.url), 'utf8'));
export function createHomeController(db) {
  return async (req, res) => {
    const state = {
      destinationQ: queryText(req.query.destinationQ, 'Từ khóa địa điểm'),
      destinationPage: queryPage(req.query.destinationPage, 'Trang địa điểm'),
      reviewTab: queryText(req.query.reviewTab, 'Loại nội dung') || 'text',
      reviewPage: queryPage(req.query.reviewPage, 'Trang cảm hứng'),
    };
    if (!['text', 'gallery'].includes(state.reviewTab)) throw new HttpError(400, 'Loại nội dung không hợp lệ.');
    const matches = restaurants.filter(row => row.name.toLocaleLowerCase('vi').includes(state.destinationQ.toLocaleLowerCase('vi')));
    const featured = await db.dish.findMany({ orderBy: { id: 'asc' }, take: 3 });
    res.render('home/index', {
      title: 'Khám phá tinh hoa ẩm thực Sài Gòn', featured, state,
      restaurants: matches.slice((state.destinationPage - 1) * 6, state.destinationPage * 6),
      destinationCount: matches.length, destinationPages: Math.ceil(matches.length / 6),
      reviews: reviews.slice((state.reviewPage - 1) * 3, state.reviewPage * 3), reviewPages: Math.ceil(reviews.length / 3),
      href: (changes, anchor) => homeHref(state, changes, anchor),
    });
  };
}
