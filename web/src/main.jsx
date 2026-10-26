import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api.js';
import { useLoad, useMotion, NavigationEffects } from './hooks.js';
import { Home } from './pages/Home.jsx';
import { Catalog, PublicDetail } from './pages/Catalog.jsx';
import { AdminList, AdminRecord } from './pages/Admin.jsx';
import { RecordForm } from './pages/RecordForm.jsx';
import './spa.css';

function App() {
  const location = useLocation(), root = useRef(null);
  const config = useLoad('config', signal => api('/config', { signal }));
  useMotion(root, location.pathname + location.search);
  return <div ref={root}><NavigationEffects/><a className="skip-link" href="#main">Đến nội dung chính</a><header className="site-header shell"><Link className="brand" to="/"><span className="brand-logo"><img src="/images/logo.png" alt="" width="2048" height="2048"/></span><span>ẨM THỰC VIỆT<span className="brand-sub">TINH HOA HƯƠNG VỊ</span></span></Link><nav className="desktop-nav" aria-label="Điều hướng chính"><Link to="/#destinations">Khám phá</Link><Link to="/dishes">Món ăn</Link><Link to="/#journey">Cẩm nang</Link><Link to="/#about">Về chúng tôi</Link></nav><div className="header-actions"><Link className="button small" to="/dishes">Khám phá món ăn ↗</Link></div><details className="mobile-menu" key={location.pathname}><summary aria-label="Mở điều hướng">☰</summary><nav><Link to="/#destinations">Khám phá</Link><Link to="/dishes">Món ăn</Link><Link to="/admin/dishes">Quản trị demo</Link></nav></details></header>{config.result?.data.preview && <aside className="preview-note shell" role="status">Chế độ chỉ đọc · thao tác lưu bị khóa.</aside>}<Routes>
    <Route path="/" element={<Home/>}/><Route path="/dishes" element={<Catalog/>}/>
    {['dishes', 'chefs', 'ingredients', 'restaurants'].map(resource => <React.Fragment key={resource}><Route path={`/${resource}/:id`} element={<PublicDetail key={resource} resource={resource}/>}/><Route path={`/admin/${resource}`} element={<AdminList key={resource} resource={resource}/>}/><Route path={`/admin/${resource}/new`} element={<RecordForm key={`${resource}-new`} resource={resource}/>}/><Route path={`/admin/${resource}/:id/edit`} element={<RecordForm key={`${resource}-edit`} resource={resource} editing/>}/><Route path={`/admin/${resource}/:id/delete`} element={<AdminRecord key={`${resource}-delete`} resource={resource} deleting/>}/><Route path={`/admin/${resource}/:id`} element={<AdminRecord key={`${resource}-show`} resource={resource}/>}/></React.Fragment>)}
    <Route path="/admin" element={<Navigate to="/admin/dishes" replace/>}/><Route path="*" element={<main id="main" tabIndex="-1" className="shell page-main empty-state"><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></main>}/>
  </Routes><footer className="site-footer shell"><Link className="brand footer-brand" to="/">ẨM THỰC VIỆT</Link><p>Một thành phố. Muôn vàn hương vị.</p><nav><Link to="/dishes">Thực đơn</Link><Link to="/admin">Quản trị demo</Link><a href="https://guide.michelin.com/en/vn/ho-chi-minh/restaurants" target="_blank" rel="noopener noreferrer">Nguồn Michelin ↗</a></nav><div className="footer-bottom"><span>© 2026 Ẩm thực Việt · Block 7</span><span>React · REST API · Prisma · Supabase</span></div></footer></div>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
