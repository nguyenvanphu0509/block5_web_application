import { createDatabaseClient } from '../src/db/client.js';
import { normalizeSearch } from '../src/lib/search.js';
import { demoRestaurants, demoChefs, ingredientCatalog, recipeSuggestion, demoRestaurantKey } from '../data/catalog-enrichment.js';

let prisma;
try {
  prisma = createDatabaseClient();
  if (!process.argv.includes('--apply')) {
    console.log(`Hiện có ${await prisma.dish.count()} món. Bổ sung giá còn thiếu, ảnh metadata, quán demo và liên kết công thức demo.`);
    console.log('Chưa ghi dữ liệu. Chạy --apply để áp dụng; không tạo lại món đã xóa.');
  } else {
    const summary = await prisma.$transaction(async tx => {
      const restaurants = new Map(), chefs = new Map(), ingredients = new Map();
      for (const item of demoRestaurants) {
        const row = await tx.restaurant.upsert({ where: { catalogKey: item.catalogKey }, update: {}, create: {
          ...item, isDemo: true, photoType: 'Ảnh minh họa',
          address: 'Địa điểm hư cấu cho bài tập', ward: 'Khu vực minh họa',
          searchText: normalizeSearch(`${item.name} ${item.district} ${item.cuisine}`),
        } });
        restaurants.set(item.catalogKey, row);
      }
      for (const item of demoChefs) {
        const row = await tx.chef.upsert({ where: { catalogKey: item.catalogKey }, update: {}, create: { ...item, isDemo: true } });
        chefs.set(item.specialty, row);
      }
      for (const [name, unit] of ingredientCatalog) {
        const existing = await tx.ingredient.findFirst({ where: { name }, orderBy: { id: 'asc' } });
        const row = existing || await tx.ingredient.upsert({ where: { catalogKey: `demo:ingredient:${normalizeSearch(name)}` }, update: {}, create: { name, unit, isDemo: true, catalogKey: `demo:ingredient:${normalizeSearch(name)}` } });
        ingredients.set(name, row);
      }
      const dishes = await tx.dish.findMany({ include: { restaurant: true, chef: true, ingredients: true } });
      let prices = 0, linkedRestaurants = 0, recipes = 0;
      const categories = { Noodles: 'Món nước', 'Street Food': 'Ẩm thực đường phố', Vietnamese: 'Món Việt', 'Vietnamese Contemporary': 'Món Việt sáng tạo', Seafood: 'Hải sản', 'Fish and Seafood': 'Hải sản', Cantonese: 'Món Hoa', Vegetarian: 'Món chay' };
      for (const dish of dishes) {
        const suggestion = recipeSuggestion(dish), data = {};
        const restaurant = dish.restaurant || restaurants.get(demoRestaurantKey(dish));
        if (!dish.restaurantId) { data.restaurantId = restaurant.id; linkedRestaurants++; }
        if (dish.price == null) { data.price = suggestion.price; data.priceIsDemo = true; data.priceLabel = 'Giá demo'; prices++; }
        else if (dish.importKey?.startsWith('user-') && !dish.priceIsDemo) { data.priceIsDemo = true; data.priceLabel = 'Giá demo'; }
        if (!dish.photoType?.trim()) data.photoType = dish.imagePath?.includes('prod-pics.guide.michelin.com/') ? 'Ảnh hồ sơ quán' : 'Ảnh minh họa';
        if (!dish.priceSymbol) data.priceSymbol = 'VND';
        if (!dish.priceLabel && !data.priceLabel) data.priceLabel = dish.priceIsDemo ? 'Giá demo' : 'Giá do người quản trị nhập';
        if (categories[dish.category]) data.category = categories[dish.category];
        if (!dish.chefId) { data.chefId = chefs.get(suggestion.specialty).id; data.recipeIsDemo = true; }
        const refreshRecipe = process.argv.includes('--refresh-demo-recipes') && dish.recipeIsDemo && dish.chef?.catalogKey?.startsWith('demo:chef:');
        if (refreshRecipe) data.chefId = chefs.get(suggestion.specialty).id;
        if (!dish.ingredients.length || refreshRecipe) {
          data.ingredients = { ...(refreshRecipe ? { deleteMany: {} } : {}), create: suggestion.ingredients.map(name => ({ ingredientId: ingredients.get(name).id })) };
          data.recipeIsDemo = true; recipes++;
        }
        data.searchText = normalizeSearch(`${dish.name} ${data.category || dish.category} ${restaurant.name} ${restaurant.district || ''}`);
        await tx.dish.update({ where: { id: dish.id }, data });
      }
      for (const restaurant of restaurants.values()) {
        const menu = await tx.dish.findMany({ where: { restaurantId: restaurant.id }, orderBy: { id: 'asc' } });
        const prices = menu.map(d => d.price).filter(price => price != null);
        await tx.restaurant.update({ where: { id: restaurant.id }, data: {
          notableDishes: menu.slice(0,3).map(d => d.name),
          priceMinVnd: prices.length ? Math.min(...prices) : null,
          priceMaxVnd: prices.length ? Math.max(...prices) : null,
        } });
      }
      return { dishes: dishes.length, pricesAdded: prices, restaurantsLinked: linkedRestaurants, recipesAdded: recipes };
    }, { maxWait: 10000, timeout: 120000 });
    console.log('Đã bổ sung dữ liệu demo:', summary);
    console.log(process.argv.includes('--refresh-demo-recipes')
      ? 'Đã tạo lại gợi ý công thức demo; giữ giá/ảnh và không tạo/xóa món.'
      : 'Không tạo/xóa món; giữ giá đã có, ảnh và liên kết đã có. Chạy lại không nhân đôi.');
  }
} catch (error) {
  console.error('Bổ sung chưa hoàn tất.', { code: error.code || 'DATABASE_ERROR' });
  process.exitCode = 1;
} finally { await prisma?.$disconnect(); }
