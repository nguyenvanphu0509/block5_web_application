import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, clearAccessToken } from './api.js';

const AuthContext = createContext(null);
const USER_KEY = 'block6_user';

function readUser() {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  sessionStorage.setItem('block6_access_token', data.accessToken);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const navigate = useNavigate();
  const clearSession = useCallback(() => {
    clearAccessToken();
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener('block6:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('block6:unauthorized', handleUnauthorized);
  }, [clearSession, navigate]);

  useEffect(() => {
    if (!user) return;
    api('/auth/me').then(result => setUser(result.data)).catch(error => {
      if (error.status === 401) {
        window.dispatchEvent(new CustomEvent('block6:unauthorized'));
      }
    });
  }, []);

  const login = async ({ email, password, captchaToken }) => {
    const result = await api('/auth/login', { method: 'POST', data: { email, password, captchaToken } });
    saveSession(result.data);
    setUser(result.data.user);
    return result.data.user;
  };

  const register = async ({ username, email, password, captchaToken }) => {
    const result = await api('/auth/register', { method: 'POST', data: { username, email, password, captchaToken } });
    return result.data;
  };

  const logout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, clearSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles?.length && !roles.includes(user.role)) return <main id="main" className="shell page-main empty-state"><h1>Không có quyền truy cập</h1><p>Tài khoản của bạn không được phép mở trang này.</p></main>;
  return children;
}
