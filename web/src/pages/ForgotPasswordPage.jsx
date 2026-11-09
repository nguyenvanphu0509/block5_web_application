import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import './auth.css';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetMode = params.get('reset') === '1';
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setOtp(result.data.otp || '');
      setMessage('Nếu email tồn tại, mã OTP đã được gửi đến Gmail của bạn.');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo yêu cầu đặt lại mật khẩu.');
    } finally {
      setPending(false);
    }
  };

  const resetPassword = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setPending(true);
    try {
      await api('/auth/reset-password', { method: 'POST', data: { otp, password: newPassword } });
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (requestError) {
      setError(requestError.message || 'Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main id="main" tabIndex="-1" className="auth-page-wrapper">
      <div className="auth-card-container">
        <section className="auth-left-column">
          <div className="auth-form-section">
            <h1 className="auth-form-title">Quên mật khẩu?</h1>
            <p className="auth-form-subtitle">Nhập email đã đăng ký để tạo yêu cầu đặt lại mật khẩu.</p>
            {error && <div className="auth-alert error" role="alert">{error}</div>}
            {message && <div className="auth-alert success" role="status">{message}</div>}
            <form onSubmit={requestReset}>
              <div className="auth-field bordered">
                <label htmlFor="reset-email">Email</label>
                <input id="reset-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              <button type="submit" className="auth-start-btn" disabled={pending}>
                {pending ? 'Đang xử lý…' : 'Gửi yêu cầu đặt lại'}
              </button>
            </form>
            {resetMode && (
              <form className="auth-reset-form" onSubmit={resetPassword}>
                <p className="auth-form-subtitle">Nhập mã OTP 6 số đã được gửi đến email của bạn.</p>
                <div className="auth-field bordered">
                  <label htmlFor="reset-otp">Mã OTP</label>
                  <input id="reset-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={otp} onChange={event => setOtp(event.target.value)} />
                </div>
                <div className="auth-field bordered">
                  <label htmlFor="new-password">Mật khẩu mới</label>
                  <div className="auth-password-wrapper">
                    <input id="new-password" type={showNewPassword ? 'text' : 'password'} minLength="15" maxLength="128" autoComplete="new-password" required value={newPassword} onChange={event => setNewPassword(event.target.value)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowNewPassword(previous => !previous)} aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiển thị mật khẩu mới'}>
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="auth-field bordered">
                  <label htmlFor="confirm-password">Nhập lại mật khẩu</label>
                  <div className="auth-password-wrapper">
                    <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} minLength="15" maxLength="128" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(previous => !previous)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}>
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-start-btn" disabled={pending}>Đặt lại mật khẩu</button>
              </form>
            )}
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
                  <span>Khám phá thực đơn</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
