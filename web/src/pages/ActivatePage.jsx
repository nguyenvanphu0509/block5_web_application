import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import './auth.css';

export function ActivatePage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState(location.state?.otp || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown(previous => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const activate = async event => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await api('/auth/activate', { method: 'POST', data: { email, otp } });
      setMessage('Tài khoản đã được kích hoạt. Bạn có thể đăng nhập.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (requestError) {
      setError(requestError.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');
    setResending(true);
    try {
      const result = await api('/auth/resend-activation', { method: 'POST', data: { email } });
      if (result.data.otp) setOtp(result.data.otp);
      setMessage(result.data.message);
      setResendCooldown(60);
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main id="main" tabIndex="-1" className="auth-page-wrapper">
      <div className="auth-card-container">
        <section className="auth-left-column">
          <div className="auth-form-section">
            <h1 className="auth-form-title">Kích hoạt tài khoản</h1>
            <p className="auth-form-subtitle">Nhập mã OTP đã được gửi đến email của bạn.</p>
            {error && <div className="auth-alert error" role="alert">{error}</div>}
            {message && <div className="auth-alert success" role="status">{message}</div>}
            <form onSubmit={activate} className="auth-clean-form">
              <div className="auth-field bordered"><label htmlFor="activation-email">Email</label><input id="activation-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></div>
              <div className="auth-field bordered"><label htmlFor="activation-otp">Mã OTP</label><input id="activation-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={otp} onChange={event => setOtp(event.target.value)} /></div>
              <button type="submit" className="auth-start-btn" disabled={pending}>{pending ? 'Đang kích hoạt…' : 'Kích hoạt tài khoản'}</button>
            </form>
            <div className="auth-resend-row">
              <button
                type="button"
                className="auth-resend-link"
                onClick={resend}
                disabled={resending || !email || resendCooldown > 0}
              >
                {resending ? 'Đang gửi lại…' : 'Gửi lại mã OTP'}
              </button>
              <span className="auth-resend-countdown">
                {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown} giây` : 'Có thể gửi lại mã'}
              </span>
            </div>
            <Link className="auth-back-link" to="/login">← Quay lại đăng nhập</Link>
          </div>
        </section>
        <div className="auth-right-column">
          <div className="auth-banner-container auth-forgot-banner">
            <img className="auth-banner-image active" src="/images/login.jpg" alt="Món ăn Việt" />
            <div className="auth-wave-corner-tl" aria-hidden="true"></div>
            <div className="auth-wave-corner-br" aria-hidden="true"></div>
            <div className="auth-floating-card">
              <h4 className="auth-floating-title">Xác nhận tài khoản</h4>
              <p className="auth-floating-desc">Kích hoạt tài khoản để tiếp tục khám phá những hương vị đặc sắc.</p>
            </div>
            <div className="auth-banner-bottom">
              <div className="auth-banner-tagline">
                <h3>Hương Vị Thiên Nhiên,<br />Khơi Nguồn Cảm Hứng!</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
