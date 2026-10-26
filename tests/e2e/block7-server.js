import { createApi } from '../../api/src/app.js';
import { isolatedDatabase } from '../block7-db.js';
const { db, close } = await isolatedDatabase();
await db.dish.createMany({ data: Array.from({ length: 25 }, (_, i) => ({ name: `Phở demo ${i + 1}`, description: 'Dữ liệu kiểm thử riêng. Hương vị thảo mộc.', price: i * 1000, category: 'Món nước', available: i % 5 !== 0, imagePath: '/images/noodles.svg', priceIsDemo: true })) });
const server = createApi({ db, origin: 'http://localhost:5174' }).listen(3100, 'localhost');
let closing = false;
async function stop() { if (closing) return; closing = true; server.close(); await close(); process.exit(0); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
