import crypto from 'node:crypto';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export class StorageError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateImageFile(file) {
  if (!file) return;
  if (!allowedTypes.has(file.mimetype)) throw new StorageError(400, 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new StorageError(400, 'Ảnh không được vượt quá 5 MB.');
}

export async function uploadImage(file) {
  validateImageFile(file);
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET = 'dish-images' } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new StorageError(503, 'Thiếu cấu hình Supabase Storage trong .env.');
  }
  const extension = allowedTypes.get(file.mimetype);
  const path = `${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': file.mimetype, 'x-upsert': 'false' },
    body: file.buffer,
  });
  if (!response.ok) throw new StorageError(502, `Không thể tải ảnh lên Supabase Storage (HTTP ${response.status}).`);
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${path}`;
}
