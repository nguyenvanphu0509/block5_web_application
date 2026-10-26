import { imageChoices } from '../../../api/data/demo.js';
import { isAllowedDishImage } from '../../../shared/image-sources.js';

import { HttpError, parseId, queryText, queryPage } from '../../../api/src/validators/query.js';
export { HttpError, parseId, queryText, queryPage };

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
  function checkbox(field, label) {
    if (body[field] !== undefined && body[field] !== 'true') errors[field] = `${label} không hợp lệ.`;
    values[field] = body[field] === 'true'; data[field] = values[field];
  }
  if (resource === 'dishes') {
    for (const field of ['newRestaurantName', 'newChefName']) {
      values[field] = typeof body[field] === 'string' ? body[field] : '';
      if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].trim().length > 120)) errors[field] = 'Tên mới phải là văn bản tối đa 120 ký tự.';
    }
    for (const [field, max] of [['newIngredientName', 120], ['newIngredientUnit', 30]]) {
      const raw = body[field] === undefined ? [''] : Array.isArray(body[field]) ? body[field] : [body[field]];
      values[field] = raw.map(value => typeof value === 'string' ? value : '');
      if (raw.length > 20 || raw.some(value => typeof value !== 'string' || value.trim().length > max)) errors[field] = `Tối đa 20 dòng; mỗi giá trị không quá ${max} ký tự.`;
    }
    if (values.newIngredientUnit.some((unit, index) => unit.trim() && !values.newIngredientName[index]?.trim())) errors.newIngredientName = 'Vui lòng nhập tên cho nguyên liệu có đơn vị.';
    text('description', 'Mô tả', 2000);
    text('category', 'Loại món', 80);
    values.price = typeof body.price === 'string' ? body.price : '';
    const price = values.price.trim();
    if (body.priceUnknown === 'true') { data.price = null; values.priceUnknown = true; }
    else if (!/^\d+$/.test(price) || Number(price) > 2147483647) errors.price = 'Giá phải là số nguyên từ 0 đến 2.147.483.647 VND.';
    else data.price = Number(price);
    checkbox('priceIsDemo', 'Nhãn giá demo');
    checkbox('recipeIsDemo', 'Nhãn công thức demo');
    values.available = body.available === 'true';
    if (body.available !== undefined && body.available !== 'true') errors.available = 'Trạng thái phục vụ không hợp lệ.';
    data.available = values.available;
    values.imagePath = typeof body.imagePath === 'string' ? body.imagePath : '';
    if (body.imagePath !== undefined && typeof body.imagePath !== 'string') errors.imagePath = 'Ảnh không hợp lệ.';
    else if (values.imagePath && !imageChoices.some(image => image.path === values.imagePath) && !isAllowedDishImage(values.imagePath)) errors.imagePath = 'Vui lòng chọn ảnh trong danh sách hoặc URL từ nguồn ảnh được cho phép.';
    data.imagePath = values.imagePath || null;
    data.photoType = values.imagePath.includes('prod-pics.guide.michelin.com/') ? 'Ảnh hồ sơ quán' : 'Ảnh minh họa';
    values.restaurantId = typeof body.restaurantId === 'string' ? body.restaurantId : '';
    if (body.restaurantId != null && body.restaurantId !== '' && (typeof body.restaurantId !== 'string' || !/^[1-9]\d*$/.test(body.restaurantId) || Number(body.restaurantId) > 2147483647)) errors.restaurantId = 'Quán ăn không hợp lệ.';
    data.restaurantId = values.restaurantId ? Number(values.restaurantId) : null;
    values.chefId = typeof body.chefId === 'string' ? body.chefId : '';
    if (body.chefId != null && body.chefId !== '' && (typeof body.chefId !== 'string' || !/^[1-9]\d*$/.test(body.chefId) || Number(body.chefId) > 2147483647)) errors.chefId = 'Đầu bếp không hợp lệ.';
    data.chefId = values.chefId ? Number(values.chefId) : null;
    const ids = body.ingredientIds === undefined ? [] : Array.isArray(body.ingredientIds) ? body.ingredientIds : [body.ingredientIds];
    values.ingredientIds = ids.filter(id => typeof id === 'string');
    if (ids.length > 100 || ids.some(id => typeof id !== 'string' || !/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)) errors.ingredientIds = 'Nguyên liệu không hợp lệ.';
    data.ingredientIds = [...new Set(values.ingredientIds.map(Number))];
  } else if (resource === 'restaurants') {
    checkbox('isDemo', 'Nhãn nhà hàng demo');
    text('address', 'Địa chỉ', 300);
    text('ward', 'Phường', 120);
    text('district', 'Khu vực', 120);
    text('cuisine', 'Loại ẩm thực', 120, true);
    text('notableDishes', 'Món nổi bật', 1000);
    data.notableDishes = (data.notableDishes || '').split(',').map(value => value.trim()).filter(Boolean);
    text('michelinUrl', 'Nguồn Michelin', 600);
    if (data.michelinUrl && !/^https:\/\/guide\.michelin\.com\/[a-zA-Z0-9%_./-]+$/.test(data.michelinUrl)) errors.michelinUrl = 'Cần URL hồ sơ Michelin hợp lệ.';
    text('imagePath', 'Ảnh', 2000);
    if (data.imagePath && !isAllowedDishImage(data.imagePath)) errors.imagePath = 'Ảnh phải từ một nguồn đã được cho phép.';
  } else if (resource === 'chefs') { text('specialty', 'Chuyên môn', 120); checkbox('isDemo', 'Nhãn đầu bếp demo'); }
  else { text('unit', 'Đơn vị', 30, true); checkbox('isDemo', 'Nhãn nguyên liệu demo'); }
  return { data, values, errors, valid: Object.keys(errors).length === 0 };
}
