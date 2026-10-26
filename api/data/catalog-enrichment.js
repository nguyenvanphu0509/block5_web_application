import { normalizeSearch } from '../src/lib/search.js';

// Công thức và giá phục vụ bài tập, không phải menu/công thức xác nhận của quán.
export const demoRestaurants = [
  { catalogKey: 'demo:international', name: 'Bếp Quốc Tế · Demo', cuisine: 'Ẩm thực quốc tế', district: 'Quận 1', imagePath: '/images/rolls.svg' },
  { catalogKey: 'demo:seafood', name: 'Bếp Hải Sản · Demo', cuisine: 'Hải sản', district: 'Quận 4', imagePath: '/images/noodles.svg' },
  { catalogKey: 'demo:cafe', name: 'Góc Cà Phê · Demo', cuisine: 'Đồ uống & tráng miệng', district: 'Quận 3', imagePath: '/images/greens.svg' },
];
export const demoChefs = [
  ['Món nước', 'An Nguyễn · Demo'], ['Cơm & xôi', 'Bình Lê · Demo'],
  ['Bánh & món cuốn', 'Chi Trần · Demo'], ['Hải sản', 'Duy Phạm · Demo'],
  ['Món chay', 'Hà Vũ · Demo'], ['Ẩm thực quốc tế', 'Khánh Đỗ · Demo'],
  ['Đồ uống & tráng miệng', 'Mai Lê · Demo'], ['Nướng & món chính', 'Nam Trần · Demo'],
].map(([specialty, name], index) => ({ catalogKey: `demo:chef:${index}`, name, specialty }));
export const ingredientCatalog = [
  ['Bánh phở','g'], ['Bún','g'], ['Thịt bò','g'], ['Thịt gà','g'], ['Thịt heo','g'],
  ['Rau thơm','g'], ['Sả','g'], ['Bánh tráng','g'], ['Nước mắm','ml'], ['Gạo','g'],
  ['Tôm','g'], ['Cua','g'], ['Ốc','g'], ['Cá','g'], ['Cá hồi','g'], ['Sò điệp','g'],
  ['Hàu','g'], ['Nghêu','g'], ['Rau xanh','g'], ['Cà chua','g'], ['Khoai tây','g'],
  ['Phô mai','g'], ['Bột mì','g'], ['Mì Ý','g'], ['Bánh mì','g'], ['Trứng','quả'],
  ['Đậu hũ','g'], ['Mè đen','g'], ['Bắp','g'], ['Bưởi','g'], ['Đường','g'],
  ['Chanh','quả'], ['Trái cây','g'], ['Miến','g'], ['Lá lốt','g'], ['Bột gạo','g'],
  ['Gạo nếp','g'], ['Tiêu xanh','g'], ['Gừng','g'], ['Nước cốt dừa','ml'],
  ['Gan ngỗng','g'], ['Sữa','ml'], ['Mạch nha','g'],
];
export function recipeSuggestion(dish) {
  const name = normalizeSearch(dish.name);
  const ingredients = new Set(['Rau thơm']);
  let specialty = 'Nướng & món chính', price = 95000;
  if (/^pho\b|\bbun\b|^mi\b|hu tieu|\bmien\b/.test(name)) { specialty = 'Món nước'; price = 65000; }
  if (/^pho\b/.test(name)) ingredients.add('Bánh phở');
  if (/\bbun\b/.test(name)) ingredients.add('Bún');
  if (/\bmien\b/.test(name)) ingredients.add('Miến');
  if (/mi quang|hu tieu/.test(name)) ingredients.add('Bột gạo');
  if (/\bcom\b|\bxoi\b/.test(name)) { specialty = 'Cơm & xôi'; price = 75000; ingredients.add(/\bxoi\b/.test(name) ? 'Gạo nếp' : 'Gạo'); }
  if (/\bbanh\b|cha gio|\bcuon\b|\bnem\b|pate/.test(name)) { specialty = 'Bánh & món cuốn'; price = 65000; ingredients.add(/banh mi/.test(name) ? 'Bánh mì' : /pate|tart/.test(name) ? 'Bột mì' : 'Bột gạo'); }
  if (/pate/.test(name)) ingredients.add('Thịt heo');
  if (/pizza|burger|sandwich|penne|khoai tay|wagyu/.test(name)) { specialty = 'Ẩm thực quốc tế'; price = 150000; ingredients.add('Bột mì'); }
  if (/salad|\bchay\b|rau cham/.test(name)) { specialty = 'Món chay'; price = 65000; ingredients.add('Rau xanh'); }
  if (/\btom\b|\bcua\b|\boc\b|ca chem|ca hoi|cha ca|\bhau\b|so diep|\bngheu\b|hai san/.test(name)) {
    price = 120000;
    if (!/^pho\b|\bbun\b|^mi\b|\bmien\b|\bbanh\b|\bcom\b|\bcuon\b|cha gio/.test(name)) specialty = 'Hải sản';
  }
  for (const [pattern, ingredient] of [
    [/\bbo\b|wagyu/,'Thịt bò'], [/\bga\b/,'Thịt gà'], [/\bheo\b|thit nuong|\bnem\b/,'Thịt heo'],
    [/\btom\b/,'Tôm'], [/\bcua\b/,'Cua'], [/\boc\b/,'Ốc'], [/ca hoi/,'Cá hồi'], [/cha ca|ca chem/,'Cá'],
    [/\bhau\b/,'Hàu'], [/so diep/,'Sò điệp'], [/\bngheu\b|vo so/,'Nghêu'], [/khoai tay/,'Khoai tây'],
    [/pho mai|pizza/,'Phô mai'], [/penne/,'Mì Ý'], [/salad|\brau\b/,'Rau xanh'], [/ca chua/,'Cà chua'],
    [/\bcuon\b|cha gio/,'Bánh tráng'], [/\btrung\b/,'Trứng'], [/dau hu|tau hu|\bchay\b/,'Đậu hũ'],
    [/me den/,'Mè đen'], [/\bbap\b/,'Bắp'], [/\bbuoi\b/,'Bưởi'], [/la lot/,'Lá lốt'],
    [/tieu xanh/,'Tiêu xanh'], [/\bgung\b/,'Gừng'], [/\bsa\b/,'Sả'], [/cot dua/,'Nước cốt dừa'], [/gan ngong/,'Gan ngỗng'],
  ]) if (pattern.test(name)) ingredients.add(ingredient);
  if (/mochi|tau hu|do uong|\bbia\b|cream|\bkem\b/.test(name)) {
    specialty = 'Đồ uống & tráng miệng'; price = 45000;
    ingredients.delete('Rau thơm'); ingredients.add('Đường');
    if (/mochi/.test(name)) ingredients.add('Gạo nếp');
    if (/\bbia\b/.test(name)) { ingredients.clear(); ingredients.add('Mạch nha'); }
    if (/cream|\bkem\b/.test(name)) ingredients.add('Sữa');
    if (/trai cay/.test(name)) ingredients.add('Trái cây');
    if (/\bchanh\b/.test(name)) ingredients.add('Chanh');
  }
  return { specialty, price, ingredients: [...ingredients] };
}
export function demoRestaurantKey(dish) {
  const text = normalizeSearch(`${dish.name} ${dish.category}`);
  if (/do uong|bia|cream|trang mieng/.test(text)) return 'demo:cafe';
  if (/hai san|ca hoi|hau|ngheu|so diep|tom va/.test(text)) return 'demo:seafood';
  return 'demo:international';
}
