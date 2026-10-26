import { validateInput } from '../../shared/resources.js';
import { isAllowedDishImage } from '../../shared/image-sources.js';
import { imageChoices } from '../data/demo.js';

export class BusinessError extends Error {
  constructor(code, message, fields) { super(message); this.code = code; this.fields = fields; }
}
export class TechnicalError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function idValue(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || Number(raw) > 2147483647) throw new BusinessError('NOT_FOUND', 'Bản ghi không tồn tại.');
  return Number(raw);
}
export function validRecord(body, resource, partial) {
  const { data, errors } = validateInput(body, resource, { partial });
  if (data.imagePath && !imageChoices.some(x => x.path === data.imagePath) && !['/images/restaurant.svg', '/images/greens.svg'].includes(data.imagePath) && !isAllowedDishImage(data.imagePath)) errors.imagePath = 'Chọn URL HTTPS từ nguồn ảnh được cho phép.';
  // Blank image input means no replacement, matching the existing editor.
  if (data.imagePath === '') delete data.imagePath;
  if (Object.keys(errors).length) throw new BusinessError('VALIDATION_FAILED', 'Dữ liệu không hợp lệ.', errors);
  return data;
}
export async function checkRelations(db, data) {
  const errors = {};
  for (const [field, model] of [['restaurantId', 'restaurant'], ['chefId', 'chef']]) {
    if (data[field] != null && !await db[model].findUnique({ where: { id: data[field] } })) errors[field] = 'Bản ghi liên kết không tồn tại.';
  }
  if (data.ingredientIds?.length && await db.ingredient.count({ where: { id: { in: data.ingredientIds } } }) !== data.ingredientIds.length) errors.ingredientIds = 'Có nguyên liệu không tồn tại.';
  if (Object.keys(errors).length) throw new BusinessError('VALIDATION_FAILED', 'Dữ liệu liên kết không hợp lệ.', errors);
}
