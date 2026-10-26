import { Router } from 'express';
import { createHomeController, createRestaurantController } from '../controllers/home.js';
import { createDishController } from '../controllers/dishes.js';
import { createAdminController, resources } from '../controllers/admin.js';
import multer from 'multer';

export function createRoutes(db, preview) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  router.get('/', createHomeController(db));
  const restaurants = createRestaurantController(db);
  router.get('/api/restaurants/suggestions', restaurants.suggestions);
  router.get('/restaurants/:id', restaurants.show);
  const dishes = createDishController(db);
  router.get('/dishes', dishes.index);
  router.get('/dishes/:id', dishes.show);
  router.get('/admin', (req, res) => res.redirect('/admin/dishes'));
  for (const resource of Object.keys(resources)) {
    const admin = Router(), controller = createAdminController(db, resource, preview);
    admin.get('/', controller.index);
    admin.get('/new', controller.new);
    admin.post('/', ['dishes', 'restaurants'].includes(resource) ? upload.single('imageFile') : (req, res, next) => next(), controller.create);
    admin.get('/:id/edit', controller.edit);
    admin.get('/:id/delete', controller.confirmDelete);
    admin.get('/:id', controller.show);
    admin.patch('/:id', ['dishes', 'restaurants'].includes(resource) ? upload.single('imageFile') : (req, res, next) => next(), controller.update);
    admin.delete('/:id', controller.destroy);
    router.use(`/admin/${resource}`, admin);
  }
  return router;
}
