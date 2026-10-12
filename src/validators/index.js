import { imageChoices } from '../../data/demo.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function parseId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || Number(raw) > 2147483647) {
    throw new HttpError(404, 'Không tìm thấy bản ghi này.');
  }
  return Number(raw);
}
export function queryText(raw, name, limit = 120) {
  if (raw === undefined) return '';
  if (typeof raw !== 'string' || raw.trim().length > limit) throw new HttpError(400, `${name} không hợp lệ.`);
  return raw.trim();
}
export function queryPage(raw, name) {
  if (raw === undefined) return 1;
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    throw new HttpError(400, `${name} không hợp lệ.`);
  }
  return Number(raw);
}
export function validateRecord(body, resource) {
  const data = {}, values = {}, errors = {};
  function text(field, label, max, required = false) {
    const raw = body[field];
    values[field] = typeof raw === 'string' ? raw : '';
    if (raw !== undefined && typeof raw !== 'string') { errors[field] = `${label} phải là một giá trị văn bản.`; return; }
    const value = (raw ?? '').trim();
    if (required && !value) errors[field] = `Vui lòng nhập ${label.toLowerCase()}.`;
    else if (value.length > max) errors[field] = `${label} tối đa ${max} ký tự.`;
    data[field] = value || null;
  }
  text('name', 'Tên', 120, true);
  if (resource === 'dishes') {
    text('description', 'Mô tả', 2000);
    text('category', 'Loại món', 80);
    values.price = typeof body.price === 'string' ? body.price : '';
    const price = values.price.trim();
    if (!/^\d+$/.test(price) || Number(price) > 2147483647) errors.price = 'Giá phải là số nguyên từ 0 đến 2.147.483.647 VND.';
    else data.price = Number(price);
    values.available = body.available === 'true';
    if (body.available !== undefined && body.available !== 'true') errors.available = 'Trạng thái phục vụ không hợp lệ.';
    data.available = values.available;
    values.imagePath = typeof body.imagePath === 'string' ? body.imagePath : '';
    if (body.imagePath !== undefined && typeof body.imagePath !== 'string') errors.imagePath = 'Ảnh không hợp lệ.';
    else if (values.imagePath && !imageChoices.some(image => image.path === values.imagePath) && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[a-z0-9._/-]+$/i.test(values.imagePath)) errors.imagePath = 'Vui lòng chọn ảnh trong danh sách hoặc tải ảnh lên.';
    data.imagePath = values.imagePath || null;
  } else if (resource === 'chefs') text('specialty', 'Chuyên môn', 120);
  else text('unit', 'Đơn vị', 30, true);
  return { data, values, errors, valid: Object.keys(errors).length === 0 };
}
