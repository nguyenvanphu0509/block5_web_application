import { imageChoices } from '../../data/demo.js';
import { parseId, validateRecord, HttpError } from '../validators/index.js';
import { uploadImage } from '../lib/storage.js';

export const resources = {
  dishes: { model: 'dish', label: 'Món ăn', singular: 'món ăn', icon: '◒', columns: [['name', 'Tên món'], ['price', 'Giá demo'], ['category', 'Loại món'], ['available', 'Phục vụ']] },
  chefs: { model: 'chef', label: 'Đầu bếp', singular: 'đầu bếp', icon: '♧', columns: [['name', 'Tên'], ['specialty', 'Chuyên môn']] },
  ingredients: { model: 'ingredient', label: 'Nguyên liệu', singular: 'nguyên liệu', icon: '✳', columns: [['name', 'Tên'], ['unit', 'Đơn vị']] },
};
export function createAdminController(db, resource, preview) {
  const config = resources[resource];
  const model = db[config.model], base = `/admin/${resource}`;
  const locals = { resource, config, resources, base, imageChoices };
  async function getRecord(req) {
    const record = await model.findUnique({ where: { id: parseId(req.params.id) } });
    if (!record) throw new HttpError(404, 'Bản ghi này không tồn tại hoặc đã bị xóa.');
    return record;
  }
  function assertWritable() {
    if (preview) throw new HttpError(503, 'Preview chỉ đọc. Cấu hình DATABASE_URL và chạy npm start để lưu dữ liệu.');
  }
  function form(res, values, errors = {}, id = null, status = 200) {
    res.status(status).render('admin/form', { ...locals, title: `${id ? 'Sửa' : 'Thêm'} ${config.singular}`, values, errors, id });
  }
  return {
    async index(req, res) {
      const records = await model.findMany({ orderBy: { id: 'asc' } });
      const messages = { created: 'Đã thêm bản ghi.', updated: 'Đã lưu thay đổi.', deleted: 'Đã xóa bản ghi.' };
      const message = typeof req.query.notice === 'string' && Object.hasOwn(messages, req.query.notice) ? messages[req.query.notice] : '';
      res.render('admin/index', { ...locals, title: `Quản lý ${config.singular}`, records, message });
    },
    new(req, res) { form(res, { available: true }); },
    async show(req, res) {
      const record = await getRecord(req);
      const messages = { created: 'Đã thêm bản ghi.', updated: 'Đã lưu thay đổi.' };
      const message = typeof req.query.notice === 'string' && Object.hasOwn(messages, req.query.notice) ? messages[req.query.notice] : '';
      res.render('admin/show', { ...locals, title: record.name, record, message });
    },
    async edit(req, res) { const record = await getRecord(req); form(res, record, {}, record.id); },
    async create(req, res) {
      assertWritable();
      const imagePath = req.file ? await uploadImage(req.file) : req.body.imagePath;
      const result = validateRecord({ ...req.body, imagePath }, resource);
      if (!result.valid) return form(res, result.values, result.errors, null, 400);
      const record = await model.create({ data: result.data });
      res.redirect(303, `${base}/${record.id}?notice=created`);
    },
    async update(req, res) {
      assertWritable();
      const record = await getRecord(req);
      const imagePath = req.file ? await uploadImage(req.file) : req.body.imagePath;
      const result = validateRecord({ ...req.body, imagePath }, resource);
      if (!result.valid) return form(res, result.values, result.errors, record.id, 400);
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
