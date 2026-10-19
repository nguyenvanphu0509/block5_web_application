import { imageChoices } from '../../data/demo.js';
import { parseId, validateRecord, HttpError } from '../validators/index.js';
import { uploadImage, validateImageFile } from '../lib/storage.js';
import { imageSources, isAllowedDishImage } from '../lib/image-sources.js';

export const resources = {
  restaurants: { model: 'restaurant', label: 'Quán ăn', singular: 'quán ăn', icon: '⌖', columns: [['name', 'Tên quán'], ['cuisine', 'Ẩm thực'], ['address', 'Địa chỉ'], ['district', 'Khu vực']] },
  dishes: { model: 'dish', label: 'Món ăn', singular: 'món ăn', icon: '◒', columns: [['name', 'Tên món'], ['price', 'Giá món'], ['category', 'Loại món'], ['available', 'Phục vụ']] },
  chefs: { model: 'chef', label: 'Đầu bếp', singular: 'đầu bếp', icon: '♧', columns: [['name', 'Tên'], ['specialty', 'Chuyên môn']] },
  ingredients: { model: 'ingredient', label: 'Nguyên liệu', singular: 'nguyên liệu', icon: '✳', columns: [['name', 'Tên'], ['unit', 'Đơn vị']] },
};
export function createAdminController(db, resource, preview) {
  const config = resources[resource];
  const model = db[config.model], base = `/admin/${resource}`;
  const locals = { resource, config, resources, base, imageChoices, allowedImageOrigins: imageSources.split(' ').filter(source => source.startsWith('https:') && !source.includes('*')) };
  async function getRecord(req) {
    const record = await model.findUnique({ where: { id: parseId(req.params.id) }, ...(resource === 'dishes' ? { include: { restaurant: true, chef: true, ingredients: { include: { ingredient: true } } } } : {}) });
    if (!record) throw new HttpError(404, 'Bản ghi này không tồn tại hoặc đã bị xóa.');
    return record;
  }
  function assertWritable() {
    if (preview) throw new HttpError(503, 'Preview chỉ đọc. Cấu hình DATABASE_URL và chạy npm start để lưu dữ liệu.');
  }
  function prepareImage(req, current = null) {
    if (!['dishes', 'restaurants'].includes(resource)) return { body: req.body, errors: {} };
    const mode = req.body.imageMode;
    const errors = {};
    if (mode !== undefined && !['url', 'file'].includes(mode)) errors.imageMode = 'Vui lòng chọn cách thêm ảnh hợp lệ.';
    const useFile = mode === 'file' || (mode === undefined && !!req.file);
    if (mode === 'url' && req.file) errors.imageFile = 'Chọn chế độ tải file để dùng ảnh từ máy.';
    if (mode === undefined && req.file && req.body.imagePath) errors.imageFile = 'Chỉ chọn URL hoặc file ảnh, không dùng đồng thời.';
    if (useFile) {
      try { validateImageFile(req.file); } catch (error) { errors.imageFile = error.message; }
    }
    const imagePath = useFile ? current : (typeof req.body.imagePath === 'string' ? req.body.imagePath.trim() || current : req.body.imagePath ?? current);
    return { body: { ...req.body, imagePath: imagePath ?? '' }, errors, file: useFile ? req.file : null };
  }
  async function form(res, values, errors = {}, id = null, status = 200) {
    const [restaurants, chefs, ingredients] = resource === 'dishes' ? await Promise.all([
      db.restaurant.findMany({ orderBy: { name: 'asc' } }), db.chef.findMany({ orderBy: { name: 'asc' } }), db.ingredient.findMany({ orderBy: { name: 'asc' } }),
    ]) : [[], [], []];
    const fallback = resource === 'restaurants' ? '/images/restaurant.svg' : '/images/greens.svg';
    const previewImage = imageChoices.some(image => image.path === values.imagePath) || isAllowedDishImage(values.imagePath) ? values.imagePath : fallback;
    res.status(status).render('admin/form', { ...locals, previewImage, restaurants, chefs, ingredients, title: `${id ? 'Sửa' : 'Thêm'} ${config.singular}`, values, errors, id });
  }
  async function relationData(result, editing = false) {
    if (resource !== 'dishes') return;
    const { ingredientIds, ...data } = result.data;
    const ids = ingredientIds || [];
    if (data.restaurantId && !await db.restaurant.findUnique({ where: { id: data.restaurantId } })) result.errors.restaurantId = 'Quán ăn không tồn tại.';
    if (data.chefId && !await db.chef.findUnique({ where: { id: data.chefId } })) result.errors.chefId = 'Đầu bếp không tồn tại.';
    if (ids.length && await db.ingredient.count({ where: { id: { in: ids } } }) !== ids.length) result.errors.ingredientIds = 'Có nguyên liệu không tồn tại.';
    data.ingredients = { ...(editing ? { deleteMany: {} } : {}), create: ids.map(ingredientId => ({ ingredientId })) };
    result.data = data;
    result.valid = !Object.keys(result.errors).length;
  }
  function comparableName(name) {
    return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
  }
  async function validateDuplicates(result, currentId = null) {
    if (!['dishes', 'chefs', 'ingredients'].includes(resource)) return;
    if (!result.valid) return;
    const rows = await model.findMany({
      select: resource === 'dishes' ? { id: true, name: true, restaurantId: true } : { id: true, name: true },
    });
    const name = comparableName(result.data.name);
    const duplicate = rows.some(row => row.id !== currentId && comparableName(row.name) === name
      && (resource !== 'dishes' || row.restaurantId === result.data.restaurantId));
    if (duplicate) {
      result.errors.name = resource === 'dishes'
        ? 'Món ăn này đã tồn tại tại quán đã chọn.'
        : `Tên ${config.singular} này đã tồn tại.`;
    }
    if (resource === 'dishes') {
      const newChefName = result.values.newChefName?.trim();
      if (newChefName) {
        const chefs = await db.chef.findMany({ select: { name: true } });
        if (chefs.some(chef => comparableName(chef.name) === comparableName(newChefName))) {
          result.errors.newChefName = 'Đầu bếp này đã tồn tại. Hãy chọn trong danh sách.';
        }
      }
      const newIngredientNames = result.values.newIngredientName.map(value => value.trim()).filter(Boolean);
      if (newIngredientNames.length) {
        const ingredients = await db.ingredient.findMany({ select: { name: true } });
        const existingNames = new Set(ingredients.map(ingredient => comparableName(ingredient.name)));
        const submittedNames = new Set();
        if (newIngredientNames.some(ingredientName => {
          const key = comparableName(ingredientName);
          const isDuplicate = existingNames.has(key) || submittedNames.has(key);
          submittedNames.add(key);
          return isDuplicate;
        })) {
          result.errors.newIngredientName = 'Nguyên liệu đã tồn tại hoặc bị lặp trong danh sách.';
        }
      }
    }
    result.valid = !Object.keys(result.errors).length;
  }
  async function createNewRelations(result) {
    if (resource !== 'dishes') return;
    const values = result.values;
    const newRestaurantName = values.newRestaurantName?.trim();
    const newChefName = values.newChefName?.trim();
    if (newRestaurantName && values.restaurantId) result.errors.newRestaurantName = 'Chọn quán có sẵn hoặc thêm quán mới, không dùng cả hai.';
    if (newChefName && values.chefId) result.errors.newChefName = 'Chọn đầu bếp có sẵn hoặc thêm đầu bếp mới, không dùng cả hai.';
    if (result.data.restaurantId && !await db.restaurant.findUnique({ where: { id: result.data.restaurantId } })) result.errors.restaurantId = 'Quán ăn không tồn tại.';
    if (result.data.chefId && !await db.chef.findUnique({ where: { id: result.data.chefId } })) result.errors.chefId = 'Đầu bếp không tồn tại.';
    const existingIds = result.data.ingredientIds;
    if (existingIds.length && await db.ingredient.count({ where: { id: { in: existingIds } } }) !== existingIds.length) result.errors.ingredientIds = 'Có nguyên liệu không tồn tại.';
    if (Object.keys(result.errors).length) { result.valid = false; return; }
    if (newRestaurantName) {
      const restaurant = await db.restaurant.create({ data: { name: newRestaurantName, cuisine: 'Việt Nam', isDemo: true } });
      result.data.restaurantId = restaurant.id;
    }
    if (newChefName) {
      const chef = await db.chef.create({ data: { name: newChefName, specialty: null, isDemo: true } });
      result.data.chefId = chef.id;
    }
    for (const [index, name] of values.newIngredientName.entries()) {
      if (!name.trim()) continue;
      const ingredient = await db.ingredient.create({ data: { name: name.trim(), unit: values.newIngredientUnit[index]?.trim() || 'phần', isDemo: true } });
      result.data.ingredientIds.push(ingredient.id);
    }
  }
  return {
    async index(req, res) {
      const records = await model.findMany({ orderBy: { id: 'asc' } });
      const messages = { created: 'Đã thêm bản ghi.', updated: 'Đã lưu thay đổi.', deleted: 'Đã xóa bản ghi.' };
      const message = typeof req.query.notice === 'string' && Object.hasOwn(messages, req.query.notice) ? messages[req.query.notice] : '';
      res.render('admin/index', { ...locals, title: `Quản lý ${config.singular}`, records, message });
    },
    new(req, res) { return form(res, { available: true, priceIsDemo: true, recipeIsDemo: true }); },
    async show(req, res) {
      const record = await getRecord(req);
      const messages = { created: 'Đã thêm bản ghi.', updated: 'Đã lưu thay đổi.' };
      const message = typeof req.query.notice === 'string' && Object.hasOwn(messages, req.query.notice) ? messages[req.query.notice] : '';
      res.render('admin/show', { ...locals, title: record.name, record, message });
    },
    async edit(req, res) { const record = await getRecord(req); return form(res, { ...record, ingredientIds: record.ingredients?.map(link => String(link.ingredientId)) || [] }, {}, record.id); },
    async create(req, res) {
      assertWritable();
      const image = prepareImage(req);
      const result = validateRecord(image.body, resource);
      result.values.imageMode = req.body.imageMode === 'file' ? 'file' : 'url';
      Object.assign(result.errors, image.errors);
      result.valid = !Object.keys(result.errors).length;
      if (result.valid) await validateDuplicates(result);
      if (result.valid) await createNewRelations(result);
      if (result.valid) await relationData(result);
      if (!result.valid) return form(res, result.values, result.errors, null, 400);
      if (image.file) { result.data.imagePath = await uploadImage(image.file); result.data.photoType = 'Ảnh minh họa'; }
      const record = await model.create({ data: result.data });
      res.redirect(303, `${base}/${record.id}?notice=created`);
    },
    async update(req, res) {
      assertWritable();
      const record = await getRecord(req);
      const image = prepareImage(req, record.imagePath);
      const result = validateRecord(image.body, resource);
      result.values.imageMode = req.body.imageMode === 'file' ? 'file' : 'url';
      Object.assign(result.errors, image.errors);
      result.valid = !Object.keys(result.errors).length;
      if (result.valid) await validateDuplicates(result, record.id);
      if (result.valid) await createNewRelations(result);
      if (result.valid) await relationData(result, true);
      if (!result.valid) return form(res, result.values, result.errors, record.id, 400);
      if (image.file) { result.data.imagePath = await uploadImage(image.file); result.data.photoType = 'Ảnh minh họa'; }
      await model.update({ where: { id: record.id }, data: result.data });
      res.redirect(303, `${base}/${record.id}?notice=updated`);
    },
    async confirmDelete(req, res) {
      res.render('admin/delete', { ...locals, title: 'Xác nhận xóa', record: await getRecord(req) });
    },
    async destroy(req, res) {
      assertWritable();
      await model.delete({ where: { id: parseId(req.params.id) } });
      res.redirect(303, `${base}?notice=deleted`);
    },
  };
}
