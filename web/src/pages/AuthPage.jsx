import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import { safeRedirect } from '../session.js';
import { Captcha } from '../Captcha.jsx';
import './auth.css';

const SLIDES = [
  {
    image: '/images/editorial-dining.jpg',
    title: 'Không Gian Dùng Bữa Tinh Tế',
    desc: 'Ánh sáng ấm, bàn ăn thanh lịch và những ly vang chờ một buổi tối trọn vẹn.',
    tagline: 'Một Bàn Ăn Đẹp,<br />Một Trải Nghiệm Đáng Nhớ!',
    pill: 'Khám phá không gian ẩm thực',
  },
  {
    image: '/images/editorial-lobster.jpg',
    title: 'Tôm Hùm, Tôm Biển & Sò Điệp',
    desc: 'Đĩa hải sản nướng cùng thảo mộc, đậu xanh và chanh tươi.',
    tagline: 'Hương Vị Biển,<br />Trong Từng Đĩa Ăn!',
    pill: 'Khám phá thực đơn hải sản',
  },
  {
    image: '/images/auth-salmon.jpg',
    title: 'Cá Hồi Áp Chảo',
    desc: 'Phi lê cá hồi vàng mặt, dùng cùng rau xanh và phần topping rau củ tươi.',
    tagline: 'Mỗi Bữa Ăn Là Một<br />Khoảnh Khắc Đáng Nhớ!',
    pill: 'Xem món cá hồi',
  },
  {
    image: '/images/editorial-wine.jpg',
    title: 'Vang Rosé & Món Khai Vị',
    desc: 'Hai ly vang rosé bên bánh mì cà chua và những nguyên liệu cho bữa tối.',
    tagline: 'Một Chút Vang,<br />Một Tối Thảnh Thơi!',
    pill: 'Khám phá lựa chọn rượu vang',
  },
];

export function AuthPage({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const busy = useRef(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRevision, setCaptchaRevision] = useState(0);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const seconds = Math.max(0, Math.ceil((resendUntil - now) / 1000));
  useEffect(() => {
    setMode(initialMode); setError(''); setSuccessMsg('');
    setPassword(''); setConfirmPassword(''); setCaptchaToken('');
  }, [initialMode]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tự động chuyển ảnh mỗi 5 giây
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const redirectPath = safeRedirect(searchParams.get('redirect'));
  const handleSubmit = async (e, resend = false) => {
    e.preventDefault();
    if (busy.current) return;
    setError(''); setSuccessMsg('');
    if (mode === 'signup') {
      if (password.length < 15 || password.length > 128) { setError('Mật khẩu cần từ 15 đến 128 ký tự.'); return; }
      if (confirmPassword !== password) { setError('Mật khẩu nhập lại không khớp.'); return; }
      setMode('signup-confirm'); return;
    }
    if (['signup-confirm', 'reset'].includes(mode)) {
      if (password.length < 15 || password.length > 128) { setError('Mật khẩu cần từ 15 đến 128 ký tự.'); return; }
      if (confirmPassword !== password) { setError('Mật khẩu nhập lại không khớp.'); return; }
    }
    if ((mode === 'signup-confirm' || (mode === 'login' && captchaRequired)) && !captchaToken) {
      setError('Vui lòng xác nhận CAPTCHA.'); return;
    }
    busy.current = true; setPending(true);
    const normalizedEmail = email.trim().toLowerCase();
    const post = (path, data) => api(`/auth/${path}`, { method: 'POST', auth: false, data });
    try {
      if (resend) {
        await post('activate/resend', { email: normalizedEmail });
        setResendUntil(Date.now() + 60000);
        setSuccessMsg('Yêu cầu gửi lại OTP đã được xử lý. Hãy kiểm tra cả thư rác.');
      } else if (mode === 'login') {
        await login({ email: normalizedEmail, password, remember: rememberMe, captchaToken });
        navigate(redirectPath, { replace: true });
      } else if (mode === 'signup-confirm') {
        await register({ name: username.trim(), email: normalizedEmail, password, confirmPassword, captcha: captchaToken });
        setPassword(''); setConfirmPassword(''); setMode('activate');
        setResendUntil(Date.now() + 60000);
        setSuccessMsg('Yêu cầu đăng ký đã được xử lý. Nhập OTP 6 chữ số gửi đến email; mã có hiệu lực 10 phút.');
      } else if (mode === 'activate') {
        await post('activate', { email: normalizedEmail, otp });
        setMode('login'); setSuccessMsg('Email đã xác minh. Vui lòng đăng nhập bằng mật khẩu của bạn.');
      } else if (mode === 'forgot') {
        await post('forgot', { email: normalizedEmail });
        setSuccessMsg('Nếu email phù hợp, liên kết đặt lại mật khẩu sẽ được gửi. Hãy kiểm tra cả thư rác.');
      } else if (mode === 'reset') {
        await post('reset', { token: searchParams.get('token') || '', password, confirmPassword });
        logout(); setMode('login'); setPassword(''); setConfirmPassword('');
        setSuccessMsg('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      if (err.code === 'ACCOUNT_NOT_ACTIVATED') setMode('activate');
      if (err.captchaRequired || err.code === 'CAPTCHA_REQUIRED') setCaptchaRequired(true);
      if (err.retryAfter && mode === 'activate') setResendUntil(Date.now() + err.retryAfter * 1000);
    } finally {
      busy.current = false; setPending(false); setCaptchaToken(''); setCaptchaRevision(value => value + 1);
    }
  };

  const handleTabSwitch = (newMode) => {
    if (busy.current) return;
    setMode(newMode); setError(''); setSuccessMsg(''); setPassword(''); setConfirmPassword('');
    setCaptchaToken(''); setCaptchaRequired(false); setCaptchaRevision(value => value + 1);
  };
  const unavailableSocialLogin = () => setError('Đăng nhập liên kết chưa được cấu hình. Vui lòng sử dụng email và mật khẩu.');

  const currentSlide = SLIDES[slideIndex];

  return (
    <main id="main" tabIndex="-1" className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Cột trái: Form & Switcher (Cân đối, rộng rãi) */}
        <div className="auth-left-column">
          {/* Logo & Tiêu đề thương hiệu */}
          <div className="auth-brand-header">
            <Link to="/" className="auth-brand-title">Ẩm Thực Việt</Link>
            <p className="auth-brand-subtitle">Khám phá nhiều hơn. Trải nghiệm trọn vẹn.</p>
          </div>

          {/* 2 Nút chuyển đổi Đăng ký / Đăng nhập */}
          <div className="auth-toggle-group" role="tablist" aria-label="Lựa chọn đăng ký hoặc đăng nhập">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('signup')}
            >
              Đăng ký
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Đăng nhập
            </button>
          </div>

          {/* Thông báo kết quả */}
          {error && <div className="auth-alert error" role="alert">{error}</div>}
          {successMsg && <div className="auth-alert success" role="status">{successMsg}</div>}

          {/* Form ĐĂNG NHẬP (Layout đồng bộ với Sign Up) */}
          {!['login', 'signup'].includes(mode) ? (
            <div className="auth-form-section">
              <h2 className="auth-form-title">{{ 'signup-confirm': 'Xác Nhận Đăng Ký', activate: 'Xác Minh Email', forgot: 'Quên Mật Khẩu', reset: 'Đặt Lại Mật Khẩu' }[mode]}</h2>
              <p className="auth-form-subtitle">{mode === 'signup-confirm' ? `Hoàn tất đăng ký cho ${email}` : mode === 'activate' ? 'Xác minh email để tiếp tục hành trình.' : 'Bảo vệ tài khoản của bạn.'}</p>
              <form onSubmit={handleSubmit} className="auth-clean-form">
                {['activate', 'forgot'].includes(mode) && <div className="auth-field bordered"><label htmlFor="step-email">Email</label><input id="step-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}/></div>}
                {mode === 'activate' && <div className="auth-field bordered"><label htmlFor="step-otp">Mã OTP</label><input id="step-otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))} onPaste={event => { event.preventDefault(); setOtp(event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)); }}/></div>}
                {mode === 'reset' && <div className="auth-field bordered"><label htmlFor="reset-password">Mật khẩu mới</label><input id="reset-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={15} maxLength={128} value={password} onChange={event => setPassword(event.target.value)}/></div>}
                {mode === 'reset' && <div className="auth-field bordered"><label htmlFor="confirm-password">Nhập lại mật khẩu</label><input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={15} maxLength={128} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)}/></div>}
                {mode === 'signup-confirm' && <Captcha revision={captchaRevision} onChange={setCaptchaToken}/>}
                {mode === 'reset' && !searchParams.get('token') && <div className="auth-alert error" role="alert">Liên kết thiếu token. Vui lòng yêu cầu liên kết mới.</div>}
                <button type="submit" className="auth-start-btn" disabled={pending || (mode === 'reset' && !searchParams.get('token'))}>{pending ? 'Đang xử lý…' : mode === 'activate' ? 'Xác minh email' : mode === 'signup-confirm' ? 'Đăng ký và nhận OTP' : 'Tiếp tục'}</button>
              </form>
              {mode === 'activate' && <button type="button" className="auth-open-btn" disabled={pending || seconds > 0 || !email.trim()} onClick={event => handleSubmit(event, true)}>{seconds ? `Gửi lại OTP sau ${seconds}s` : 'Gửi lại OTP'}</button>}
              <div className="auth-back-home"><button type="button" className="auth-forgot-link" onClick={() => handleTabSwitch(mode === 'signup-confirm' ? 'signup' : 'login')}>← {mode === 'signup-confirm' ? 'Chỉnh sửa thông tin' : 'Quay lại đăng nhập'}</button></div>
            </div>
          ) : mode === 'login' ? (
            <div className="auth-form-section">
              <h2 className="auth-form-title">Chào Mừng Trở Lại</h2>
              <p className="auth-form-subtitle">Đăng nhập nhanh với tài khoản liên kết</p>

              {/* Nút mạng xã hội với Google Color chính hãng */}
              <div className="auth-open-accounts">
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng nhập bằng Apple"
                  onClick={unavailableSocialLogin}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.03-1.89.57-2.5 1.28-.55.63-.99 1.66-.86 2.63.95.07 1.89-.47 2.48-1.19z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng nhập bằng Google"
                  onClick={unavailableSocialLogin}
                >
                  {/* Google Color Vector Icon (@lobehub/icons standard) */}
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng nhập bằng X"
                  onClick={unavailableSocialLogin}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>

              <div className="auth-divider subtle">
                <span>hoặc</span>
              </div>

              <form onSubmit={handleSubmit} className="auth-clean-form">
                <div className="auth-field bordered">
                  <label htmlFor="login-identity">Email hoặc Tên tài khoản</label>
                  <input
                    id="login-identity"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="elitrecker@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="auth-field bordered">
                  <label htmlFor="login-pass">Mật khẩu</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="login-pass"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      maxLength={128}
                      minLength={mode === 'signup' ? 15 : undefined}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? (
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
                  <div className="auth-forgot-row">
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        handleTabSwitch('forgot');
                      }}
                      className="auth-forgot-link"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                </div>

                <div className="auth-checkbox-row">
                  <label className="auth-custom-checkbox dark">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="auth-checkmark"></span>
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                {mode === 'login' && captchaRequired && <Captcha revision={captchaRevision} onChange={setCaptchaToken}/>}
                <button type="submit" className="auth-start-btn" disabled={pending}>
                  {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </button>
              </form>
            </div>
          ) : (
            /* Form ĐĂNG KÝ (Layout Image 1) */
            <div className="auth-form-section">
              <h2 className="auth-form-title">Bắt Đầu Hành Trình</h2>
              <p className="auth-form-subtitle">Đăng ký nhanh với tài khoản liên kết</p>

              {/* Nút mạng xã hội với Google Color */}
              <div className="auth-open-accounts">
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng ký bằng Apple"
                  onClick={unavailableSocialLogin}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.03-1.89.57-2.5 1.28-.55.63-.99 1.66-.86 2.63.95.07 1.89-.47 2.48-1.19z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng ký bằng Google"
                  onClick={unavailableSocialLogin}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng ký bằng X"
                  onClick={unavailableSocialLogin}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>

              <div className="auth-divider subtle">
                <span>hoặc</span>
              </div>

              <form onSubmit={handleSubmit} className="auth-clean-form">
                <div className="auth-field bordered">
                  <label htmlFor="signup-username">Tên người dùng</label>
                  <input
                    id="signup-username"
                    type="text"
                    required
                    placeholder="eli_trekker"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="auth-field bordered">
                  <label htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="elitrecker@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="auth-field bordered">
                  <label htmlFor="signup-password">Mật khẩu</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      maxLength={128}
                      minLength={mode === 'signup' ? 15 : undefined}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? (
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
                  <label htmlFor="signup-confirm-password">Nhập lại mật khẩu</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      maxLength={128}
                      minLength={mode === 'signup' ? 15 : undefined}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiển thị mật khẩu nhập lại'}
                    >
                      {showPassword ? (
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

                <div className="auth-checkbox-row">
                  <label className="auth-custom-checkbox dark">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="auth-checkmark"></span>
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <button type="submit" className="auth-start-btn" disabled={pending}>
                  {pending ? 'Đang tạo tài khoản…' : 'Bắt đầu ngay'}
                </button>
              </form>
            </div>
          )}

          <div className="auth-back-home">
            <Link to="/">← Trở về trang chủ</Link>
          </div>
        </div>

        {/* Cột phải: Banner hình ảnh lượn sóng & Carousel tự động chuyển ảnh mỗi 5s */}
        <div className="auth-right-column">
          <div className="auth-banner-container">
            {/* Danh sách ảnh món ăn tự động đổi sau mỗi 5 giây */}
            {SLIDES.map((slide, i) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                className={`auth-banner-image ${i === slideIndex ? 'active' : ''}`}
                loading="eager"
                onError={(event) => {
                  if (event.currentTarget.getAttribute('src') !== '/images/editorial-dining.jpg') {
                    event.currentTarget.src = '/images/editorial-dining.jpg';
                  }
                }}
              />
            ))}

            {/* Vệt cắt lượn sóng hữu cơ ở góc trên-trái và dưới-phải */}
            <svg
              className="auth-wave-corner-tl"
              viewBox="0 0 110 80"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 0 0 L 110 0 C 85 0 76 18 58 18 C 42 18 36 40 20 40 C 8 40 0 58 0 80 L 0 0 Z"
                fill="#ffffff"
              />
            </svg>

            <svg
              className="auth-wave-corner-br"
              viewBox="0 0 110 80"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 110 80 L 0 80 C 25 80 34 62 52 62 C 68 62 74 40 90 40 C 102 40 110 22 110 0 L 110 80 Z"
                fill="#ffffff"
              />
            </svg>

            {/* Thẻ nổi góc trên-phải (kích thước nhỏ gọn, tinh tế) */}
            <div className="auth-floating-card">
              <div className="auth-floating-card-top">
                <h4 className="auth-floating-title">{currentSlide.title}</h4>
                <span className="auth-heart-badge" aria-label="Yêu thích">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </span>
              </div>
              <p className="auth-floating-desc">{currentSlide.desc}</p>
              <div className="auth-floating-action">
                <button
                  type="button"
                  className="auth-card-arrow-btn"
                  aria-label="Khám phá ngay"
                  onClick={() => navigate('/dishes')}
                >
                  <span>›</span>
                </button>
              </div>
            </div>

            {/* Khối chữ & chỉ báo slide tự động chuyển (đã xóa 2 nút bấm mũi tên) */}
            <div className="auth-banner-bottom">
              <div className="auth-carousel-dots" aria-label="Chỉ báo ảnh tự động">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`auth-carousel-dot ${i === slideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Chuyển đến ảnh ${i + 1}`}
                  />
                ))}
              </div>

              <div className="auth-banner-tagline">
                <h3 dangerouslySetInnerHTML={{ __html: currentSlide.tagline }} />
                <div
                  className="auth-pill-link"
                  onClick={() => navigate('/dishes')}
                  role="button"
                  tabIndex="0"
                >
                  <span>{currentSlide.pill}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
