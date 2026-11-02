import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

const DEFAULT_USERS = [
  {
    id: 'user_1',
    username: 'eli_trekker',
    email: 'elitrecker@gmail.com',
    password: 'password123',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('viet_cuisine_user') || sessionStorage.getItem('viet_cuisine_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('viet_cuisine_accounts');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('viet_cuisine_accounts', JSON.stringify(users));
    } catch {}
  }, [users]);

  const login = async ({ email, password, remember = true }) => {
    await new Promise(r => setTimeout(r, 400));
    
    const query = email.trim().toLowerCase();
    if (!query) {
      throw new Error('Vui lòng nhập email hoặc tên tài khoản.');
    }
    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    const existing = users.find(
      u => u.email.toLowerCase() === query || u.username.toLowerCase() === query
    );
    
    if (existing) {
      if (existing.password && existing.password !== password) {
        throw new Error('Mật khẩu không chính xác. Vui lòng thử lại.');
      }
      const sessionUser = { id: existing.id, username: existing.username, email: existing.email };
      setUser(sessionUser);
      if (remember) {
        localStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
      }
      return sessionUser;
    }

    // Tự động tạo phiên người dùng demo nếu chưa có
    const usernameFromQuery = query.includes('@') ? query.split('@')[0] : query;
    const emailFromQuery = query.includes('@') ? query : `${query}@gmail.com`;
    const newUser = {
      id: `user_${Date.now()}`,
      username: usernameFromQuery,
      email: emailFromQuery,
      password: password || 'password123',
    };
    setUsers(prev => [...prev, newUser]);
    const sessionUser = { id: newUser.id, username: newUser.username, email: newUser.email };
    setUser(sessionUser);
    if (remember) {
      localStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
    } else {
      sessionStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
    }
    return sessionUser;
  };

  const register = async ({ username, email, password, remember = true }) => {
    await new Promise(r => setTimeout(r, 400));
    
    const normalizedEmail = email.trim().toLowerCase();
    const finalUsername = (username || normalizedEmail.split('@')[0] || 'Khách ẩm thực').trim();

    if (!normalizedEmail) {
      throw new Error('Vui lòng nhập email.');
    }
    if (!password || password.length < 4) {
      throw new Error('Mật khẩu cần tối thiểu 4 ký tự.');
    }

    const existingIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    let sessionUser;

    if (existingIndex >= 0) {
      const updated = { ...users[existingIndex], username: finalUsername, password };
      const nextUsers = [...users];
      nextUsers[existingIndex] = updated;
      setUsers(nextUsers);
      sessionUser = { id: updated.id, username: updated.username, email: updated.email };
    } else {
      const newUser = {
        id: `user_${Date.now()}`,
        username: finalUsername,
        email: normalizedEmail,
        password,
      };
      setUsers(prev => [...prev, newUser]);
      sessionUser = { id: newUser.id, username: newUser.username, email: newUser.email };
    }

    setUser(sessionUser);
    if (remember) {
      localStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
    } else {
      sessionStorage.setItem('viet_cuisine_user', JSON.stringify(sessionUser));
    }
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('viet_cuisine_user');
      sessionStorage.removeItem('viet_cuisine_user');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const target = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${target}`} replace />;
  }

  return children;
}
