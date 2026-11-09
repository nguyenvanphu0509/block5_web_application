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
import { authConfig, bearerToken, createJwt, hashPassword, randomOtp, tokenDigest, verifyJwt, verifyPassword } from './auth.js';
import { createMailer } from './mailer.js';
import { assertChefAssignment, assertDishAttribute, canDeleteResource, canWriteResource } from './auth/policy.js';
import { registerPasswordResetRoutes } from './auth/password-reset.js';

const includeDish = { restaurant: true, chef: true, ingredients: { include: { ingredient: true } } };
const success = (res, data, meta) => res.json({ ok: true, data, ...(data?.items && { error: null }), ...(meta && { meta }) });
const serialize = (record, resource) => resource === 'restaurants' ? { ...record, photo: restaurantPhoto(record) } : record;

export function createApi({ db, preview = false, origin = 'http://localhost:5173', logger = console, storage = { upload: uploadImage, remove: deleteUploadedImage }, auth = authConfig(), mailer = createMailer() } = {}) {
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
      if ((method && !['GET', 'POST', 'PATCH', 'DELETE', 'HEAD'].includes(method)) || headers.some(x => x !== 'content-type' && (!db?.user || x !== 'authorization'))) return next(new TechnicalError(403, 'Preflight không được phép.'));
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).end();
    }
    next();
  });
  app.use('/images', express.static(fileURLToPath(new URL('../../web/public/images/', import.meta.url))));
  app.use(express.json({ limit: '32kb' }));
  const authEnabled = Boolean(db?.user);
  const verifyCaptcha = async token => {
    if (!auth.recaptchaSecret || typeof token !== 'string' || !token) return false;
    const body = new URLSearchParams({ secret: auth.recaptchaSecret, response: token });
    const result = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!result.ok) return false;
    const data = await result.json();
    return data.success === true && (!data.hostname || auth.recaptchaAllowedHostnames.includes(data.hostname));
  };
  const authenticate = async (req, res, next) => {
    if (!authEnabled) return next();
    const payload = verifyJwt(bearerToken(req.headers.authorization), auth);
    if (!payload?.sub) return res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Cần đăng nhập.' } });
    const user = await db.user.findUnique({ where: { id: Number(payload.sub) }, include: { chef: true } });
    if (!user || user.status !== 'active' || user.tokenVersion !== payload.tokenVersion) return res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Tài khoản không hợp lệ.' } });
    req.user = user;
    next();
  };
  const requireRole = (...roles) => (req, res, next) => {
    if (!authEnabled || roles.includes(req.user?.role)) return next();
    return res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } });
  };
  app.post('/api/auth/register', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : email.split('@')[0];
    const password = req.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !username || typeof password !== 'string' || password.length < 15 || password.length > 128) {
      throw new BusinessError('VALIDATION_FAILED', 'Email, tên tài khoản hoặc mật khẩu không hợp lệ.');
    }
    if (!(await verifyCaptcha(req.body?.captchaToken))) {
      throw new BusinessError('CAPTCHA_REQUIRED', 'Vui lòng xác minh CAPTCHA trước khi đăng ký.');
    }
    if (await db.user.findFirst({ where: { OR: [{ email }, { username }] } })) throw new BusinessError('ALREADY_EXISTS', 'Tài khoản đã tồn tại.');
    const user = await db.user.create({ data: { email, username, passwordHash: await hashPassword(password), role: 'viewer', status: 'pending', tokenVersion: 0 } });
    const otp = randomOtp();
    await db.accountToken.create({ data: { userId: user.id, purpose: 'activation-otp', tokenHash: tokenDigest(otp), expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
    if (mailer) await mailer.sendActivationOtp({ to: user.email, otp });
    else if (!auth.exposeDevTokens) throw new TechnicalError(503, 'Dịch vụ email chưa được cấu hình.');
    const data = { id: user.id, email: user.email, username: user.username, role: user.role };
    if (auth.exposeDevTokens) data.otp = otp;
    res.status(201).json({ ok: true, data });
  });
  app.post('/api/auth/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      if (user?.status === 'active') {
        const failedLoginAttempts = user.failedLoginAttempts + 1;
        const captchaRequired = failedLoginAttempts >= auth.recaptchaLoginThreshold;
        await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts, captchaRequired } });
        if (captchaRequired) return res.json({ ok: false, error: { code: 'CAPTCHA_REQUIRED', message: 'Vui lòng xác minh CAPTCHA.' } });
      }
      return res.json({ ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' } });
    }
    if (user.status === 'pending') return res.json({ ok: false, error: { code: 'ACCOUNT_NOT_ACTIVATED', message: 'Tài khoản chưa được kích hoạt.' } });
    if (user.status !== 'active') return res.json({ ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' } });
    if (user.captchaRequired && !(await verifyCaptcha(req.body?.captchaToken))) return res.json({ ok: false, error: { code: 'CAPTCHA_REQUIRED', message: 'Vui lòng xác minh CAPTCHA.' } });
    const accessToken = createJwt({ sub: String(user.id), tokenVersion: user.tokenVersion }, auth);
    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, captchaRequired: false } });
    return res.json({ ok: true, data: { accessToken, user: { id: user.id, email: user.email, username: user.username, role: user.role } } });
  });
  app.post('/api/auth/activate', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.status !== 'pending') throw new BusinessError('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    const record = await db.accountToken.findFirst({ where: { userId: user.id, purpose: 'activation-otp', tokenHash: tokenDigest(otp), usedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) throw new BusinessError('INVALID_OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { status: 'active' } });
      await tx.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    });
    return res.json({ ok: true, data: { message: 'Tài khoản đã được kích hoạt.' } });
  });
  app.post('/api/auth/resend-activation', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const response = { ok: true, data: { message: 'Nếu tài khoản đang chờ kích hoạt, mã OTP mới đã được gửi.' } };
    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.status !== 'pending') return res.json(response);
    const otp = randomOtp();
    await db.accountToken.deleteMany({ where: { userId: user.id, purpose: 'activation-otp', usedAt: null } });
    await db.accountToken.create({ data: { userId: user.id, purpose: 'activation-otp', tokenHash: tokenDigest(otp), expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
    if (mailer) await mailer.sendActivationOtp({ to: user.email, otp });
    else if (!auth.exposeDevTokens) throw new TechnicalError(503, 'Dịch vụ email chưa được cấu hình.');
    if (auth.exposeDevTokens) response.data.otp = otp;
    return res.json(response);
  });
  registerPasswordResetRoutes(app, { db, origin: allowed, mailer, logger });
  app.get('/api/auth/me', authenticate, (req, res) => success(res, { id: req.user.id, email: req.user.email, username: req.user.username, role: req.user.role }));
  app.get('/api/config', (req, res) => success(res, { preview, recaptchaSiteKey: auth.recaptchaSiteKey || null, imageChoices, imageOrigins: imageSources.split(' ').filter(x => x.startsWith('https:')), sorts: Object.fromEntries(Object.entries(sorts).map(([key, x]) => [key, x.label])) }));
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
      const current = partial ? await find(id) : null;
      if (authEnabled && resource === 'dishes' && current) assertDishAttribute(req.user, current);
      const data = validRecord(req.body, resource, partial);
      if (authEnabled && resource === 'dishes') {
        assertChefAssignment(req.user, data);
        if (req.user.role === 'chef' && !partial) data.chefId = req.user.chefId;
      }
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
    app.post(base, authenticate, (req, res, next) => !authEnabled || canWriteResource(req.user, resource) ? next() : res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền ghi tài nguyên này.' } }), writable, parseWrite, write(false));
    app.patch(`${base}/:id`, authenticate, (req, res, next) => !authEnabled || canWriteResource(req.user, resource) ? next() : res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền ghi tài nguyên này.' } }), writable, parseWrite, write(true));
    app.delete(`${base}/:id`, authenticate, (req, res, next) => !authEnabled || canDeleteResource(req.user, resource) ? next() : res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền xóa tài nguyên này.' } }), writable, async (req, res) => {
      const id = idValue(req.params.id);
      const current = await find(id);
      if (authEnabled && resource === 'dishes') assertDishAttribute(req.user, current);
      await model.delete({ where: { id } });
      success(res, null);
    });
  }
  app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy URL API.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof BusinessError || error.code === 'P2025') {
      const code = error.code === 'P2025' ? 'NOT_FOUND' : error.code;
      const status = code === 'FORBIDDEN' ? 403 : 200;
      return res.status(status).json({ ok: false, error: { code, message: error.code === 'P2025' ? 'Bản ghi không tồn tại.' : error.message, ...(error.fields && { fields: error.fields }) } });
    }
    if (error.code === 'P2003') return res.json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'Dữ liệu liên kết đã thay đổi. Tải lại và thử lại.', fields: { _form: 'Bản ghi liên kết không còn tồn tại.' } } });
    if (error.code === 'P2002') return res.json({ ok: false, error: { code: 'ALREADY_EXISTS', message: 'Giá trị duy nhất đã tồn tại.', fields: { michelinUrl: 'Hồ sơ nguồn này đã được sử dụng.' } } });
    if (error instanceof multer.MulterError) return res.json({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'File không hợp lệ.', fields: { imageFile: error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh không được vượt quá 5 MB.' : 'Chỉ gửi một ảnh và một payload JSON.' } } });
    const status = error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : [400, 403, 415, 502, 503].includes(error.status) ? error.status : 500;
    if (status === 500) logger.error('API request failed', { method: req.method, path: req.path });
    res.status(status).json({ message: status === 500 ? 'Có lỗi hệ thống. Vui lòng thử lại sau.' : status === 400 ? 'Request không đọc được.' : status === 413 ? 'Request vượt dung lượng cho phép.' : error.message });
  });
  return app;
}
