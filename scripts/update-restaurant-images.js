import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createDatabaseClient } from '../src/db/client.js';
import { isAllowedDishImage } from '../src/lib/image-sources.js';

// --check chỉ đối chiếu. --apply cập nhật ảnh nhà hàng, không chạm ảnh món ăn.
let db;
try {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => !['--check', '--apply'].includes(arg))) throw new Error('INVALID_ARGS');
  const photos = JSON.parse(await readFile(new URL('../data/restaurant-space-images.json', import.meta.url), 'utf8'));
  if (photos.length !== 39 || new Set(photos.map(p => p.id)).size !== 39 || new Set(photos.map(p => p.imagePath)).size !== 39
    || photos.some(p => !isAllowedDishImage(p.imagePath) || new URL(p.sourceUrl).protocol !== 'https:')) throw new Error('INVALID_DATA');
  db = createDatabaseClient();
  const before = await db.restaurant.findMany({ where: { id: { in: photos.map(p => p.id) } }, orderBy: { id: 'asc' } });
  if (before.length !== photos.length || photos.some(p => !before.some(r => r.id === p.id && r.name === p.name && r.isDemo === p.isDemo))) throw new Error('CATALOG_CHANGED');
  if (args.includes('--apply')) {
    // Giữ bản sao để có thể kiểm tra/khôi phục riêng từng URL cũ nếu cần.
    const dir = new URL('../.local-backups/', import.meta.url);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL(`restaurant-images-${Date.now()}.json`, dir), JSON.stringify(before.map(({id,name,imagePath,photoType}) => ({id,name,imagePath,photoType})), null, 2));
    const changed = await db.$transaction(async tx => {
      let count = 0;
      for (const photo of photos) {
        const previous = before.find(r => r.id === photo.id);
        if (previous.imagePath === photo.imagePath && previous.photoType === photo.photoType) continue;
        const result = await tx.restaurant.updateMany({
          where: { id: photo.id, name: photo.name, isDemo: photo.isDemo, imagePath: previous.imagePath },
          data: { imagePath: photo.imagePath, photoType: photo.photoType },
        });
        if (result.count !== 1) throw new Error('CATALOG_CHANGED');
        count++;
      }
      return count;
    }, { maxWait: 10000, timeout: 60000 });
    console.log(`Đã cập nhật ${changed}/39 ảnh nhà hàng. 36 quán thật, 3 không gian minh họa cho quán demo.`);
    console.log('Không cập nhật bảng dishes, không tạo hoặc xóa bản ghi.');
  } else {
    console.log(`Đối chiếu đúng 39 quán; ${before.filter(r => r.imagePath === photos.find(p => p.id === r.id).imagePath).length} quán đã có ảnh mới. Chưa ghi dữ liệu.`);
    console.log('Áp dụng: node scripts/update-restaurant-images.js --apply');
  }
} catch (error) {
  console.error('Cập nhật ảnh quán chưa hoàn tất.', { code: ['INVALID_ARGS','INVALID_DATA','CATALOG_CHANGED'].includes(error.message) ? error.message : error.code || 'DATABASE_ERROR' });
  process.exitCode = 1;
} finally { await db?.$disconnect(); }
