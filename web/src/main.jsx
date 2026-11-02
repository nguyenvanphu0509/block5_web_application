import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { useLoad, useMotion, NavigationEffects } from './hooks.js';
import { AuthProvider, useAuth, ProtectedRoute } from './AuthContext.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Home } from './pages/Home.jsx';
import { Catalog, PublicDetail } from './pages/Catalog.jsx';
import { AdminList, AdminRecord } from './pages/Admin.jsx';
import { RecordForm } from './pages/RecordForm.jsx';
import './spa.css';

function App() {
  const location = useLocation(), root = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
  const config = useLoad('config', signal => api('/config', { signal }));
  useMotion(root, location.pathname);

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const dishesLink = isAuthenticated ? '/dishes' : '/login?redirect=/dishes';

  return (
    <div ref={root}>
      <NavigationEffects/>
      <a className="skip-link" href="#main">Đến nội dung chính</a>
      {!isAuthPage && (
        <header className="site-header shell">
          <Link className="brand" to="/">
            <span className="brand-logo"><img src="/images/logo.png" alt="" width="2048" height="2048"/></span>
            <span>ẨM THỰC VIỆT<span className="brand-sub">TINH HOA HƯƠNG VỊ</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            <Link to="/#destinations">Khám phá</Link>
            <Link to={dishesLink}>Món ăn</Link>
            <Link to="/#journey">Cẩm nang</Link>
            <Link to="/#about">Về chúng tôi</Link>
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <div className="header-auth-group">
                <div className="header-user-badge">
                  <span className="header-user-name" title={user.email}>👤 {user.username || user.email}</span>
                  <button type="button" className="header-logout-btn" onClick={logout}>Đăng xuất</button>
                </div>
                <Link className="button small" to="/dishes">Khám phá món ăn ↗</Link>
              </div>
            ) : (
              <div className="header-auth-group">
                <Link className="header-login-link" to="/login">Đăng nhập</Link>
                <Link className="button small" to="/login?redirect=/dishes">Khám phá món ăn ↗</Link>
              </div>
            )}
          </div>
          <details className="mobile-menu" key={location.pathname}>
            <summary aria-label="Mở điều hướng">☰</summary>
            <nav>
              <Link to="/#destinations">Khám phá</Link>
              <Link to={dishesLink}>Món ăn</Link>
              {isAuthenticated ? (
                <button type="button" onClick={logout} className="mobile-logout-btn">
                  Đăng xuất ({user.username || user.email})
                </button>
              ) : (
                <Link to="/login">Đăng nhập / Đăng ký</Link>
              )}
              <Link to="/admin/dishes">Quản trị demo</Link>
            </nav>
          </details>
        </header>
      )}
      {!isAuthPage && config.result?.data.preview && (
        <aside className="preview-note shell" role="status">Chế độ chỉ đọc · thao tác lưu bị khóa.</aside>
      )}
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<AuthPage initialMode="login"/>}/>
        <Route path="/signup" element={<AuthPage initialMode="signup"/>}/>
        <Route path="/dishes" element={<ProtectedRoute><Catalog/></ProtectedRoute>}/>
        <Route path="/dishes/:id" element={<ProtectedRoute><PublicDetail resource="dishes"/></ProtectedRoute>}/>
        {['chefs', 'ingredients', 'restaurants'].map(resource => (
          <React.Fragment key={resource}>
            <Route path={`/${resource}/:id`} element={<PublicDetail key={resource} resource={resource}/>}/>
            <Route path={`/admin/${resource}`} element={<AdminList key={resource} resource={resource}/>}/>
            <Route path={`/admin/${resource}/new`} element={<RecordForm key={`${resource}-new`} resource={resource}/>}/>
            <Route path={`/admin/${resource}/:id/edit`} element={<RecordForm key={`${resource}-edit`} resource={resource} editing/>}/>
            <Route path={`/admin/${resource}/:id/delete`} element={<AdminRecord key={`${resource}-delete`} resource={resource} deleting/>}/>
            <Route path={`/admin/${resource}/:id`} element={<AdminRecord key={`${resource}-show`} resource={resource}/>}/>
          </React.Fragment>
        ))}
        <Route path="/admin/dishes" element={<AdminList resource="dishes"/>}/>
        <Route path="/admin/dishes/new" element={<RecordForm resource="dishes"/>}/>
        <Route path="/admin/dishes/:id/edit" element={<RecordForm resource="dishes" editing/>}/>
        <Route path="/admin/dishes/:id/delete" element={<AdminRecord resource="dishes" deleting/>}/>
        <Route path="/admin/dishes/:id" element={<AdminRecord resource="dishes"/>}/>
        <Route path="/admin" element={<Navigate to="/admin/dishes" replace/>}/>
        <Route path="*" element={<main id="main" tabIndex="-1" className="shell page-main empty-state"><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></main>}/>
      </Routes>
      {!isAuthPage && (
        <footer className="site-footer shell">
          <Link className="brand footer-brand" to="/">ẨM THỰC VIỆT</Link>
          <p>Một thành phố. Muôn vàn hương vị.</p>
          <nav>
            <Link to={dishesLink}>Thực đơn</Link>
            <Link to="/admin">Quản trị demo</Link>
            <a href="https://guide.michelin.com/en/vn/ho-chi-minh/restaurants" target="_blank" rel="noopener noreferrer">Nguồn Michelin ↗</a>
          </nav>
          <div className="footer-bottom">
            <span>© 2026 Ẩm thực Việt · Block 7</span>
            <span>React · REST API · Prisma · Supabase</span>
          </div>
        </footer>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App/>
    </AuthProvider>
  </BrowserRouter>
);
