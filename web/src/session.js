const KEY = 'viet_cuisine_session';
const listeners = new Set();
let current;
export function tokenClaims(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), c => c.charCodeAt(0))));
  } catch { return null; }
}
// UI expiry only: signature verification and authorization belong to the API.
export function validSession(session) {
  const claims = tokenClaims(session?.accessToken || '');
  return !!(claims && Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now());
}
function storages() {
  try { return [globalThis.localStorage, globalThis.sessionStorage]; } catch { return []; }
}
export function getSession() {
  if (current === undefined) {
    current = null;
    for (const storage of storages()) {
      try { const saved = JSON.parse(storage?.getItem(KEY) || 'null'); if (validSession(saved)) { current = saved; break; } } catch {}
    }
  }
  if (current && !validSession(current)) setSession(null);
  return current;
}
export function setSession(session, remember = false) {
  current = session;
  const stores = storages();
  for (const storage of stores) {
    try { for (const key of [KEY, 'viet_cuisine_user', 'viet_cuisine_accounts']) storage?.removeItem(key); } catch {}
  }
  if (session) { try { stores[remember ? 0 : 1]?.setItem(KEY, JSON.stringify(session)); } catch {} }
  listeners.forEach(listener => listener());
}
export function subscribeSession(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function reloadSession() { current = undefined; getSession(); listeners.forEach(listener => listener()); }
export function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value) ? value : '/dishes';
}
