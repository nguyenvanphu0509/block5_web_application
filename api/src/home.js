import { normalizeSearch } from './lib/search.js';
import { queryPage, queryText } from './validators/query.js';
import { BusinessError } from './validation.js';

// Read current fields/links so a freshly db-pushed schema also works without
// the optional legacy search-index triggers installed on the original database.
export function filterRestaurants(rows, query) {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  return rows.filter(row => {
    const text = normalizeSearch([row.name, row.address, row.ward, row.district, row.cuisine, ...(row.notableDishes || []), ...(row.dishes || []).map(x => x.name), row.cuisine === 'Vegetarian' ? 'món chay' : ''].join(' '));
    return tokens.every(token => text.includes(token));
  });
}
export async function homeData(db, query) {
  let state;
  try {
    state = { destinationQ: queryText(query.destinationQ, 'Từ khóa địa điểm'), destinationPage: queryPage(query.destinationPage, 'Trang địa điểm'), reviewTab: queryText(query.reviewTab, 'Loại nội dung') || 'text', reviewPage: queryPage(query.reviewPage, 'Trang cảm hứng') };
    if (!['text', 'gallery'].includes(state.reviewTab) || state.destinationPage > 1000000 || state.reviewPage > 1000000) throw new Error();
  } catch { throw new BusinessError('VALIDATION_FAILED', 'Tham số tìm kiếm không hợp lệ.', { q: 'Kiểm tra từ khóa, trang hoặc loại nội dung.' }); }
  const featuredNames = ['Ốc nhồi thịt hấp sả', 'Chả cá Lã Vọng', 'Phở bò'];
  const [all, featured, reviews, reviewCount] = await Promise.all([
    db.restaurant.findMany({ include: { dishes: true }, orderBy: { id: 'asc' } }),
    db.dish.findMany({ where: { name: { in: featuredNames } }, orderBy: { id: 'asc' }, take: 3 }),
    db.story.findMany({ orderBy: { id: 'asc' }, skip: (state.reviewPage - 1) * 3, take: 3 }), db.story.count(),
  ]);
  const filtered = filterRestaurants(all, state.destinationQ);
  const gallery = all.slice(((state.reviewPage - 1) % 4) * 9, ((state.reviewPage - 1) % 4) * 9 + 9);
  return {
    state, featured: featuredNames.map(name => featured.find(x => x.name === name)).filter(Boolean),
    restaurants: filtered.slice((state.destinationPage - 1) * 6, state.destinationPage * 6),
    destinationCount: filtered.length, totalRestaurants: all.length, destinationPages: Math.ceil(filtered.length / 6),
    reviews, reviewPhotos: Array.from({ length: 3 }, (_, i) => gallery.slice(i * 3, i * 3 + 3)), reviewPages: Math.ceil(reviewCount / 3),
  };
}
