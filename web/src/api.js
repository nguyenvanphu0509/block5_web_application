export class ApiError extends Error {
  constructor(type, message, { code, fields, status } = {}) { super(message); this.type = type; this.code = code; this.fields = fields; this.status = status; }
}
export function createClient(baseUrl, fetcher = globalThis.fetch) {
  const base = baseUrl.replace(/\/$/, '');
  return async (path, { method = 'GET', data, file, signal } = {}) => {
    const headers = {}; let body;
    if (file) { body = new FormData(); body.set('payload', JSON.stringify(data)); body.set('imageFile', file); }
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }
    let response;
    try { response = await fetcher(`${base}/api${path}`, { method, headers, body, signal }); }
    catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('technical', 'Không kết nối được API. Kiểm tra kết nối và thử lại.');
    }
    if (!response.ok) throw new ApiError('technical', response.status === 503 ? 'Chế độ chỉ đọc hoặc dịch vụ chưa sẵn sàng.' : `Không thể xử lý yêu cầu (HTTP ${response.status}). Vui lòng thử lại.`, { status: response.status });
    let result;
    try { result = await response.json(); }
    catch { throw new ApiError('technical', 'API trả dữ liệu không đọc được.'); }
    if (!result || typeof result.ok !== 'boolean' || (result.ok && !Object.hasOwn(result, 'data')) || (!result.ok && typeof result.error?.code !== 'string')) throw new ApiError('technical', 'API trả dữ liệu không đúng định dạng.');
    if (!result.ok) throw new ApiError('business', result.error.message || 'Yêu cầu không hợp lệ.', result.error);
    return result;
  };
}
export const api = createClient(import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000');
