import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { resources } from '../../shared/resources.js';
import { imageChoices } from '../data/demo.js';
import { imageSources } from '../../shared/image-sources.js';
import { restaurantPhoto } from './lib/restaurant-photos.js';
import { queryText } from './validators/query.js';
import { homeData, filterRestaurants } from './home.js';
import { normalizeSearch } from './lib/search.js';
import { uploadImage, validateImageFile, deleteUploadedImage } from './lib/storage.js';
import { BusinessError, TechnicalError, idValue, validRecord, checkRelations } from './validation.js';
import { listRecords, sorts } from './catalog.js';

const includeDish = { restaurant: true, chef: true, ingredients: { include: { ingredient: true } } };
const success = (res, data, meta) => res.json({ ok: true, data, ...(data?.items && { error: null }), ...(meta && { meta }) });
const serialize = (record, resource) => resource === 'restaurants' ? { ...record, photo: restaurantPhoto(record) } : record;

export function createApi({ db, preview = false, origin = 'http://localhost:5173', logger = console, storage = { upload: uploadImage, remove: deleteUploadedImage } } = {}) {
  const allowed = new URL(origin).origin;
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'extended');
  // CORS precedes body parsing, routes and errors so technical errors are readable.
  app.use((req, res, next) => {
    res.vary('Origin');
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.headers.origin) {
      if (req.headers.origin !== allowed) return next(new TechnicalError(403, 'Origin không được phép.'));
      res.set('Access-Control-Allow-Origin', allowed);
    }
    if (req.method === 'OPTIONS') {
      const method = req.headers['access-control-request-method'];
      const headers = String(req.headers['access-control-request-headers'] || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
      if ((method && !['GET', 'POST', 'PATCH', 'DELETE', 'HEAD'].includes(method)) || headers.some(x => x !== 'content-type')) return next(new TechnicalError(403, 'Preflight không được phép.'));
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }
    next();
  });
  app.use('/images', express.static(fileURLToPath(new URL('../../web/public/images/', import.meta.url))));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/config', (req, res) => success(res, { preview, imageChoices, imageOrigins: imageSources.split(' ').filter(x => x.startsWith('https:')), sorts: Object.fromEntries(Object.entries(sorts).map(([key, x]) => [key, x.label])) }));
  app.get('/api/home', async (req, res) => {
    const data = await homeData(db, req.query);
    success(res, { ...data, restaurants: data.restaurants.map(x => serialize(x, 'restaurants')) });
  });
  app.get('/api/restaurants/suggestions', async (req, res) => {
    let q;
    try { q = queryText(req.query.q, 'Từ khóa'); } catch (error) { throw new BusinessError('VALIDATION_FAILED', 'Từ khóa không hợp lệ.', { q: error.message }); }
    if (!q) return success(res, []);
    const rows = await db.restaurant.findMany({ include: { dishes: true }, orderBy: { id: 'asc' } });
    res.set('Cache-Control', 'no-store');
    success(res, filterRestaurants(rows, q).slice(0, 6).map(({ id, name, district, address }) => ({ id, name, district, address })));
  });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, fieldSize: 32768 } }).single('imageFile');
  const writable = (req, res, next) => preview ? next(new TechnicalError(503, 'Chế độ chỉ đọc. Không thể lưu dữ liệu.')) : next();
  const parseWrite = (req, res, next) => {
    if (req.is('multipart/form-data')) return upload(req, res, err => {
      if (err) return next(err);
      try { req.body = JSON.parse(req.body.payload); } catch { return next(new TechnicalError(400, 'payload phải chứa JSON hợp lệ.')); }
      next();
    });
    if (!req.is('application/json')) return next(new TechnicalError(415, 'Cần Content-Type application/json hoặc multipart/form-data.'));
    next();
  };
  for (const [resource, config] of Object.entries(resources)) {
    const base = `/api/${resource}`, model = db[config.model];
    const find = async id => {
      const record = await model.findUnique({ where: { id }, ...(resource === 'dishes' ? { include: includeDish } : resource === 'restaurants' ? { include: { dishes: { orderBy: { id: 'asc' } } } } : {}) });
      if (!record) throw new BusinessError('NOT_FOUND', 'Bản ghi không tồn tại hoặc đã bị xóa.');
      return record;
    };
    app.get(base, async (req, res) => {
      const { data, meta } = await listRecords(db, resource, model, req.query);
      success(res, resource === 'dishes' ? data : data.map(x => serialize(x, resource)), { ...meta, preview });
    });
    app.get(`${base}/:id`, async (req, res) => success(res, serialize(await find(idValue(req.params.id)), resource), { preview }));
    const write = partial => async (req, res) => {
      const id = partial ? idValue(req.params.id) : null;
      if (partial) await find(id);
      const data = validRecord(req.body, resource, partial);
      if (req.file && !['dishes', 'restaurants'].includes(resource)) throw new BusinessError('VALIDATION_FAILED', 'Tài nguyên không hỗ trợ ảnh.', { imageFile: 'Không hỗ trợ ảnh.' });
      if (req.file && data.imagePath) throw new BusinessError('VALIDATION_FAILED', 'Chỉ chọn một nguồn ảnh.', { imageFile: 'Chọn file hoặc URL.' });
      try { validateImageFile(req.file); } catch (error) { throw new BusinessError('VALIDATION_FAILED', 'Ảnh không hợp lệ.', { imageFile: error.message }); }
      if (resource === 'dishes') await checkRelations(db, data);
      let uploaded;
      try {
        if (req.file) { uploaded = await storage.upload(req.file); data.imagePath = uploaded; }
        if (data.imagePath) data.photoType = data.imagePath.includes('prod-pics.guide.michelin.com/') ? 'Ảnh hồ sơ quán' : 'Ảnh minh họa';
        const persist = async tx => {
          if (resource === 'dishes') {
            await checkRelations(tx, data);
            const { newRestaurantName, newChefName, newIngredients, ingredientIds, ...record } = data;
            if (newRestaurantName) record.restaurantId = (await tx.restaurant.create({ data: { name: newRestaurantName, cuisine: 'Việt Nam', isDemo: true } })).id;
            if (newChefName) record.chefId = (await tx.chef.create({ data: { name: newChefName, isDemo: true } })).id;
            let ids = ingredientIds;
            if (newIngredients?.length) {
              // New ingredients append to retained links when PATCH omits ingredientIds.
              if (!ids) ids = partial ? (await tx.dish.findUnique({ where: { id }, include: includeDish })).ingredients.map(x => x.ingredientId) : [];
              ids = [...ids];
              for (const ingredient of newIngredients) ids.push((await tx.ingredient.create({ data: { ...ingredient, isDemo: true } })).id);
            }
            if (ids) record.ingredients = { ...(partial && { deleteMany: {} }), create: [...new Set(ids)].map(ingredientId => ({ ingredientId })) };
            if (Object.hasOwn(record, 'name') || Object.hasOwn(record, 'category')) {
              const before = partial ? await tx.dish.findUnique({ where: { id } }) : {};
              record.searchText = normalizeSearch(`${record.name ?? before.name ?? ''} ${record.category ?? before.category ?? ''}`);
            }
            return partial ? tx.dish.update({ where: { id }, data: record, include: includeDish }) : tx.dish.create({ data: record, include: includeDish });
          }
          if (resource === 'restaurants') {
            const before = partial ? await tx.restaurant.findUnique({ where: { id } }) : {};
            const merged = { ...before, ...data };
            data.searchText = normalizeSearch([merged.name, merged.address, merged.district, merged.cuisine, ...(merged.notableDishes || []), merged.cuisine === 'Vegetarian' ? 'món chay' : ''].join(' '));
          }
          return partial ? tx[config.model].update({ where: { id }, data }) : tx[config.model].create({ data });
        };
        const record = resource === 'dishes' ? await db.$transaction(persist) : await persist(db);
        success(res, serialize(record, resource));
      } catch (error) {
        if (uploaded) try { await storage.remove(uploaded); } catch { logger.error('Image cleanup failed'); }
        throw error;
      }
    };
    app.post(base, writable, parseWrite, write(false));
    app.patch(`${base}/:id`, writable, parseWrite, write(true));
    app.delete(`${base}/:id`, writable, async (req, res) => {
      const id = idValue(req.params.id);
      await find(id);
      await model.delete({ where: { id } });
      success(res, null);
    });
  }
  app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy URL API.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof BusinessError || error.code === 'P2025') return res.json({ ok: false, error: { code: error.code === 'P2025' ? 'NOT_FOUND' : error.code, message: error.code === 'P2025' ? 'Bản ghi không tồn tại.' : error.message, ...(error.fields && { fields: error.fields }) } });
    if (error.code === 'P2003') return res.json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'Dữ liệu liên kết đã thay đổi. Tải lại và thử lại.', fields: { _form: 'Bản ghi liên kết không còn tồn tại.' } } });
    if (error.code === 'P2002') return res.json({ ok: false, error: { code: 'ALREADY_EXISTS', message: 'Giá trị duy nhất đã tồn tại.', fields: { michelinUrl: 'Hồ sơ nguồn này đã được sử dụng.' } } });
    if (error instanceof multer.MulterError) return res.json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'File không hợp lệ.', fields: { imageFile: error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh không được vượt quá 5 MB.' : 'Chỉ gửi một ảnh và một payload JSON.' } } });
    const status = error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : [400, 403, 415, 502, 503].includes(error.status) ? error.status : 500;
    if (status === 500) logger.error('API request failed', { method: req.method, path: req.path });
    res.status(status).json({ message: status === 500 ? 'Có lỗi hệ thống. Vui lòng thử lại sau.' : status === 400 ? 'Request không đọc được.' : status === 413 ? 'Request vượt dung lượng cho phép.' : error.message });
  });
  return app;
}
