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
