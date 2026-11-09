import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, ApiError } from './api.js';
import { getSession, setSession, subscribeSession, reloadSession, validSession, tokenClaims } from './session.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, update] = useState(getSession);
  useEffect(() => {
    const unsubscribe = subscribeSession(() => update(getSession()));
    const synchronize = event => { if (event.key === 'viet_cuisine_session' || event.key === null) reloadSession(); };
    window.addEventListener('storage', synchronize);
    try {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('viet_cuisine_accounts'); storage.removeItem('viet_cuisine_user');
      }
    } catch {}
    return () => { unsubscribe(); window.removeEventListener('storage', synchronize); };
  }, []);
  useEffect(() => {
    if (!session) return;
    const expire = () => { if (!validSession(session)) setSession(null); };
    const timer = setInterval(expire, 1000);
    window.addEventListener('focus', expire); expire();
    return () => { clearInterval(timer); window.removeEventListener('focus', expire); };
  }, [session]);
  const login = async ({ email, password, remember = false, captchaToken }) => {
    const result = await api('/auth/login', { method: 'POST', auth: false, data: { email: email.trim().toLowerCase(), password, 'g-recaptcha-response': captchaToken } });
    if (!validSession(result.data)) throw new ApiError('technical', 'API chưa trả access token hợp lệ.');
    const claims = tokenClaims(result.data.accessToken);
    const user = result.data.user || { id: claims.sub, email: email.trim().toLowerCase(), role: claims.role };
    setSession({ accessToken: result.data.accessToken, user }, remember);
    return user;
  };
  const register = data => api('/auth/register', { method: 'POST', auth: false, data });
  const logout = () => setSession(null);
  return <AuthContext.Provider value={{ user: session?.user, isAuthenticated: !!session && validSession(session), login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children || <Outlet/>;
}
