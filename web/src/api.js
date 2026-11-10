import { getSession, setSession } from './session.js';

export class ApiError extends Error {
  constructor(type, message, details = {}) { super(message); this.type = type; Object.assign(this, details); }
}
export function createClient(baseUrl, fetcher = globalThis.fetch, { session = getSession, clearSession = () => setSession(null) } = {}) {
  const base = baseUrl.replace(/\/$/, '');
  return async (path, { method = 'GET', data, file, signal, auth = true } = {}) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[\\\r\n]/.test(path) || !new URL(`${base}/api${path}`, 'http://local.invalid').pathname.startsWith('/api/')) throw new ApiError('technical', 'Đường dẫn API không hợp lệ.');
    const headers = {}; let body;
    const accessToken = auth ? session()?.accessToken : null;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (file) { body = new FormData(); body.set('payload', JSON.stringify(data)); body.set('imageFile', file); }
    else if (data !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }
    let response;
    try { response = await fetcher(`${base}/api${path}`, { method, headers, body, signal }); }
    catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('technical', 'Không kết nối được API. Kiểm tra kết nối và thử lại.');
    }
    let result;
    try { result = await response.json(); } catch {}
    if (!response.ok) {
      if (response.status === 401 && accessToken && session()?.accessToken === accessToken) clearSession();
      const fallback = response.status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.'
        : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.'
        : response.status === 429 ? 'Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.'
        : response.status === 503 ? 'Chế độ chỉ đọc hoặc dịch vụ chưa sẵn sàng.'
        : `Không thể xử lý yêu cầu (HTTP ${response.status}). Vui lòng thử lại.`;
      throw new ApiError(response.status < 500 ? 'business' : 'technical', result?.error?.message || fallback, {
        ...result?.error, status: response.status,
        captchaRequired: result?.error?.captchaRequired || result?.data?.captchaRequired,
        retryAfter: Number(response.headers?.get('Retry-After')) || undefined,
      });
    }
    if (!result || typeof result.ok !== 'boolean' || (result.ok && !Object.hasOwn(result, 'data')) || (!result.ok && typeof result.error?.code !== 'string')) throw new ApiError('technical', 'API trả dữ liệu không đúng định dạng.');
    if (!result.ok) throw new ApiError('business', result.error.message || 'Yêu cầu không hợp lệ.', result.error);
    return result;
  };
}
export const api = createClient(import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000');
