// Editorial display order only; does not change ratings, prices or explicit user sorts.
export const showcaseKeys = ['showcase:oysters-lemon', 'showcase:lobster-platter', 'showcase:rose-wine'];
const restaurantNames = ['The Monkey Gallery Dining', 'Miên Saigon', 'Vietnam House', 'Hoi An Sense', 'Ănăn Saigon', 'Little Bear', 'Hoa Túc (Sài Gòn)'];
export function restaurantPriority(row) {
  if (row.isDemo) return 1000;
  const index = restaurantNames.indexOf(row.name);
  if (index !== -1) return index;
  if (row.priceMinVnd >= 500000 || /contemporary|fine dining/i.test(row.cuisine || '')) return 100;
  if (row.priceMinVnd >= 150000) return 200;
  return 300;
}
export const compareRestaurants = (a, b) => restaurantPriority(a) - restaurantPriority(b) || a.id - b.id;
export function dishPriority(row) {
  const index = showcaseKeys.indexOf(row.importKey);
  if (index !== -1) return index;
  if (row.importKey === 'user-image:photo-1467003909585-2f8a72700288') return 3;
  if (['Hải sản', 'Rượu vang'].includes(row.category)) return 10;
  return row.priceIsDemo ? 30 : 20;
}
export const compareDishes = (a, b) => Number(b.available !== false) - Number(a.available !== false) || dishPriority(a) - dishPriority(b) || a.id - b.id;
