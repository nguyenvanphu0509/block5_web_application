import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import './auth.css';

function PasswordRecoveryLayout({ title, children }) {
  return (
    <main id="main" tabIndex="-1" className="auth-page-wrapper">
      <div className="auth-card-container">
        <section className="auth-left-column">
          <div className="auth-form-section">
            <h1 className="auth-form-title">{title}</h1>
            {children}
            <Link className="auth-back-link" to="/login">← Quay lại đăng nhập</Link>
          </div>
        </section>
        <div className="auth-right-column">
          <div className="auth-banner-container auth-forgot-banner">
            <img className="auth-banner-image active" src="/images/login.jpg" alt="Món ăn Việt" />
            <div className="auth-wave-corner-tl" aria-hidden="true"></div>
            <div className="auth-wave-corner-br" aria-hidden="true"></div>
            <div className="auth-floating-card">
              <h4 className="auth-floating-title">Giữ trọn hành trình ẩm thực</h4>
              <p className="auth-floating-desc">Khôi phục tài khoản để tiếp tục khám phá những hương vị đặc sắc.</p>
            </div>
            <div className="auth-banner-bottom">
              <div className="auth-banner-tagline">
                <h3>Hương Vị Thiên Nhiên,<br />Khơi Nguồn Cảm Hứng!</h3>
                <Link className="auth-pill-link" to="/dishes">
                  <span>Khám phá thực đơn ↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const requestReset = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    setPending(true);
    try {
      const result = await api('/auth/forgot-password', { method: 'POST', data: { email } });
      setMessage(result.data.message);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo yêu cầu đặt lại mật khẩu.');
    } finally {
      setPending(false);
    }
  };

  return (
    <PasswordRecoveryLayout title="Quên mật khẩu?">
      <p className="auth-form-subtitle">Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
      {error && <div className="auth-alert error" role="alert">{error}</div>}
      {message && <div className="auth-alert success" role="status">{message}</div>}
      <form onSubmit={requestReset}>
        <div className="auth-field bordered">
          <label htmlFor="reset-email">Email</label>
          <input id="reset-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
        </div>
        <button type="submit" className="auth-start-btn" disabled={pending}>
          {pending ? 'Đang xử lý…' : 'Gửi liên kết đặt lại'}
        </button>
      </form>
    </PasswordRecoveryLayout>
  );
}

function PasswordField({ id, label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field bordered">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrapper">
        <input id={id} type={visible ? 'text' : 'password'} minLength="15" maxLength="128" autoComplete="new-password" required value={value} onChange={event => onChange(event.target.value)} />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ẩn ' + label.toLowerCase() : 'Hiện ' + label.toLowerCase()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M1 1l22 22" />}
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const token = new URLSearchParams(hash.slice(1)).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [rejectedLink, setRejectedLink] = useState(false);
  const invalidLink = rejectedLink || !/^[A-Za-z0-9_-]{43}$/.test(token);

  const resetPassword = async event => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setPending(true);
    try {
      await api('/auth/reset-password', { method: 'POST', data: { token, password } });
      setPassword('');
      setConfirmation('');
      setCompleted(true);
      clearSession();
      navigate('/reset-password', { replace: true });
    } catch (requestError) {
      setRejectedLink(requestError.code === 'INVALID_RESET_TOKEN');
      setError(requestError.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setPending(false);
    }
  };

  return (
    <PasswordRecoveryLayout title="Đặt lại mật khẩu">
      {completed ? (
        <div className="auth-alert success" role="status">Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.</div>
      ) : invalidLink ? (
        <>
          <div className="auth-alert error" role="alert">{error || 'Liên kết đặt lại mật khẩu không hợp lệ.'}</div>
          <Link className="auth-back-link" to="/forgot-password">Yêu cầu liên kết mới</Link>
        </>
      ) : (
        <form className="auth-reset-form" onSubmit={resetPassword}>
          <p className="auth-form-subtitle">Nhập mật khẩu mới dài từ 15 đến 128 ký tự.</p>
          {error && <div className="auth-alert error" role="alert">{error}</div>}
          <PasswordField id="new-password" label="Mật khẩu mới" value={password} onChange={setPassword} />
          <PasswordField id="confirm-password" label="Nhập lại mật khẩu" value={confirmation} onChange={setConfirmation} />
          <button type="submit" className="auth-start-btn" disabled={pending}>
            {pending ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      )}
    </PasswordRecoveryLayout>
  );
}
