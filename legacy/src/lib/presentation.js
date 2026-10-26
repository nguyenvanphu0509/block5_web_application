export const money = value => value == null ? 'Hỏi quán' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const dateLabel = value => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
export function restaurantPrice(restaurant) {
  const { priceMinVnd: min, priceMaxVnd: max } = restaurant;
  if (min == null && max == null) return 'Hỏi quán';
  if (max === null) return `Từ ${money(min)}`;
  if (min === 0) return `Dưới ${money(max)}`;
  return `${money(min)} – ${money(max)}`;
}
export function homeHref(state, changes, anchor) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...state, ...changes })) {
    if (value !== '' && value !== 1 && !(key === 'reviewTab' && value === 'text')) params.set(key, value);
  }
  return `/${params.size ? `?${params}` : ''}#${anchor}`;
}
