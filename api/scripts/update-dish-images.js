import { readFile } from 'node:fs/promises';
import { createDatabaseClient } from '../src/db/client.js';

// Không có --apply: chỉ đọc file, không kết nối/ghi database.
// --check: đối chiếu database, không ghi. --apply: cập nhật các URL đã duyệt.
let prisma;
try {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--check', '--apply'].includes(arg)) || args.length > 1) {
    throw new Error('INVALID_ARGS');
  }
  const { entries } = JSON.parse(await readFile(new URL('../data/dish-image-replacements.json', import.meta.url), 'utf8'));
  if (!Array.isArray(entries) || !entries.length) throw new Error('INVALID_DATA');
  const ids = new Set();
  const images = new Set();
  for (const row of entries) {
    if (!Number.isSafeInteger(row.id) || row.id <= 0 || ids.has(row.id)
      || typeof row.name !== 'string' || !row.name.trim()
      || typeof row.oldImagePath !== 'string'
      || !['candidate', 'needs-review'].includes(row.status)) throw new Error('INVALID_DATA');
    const image = new URL(row.imagePath);
    if (image.protocol !== 'https:' || image.username || image.password || images.has(row.imagePath)) {
      throw new Error('INVALID_DATA');
    }
    ids.add(row.id);
    images.add(row.imagePath);
  }
  const ready = entries.filter(row => row.status === 'candidate');
  const pending = entries.filter(row => row.status === 'needs-review');
  if (!args.includes('--apply') && !args.includes('--check')) {
    ready.forEach(row => console.log(`#${row.id} — ${row.name}`));
    console.log(`Có ${ready.length} ảnh sẵn sàng; bỏ qua ${pending.length} ảnh cần xem lại. Không ghi database.`);
    console.log('Đối chiếu Supabase: node api/scripts/update-dish-images.js --check');
    console.log('Cập nhật Supabase: node api/scripts/update-dish-images.js --apply');
  } else {
    prisma = createDatabaseClient();
    const run = async tx => {
      const results = [];
      for (const row of ready) {
        const current = await tx.dish.findUnique({ where: { id: row.id }, select: { name: true, imagePath: true } });
        if (!current || current.name !== row.name) {
          results.push({ id: row.id, name: row.name, status: 'Bỏ qua: không còn bản ghi tương ứng' });
        } else if (current.imagePath === row.imagePath) {
          results.push({ id: row.id, name: row.name, status: 'Đã có URL mới' });
        } else if (current.imagePath !== row.oldImagePath) {
          results.push({ id: row.id, name: row.name, status: 'Bỏ qua: ảnh đã được người khác sửa' });
        } else if (args.includes('--apply')) {
          // Điều kiện URL cũ bảo vệ cả trường hợp bị sửa giữa lúc đọc và ghi.
          const changed = await tx.dish.updateMany({
            where: { id: row.id, name: row.name, imagePath: row.oldImagePath },
            data: { imagePath: row.imagePath, photoType: 'Ảnh minh họa' },
          });
          results.push({ id: row.id, name: row.name, status: changed.count ? 'Đã cập nhật' : 'Bỏ qua: bản ghi vừa thay đổi' });
        } else {
          results.push({ id: row.id, name: row.name, status: 'Sẵn sàng cập nhật' });
        }
      }
      return results;
    };
    const results = args.includes('--apply')
      ? await prisma.$transaction(run, { maxWait: 10000, timeout: 60000 })
      : await run(prisma);
    results.forEach(row => console.log(`#${row.id} — ${row.name}: ${row.status}`));
    console.log(`Bỏ qua ${pending.length} ảnh cần xem lại: ${pending.map(row => `#${row.id}`).join(', ')}.`);
    console.log(args.includes('--apply')
      ? 'Hoàn tất. Chỉ đổi imagePath và photoType; không tạo hoặc xóa món.'
      : 'Đã đối chiếu database; không ghi dữ liệu.');
  }
} catch (error) {
  console.error(['INVALID_DATA', 'INVALID_ARGS'].includes(error.message) || error instanceof SyntaxError || error instanceof TypeError
    ? 'Dữ liệu/tham số không hợp lệ. Kiểm tra file JSON và chỉ dùng một trong --dry-run, --check, --apply.'
    : 'Chưa hoàn tất. Kiểm tra DATABASE_URL trong .env, kết nối và Prisma Client.');
  if (typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)) console.error(`Mã lỗi: ${error.code}`);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
