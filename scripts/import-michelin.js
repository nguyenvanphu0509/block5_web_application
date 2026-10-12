import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../src/db/client.js';
import restaurants from '../data/michelin-restaurants.json' with { type: 'json' };

export async function importMichelinRestaurants(prisma) {
  await prisma.$transaction(async tx => {
    await tx.dish.deleteMany();
    await tx.dish.createMany({
      data: restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        description: `Michelin Guide: ${restaurant.cuisine}. ${restaurant.price_label}.`,
        price: restaurant.price_max_vnd ?? restaurant.price_min_vnd ?? 0,
        category: restaurant.cuisine,
        available: true,
        imagePath: restaurant.image_url,
        priceSymbol: restaurant.price_symbol,
        priceLabel: restaurant.price_label,
        priceMinVnd: restaurant.price_min_vnd,
        priceMaxVnd: restaurant.price_max_vnd,
        photoType: restaurant.photo_type,
        michelinUrl: restaurant.michelin_url,
      })),
    });
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('dishes', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM dishes), (SELECT last_value FROM dishes_id_seq)), true)`;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = createDatabaseClient();
  try {
    await importMichelinRestaurants(prisma);
    console.log(`Đã thay dữ liệu món demo bằng ${restaurants.length} nhà hàng Michelin.`);
  } catch (error) {
    console.error('Import Michelin thất bại:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
