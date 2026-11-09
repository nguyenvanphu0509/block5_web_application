import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null), panelId = useId();
  const location = useLocation();
  const name = user?.name?.trim() || user?.username?.trim() || user?.email?.split('@')[0] || 'Bạn';
  const initial = Array.from(name)[0].toLocaleUpperCase('vi-VN');
  const role = { admin: 'Quản trị viên', editor: 'Biên tập viên', viewer: 'Thành viên' }[user?.role] || 'Thành viên';

  useEffect(() => setOpen(false), [location.key]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  return <div className="account-menu" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="account-avatar" aria-label={`Tài khoản của ${name}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true">{initial}</span>
    </button>
    {open && <section id={panelId} className="account-panel" aria-label="Thông tin tài khoản">
      <div className="account-panel-heading"><span className="account-panel-avatar" aria-hidden="true">{initial}</span><div><p className="account-name">{name}</p><span className="account-role">{role}</span></div></div>
      <p className="account-email">{user?.email}</p>
      <button type="button" className="account-logout" onClick={logout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 17v3H4V4h6v3M9 12h12m-4-4 4 4-4 4"/></svg>
        Đăng xuất
      </button>
    </section>}
  </div>;
}
