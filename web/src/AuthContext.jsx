import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, ApiError } from './api.js';
import { getSession, setSession, subscribeSession, reloadSession, validSession, tokenClaims } from './session.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, update] = useState(getSession);
  const [checkedToken, setCheckedToken] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) { setCheckedToken(null); setCurrentUser(null); return; }
    const controller = new AbortController();
    setSessionError(null);
    api('/auth/me', { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted && getSession()?.accessToken === token) { setCurrentUser(result.data); setCheckedToken(token); }
    }).catch(error => { if (!controller.signal.aborted) setSessionError(error); });
    return () => controller.abort();
  }, [session?.accessToken, revision]);
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
    const result = await api('/auth/login', { method: 'POST', auth: false, data: { email: email.trim().toLowerCase(), password, captcha: captchaToken } });
    if (!validSession(result.data)) throw new ApiError('technical', 'API chưa trả access token hợp lệ.');
    const claims = tokenClaims(result.data.accessToken);
    const user = result.data.user || { id: claims.sub, email: email.trim().toLowerCase(), role: claims.role };
    setSession({ accessToken: result.data.accessToken, user }, remember);
    return user;
  };
  const register = data => api('/auth/register', { method: 'POST', auth: false, data });
  const logout = () => setSession(null);
  return <AuthContext.Provider value={{ user: checkedToken === session?.accessToken ? currentUser : session?.user, isAuthenticated: !!session && validSession(session) && checkedToken === session.accessToken, checking: !!session && checkedToken !== session.accessToken, sessionError, retrySession: () => setRevision(value => value + 1), login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
export function ProtectedRoute({ children }) {
  const { isAuthenticated, checking, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (checking) return <main id="main" className="shell page-main" role={sessionError ? 'alert' : 'status'}>{sessionError ? <><p>{sessionError.message}</p><button type="button" className="button" onClick={retrySession}>Thử lại</button></> : 'Đang kiểm tra phiên…'}</main>;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children || <Outlet/>;
}
