export const resources = {
  dishes: { model: 'dish', label: 'Món ăn', singular: 'món ăn', fields: [['name', 'Tên món', 'text', 120, true], ['description', 'Mô tả', 'textarea', 2000], ['price', 'Giá món (VND)', 'price', null, true], ['category', 'Loại món', 'text', 80], ['available', 'Đang phục vụ', 'checkbox']] },
  chefs: { model: 'chef', label: 'Đầu bếp', singular: 'đầu bếp', fields: [['name', 'Tên đầu bếp', 'text', 120, true], ['specialty', 'Chuyên môn', 'text', 120]] },
  ingredients: { model: 'ingredient', label: 'Nguyên liệu', singular: 'nguyên liệu', fields: [['name', 'Tên nguyên liệu', 'text', 120, true], ['unit', 'Đơn vị', 'text', 30, true]] },
  restaurants: { model: 'restaurant', label: 'Nhà hàng', singular: 'nhà hàng', fields: [['name', 'Tên quán', 'text', 120, true], ['cuisine', 'Loại ẩm thực', 'text', 120, true], ['address', 'Địa chỉ', 'text', 300], ['ward', 'Phường', 'text', 120], ['district', 'Khu vực', 'text', 120], ['notableDishes', 'Món nổi bật (ngăn cách bằng dấu phẩy)', 'list', 1000], ['michelinUrl', 'Nguồn Michelin', 'text', 600]] },
};

// Pure JSON rules shared by API and browser. Database/image checks stay on the API.
export function validateInput(body, resource, { partial = false } = {}) {
  const data = {}, errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { data, errors: { _form: 'Body phải là một object JSON.' } };
  const has = field => Object.hasOwn(body, field);
  for (const [field, label, type, max, required] of resources[resource].fields) {
    if (!has(field) && partial) continue;
    const raw = body[field];
    if (type === 'checkbox') {
      if (raw === undefined && !partial) data[field] = true;
      else if (typeof raw !== 'boolean') errors[field] = `${label} phải là boolean.`;
      else data[field] = raw;
    } else if (type === 'price') {
      if (raw === null) data[field] = null;
      else if (!Number.isInteger(raw) || raw < 0 || raw > 2147483647) errors[field] = 'Giá phải là số nguyên từ 0 đến 2.147.483.647 VND, hoặc null khi chưa xác nhận.';
      else data[field] = raw;
    } else if (type === 'list') {
      if (raw === undefined && !partial) data[field] = [];
      else if (!Array.isArray(raw) || raw.some(x => typeof x !== 'string') || raw.join(',').length > max) errors[field] = `${label} phải là danh sách văn bản tối đa ${max} ký tự.`;
      else data[field] = raw.map(x => x.trim()).filter(Boolean);
    } else {
      if (raw == null && !required) { data[field] = null; continue; }
      if (typeof raw !== 'string') { errors[field] = `${label} phải là văn bản.`; continue; }
      const value = raw.trim();
      if (required && !value) errors[field] = `Vui lòng nhập ${label.toLowerCase()}.`;
      else if (value.length > max) errors[field] = `${label} tối đa ${max} ký tự.`;
      else data[field] = value || null;
    }
  }
  const bools = resource === 'dishes' ? ['priceIsDemo', 'recipeIsDemo'] : ['isDemo'];
  for (const field of bools) if (has(field)) {
    if (typeof body[field] !== 'boolean') errors[field] = 'Giá trị phải là boolean.';
    else data[field] = body[field];
  }
  if (resource === 'restaurants' && data.michelinUrl && !/^https:\/\/guide\.michelin\.com\/[a-zA-Z0-9%_./-]+$/.test(data.michelinUrl)) errors.michelinUrl = 'Cần URL hồ sơ Michelin hợp lệ.';
  if (resource === 'dishes') {
    for (const field of ['restaurantId', 'chefId']) if (has(field)) {
      if (body[field] !== null && (!Number.isInteger(body[field]) || body[field] < 1 || body[field] > 2147483647)) errors[field] = 'ID liên kết không hợp lệ.';
      else data[field] = body[field];
    }
    if (has('ingredientIds')) {
      if (!Array.isArray(body.ingredientIds) || body.ingredientIds.length > 100 || body.ingredientIds.some(x => !Number.isInteger(x) || x < 1 || x > 2147483647)) errors.ingredientIds = 'Chọn tối đa 100 ID nguyên liệu hợp lệ.';
      else data.ingredientIds = [...new Set(body.ingredientIds)];
    }
    for (const field of ['newRestaurantName', 'newChefName']) if (has(field)) {
      if (typeof body[field] !== 'string' || body[field].trim().length > 120) errors[field] = 'Tên mới tối đa 120 ký tự.';
      else if (body[field].trim()) data[field] = body[field].trim();
    }
    if (data.newRestaurantName && data.restaurantId) errors.newRestaurantName = 'Chọn quán cũ hoặc nhập quán mới.';
    if (data.newChefName && data.chefId) errors.newChefName = 'Chọn đầu bếp cũ hoặc nhập đầu bếp mới.';
    if (has('newIngredients')) {
      if (!Array.isArray(body.newIngredients) || body.newIngredients.length > 20 || body.newIngredients.some(x => !x || typeof x.name !== 'string' || !x.name.trim() || x.name.trim().length > 120 || typeof x.unit !== 'string' || x.unit.trim().length > 30)) errors.newIngredients = 'Tối đa 20 nguyên liệu mới; tên bắt buộc, tối đa 120 ký tự; đơn vị tối đa 30 ký tự.';
      else data.newIngredients = body.newIngredients.map(x => ({ name: x.name.trim(), unit: x.unit.trim() || 'phần' }));
    }
  }
  if (['dishes', 'restaurants'].includes(resource) && has('imagePath')) {
    if (body.imagePath !== null && (typeof body.imagePath !== 'string' || body.imagePath.length > 2000)) errors.imagePath = 'Ảnh phải là URL hoặc null.';
    else data.imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : null;
  }
  return { data, errors };
}
