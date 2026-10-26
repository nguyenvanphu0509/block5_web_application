import express from 'express';
import methodOverride from 'method-override';
import { fileURLToPath } from 'node:url';
import { createRoutes } from './routes/index.js';
import { securityHeaders, checkOrigin } from './middleware/security.js';
import { money, restaurantPrice, dateLabel } from './lib/presentation.js';
import { restaurantPhoto } from '../../api/src/lib/restaurant-photos.js';

export function createApp({ db, preview = false, origin = 'http://localhost:3000', logger = console } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', fileURLToPath(new URL('./views/', import.meta.url)));
  app.set('query parser', 'extended');
  app.locals = { ...app.locals, money, restaurantPrice, dateLabel, restaurantPhoto, preview };
  // Error pages also need locals when parsing/security rejects before routing.
  app.use((req, res, next) => { res.locals.currentPath = req.path; next(); });
  app.use(securityHeaders);
  app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));
  app.use(express.static(fileURLToPath(new URL('../../web/public/', import.meta.url))));
  app.use(checkOrigin(origin));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use(methodOverride('_method', { methods: ['POST'] }));
  app.use(createRoutes(db, preview));
  app.use((req, res) => res.status(404).render('errors/index', { title: 'Không tìm thấy', status: 404, message: 'Trang bạn tìm không tồn tại.' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const knownStatus = [400, 403, 404, 502, 503].includes(err.status);
    const status = err.code === 'P2025' ? 404 : err.code === 'LIMIT_FILE_SIZE' || err.type === 'entity.too.large' ? 400 : knownStatus ? err.status : 500;
    if (status === 500) logger.error('Request failed', { method: req.method, path: req.path, code: typeof err.code === 'string' && /^[A-Z0-9_]{1,30}$/.test(err.code) ? err.code : 'INTERNAL_ERROR' });
    const message = status === 500 ? 'Có lỗi hệ thống. Vui lòng thử lại sau.' : status === 404 ? 'Bản ghi không tồn tại hoặc đã bị xóa.' : err.code === 'LIMIT_FILE_SIZE' || err.type === 'entity.too.large' ? 'Biểu mẫu vượt dung lượng cho phép.' : err.message;
    res.status(status).render('errors/index', { title: `Lỗi ${status}`, status, message });
  });
  return app;
}
