import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import './auth.css';

const SLIDES = [
  {
    image: '/images/login.jpg',
    title: 'Khám Phá Hương Vị, Theo Cách Của Bạn!',
    desc: 'Trải nghiệm tinh hoa ẩm thực Sài Gòn theo phong cách riêng của bạn với những món ngon và điểm đến khó quên.',
    tagline: 'Khám Phá Thế Giới Ẩm Thực,<br />Vượt Mọi Giới Hạn!',
    pill: 'Bắt đầu hành trình hôm nay!',
  },
  {
    image: '/images/auth-seafood.jpg',
    title: 'Hải Sản Nướng Tổng Hợp Miền Biển',
    desc: 'Thưởng thức đĩa hải sản nướng thơm lừng đậm đà hương vị biển cả cùng nước chấm thảo mộc đặc sắc.',
    tagline: 'Tinh Hoa Hải Vị Biển Xanh,<br />Đậm Đà Khó Quên!',
    pill: 'Khám phá món hải sản!',
  },
  {
    image: '/images/auth-salmon.jpg',
    title: 'Cá Hồi Áp Chảo Thượng Hạng',
    desc: 'Cá hồi áp chảo mềm ngọt hòa quyện sốt bơ chanh béo ngậy, dùng kèm măng tây tươi giòn thanh mát.',
    tagline: 'Mỗi Bữa Ăn Là Một<br />Khoảnh Khắc Đáng Nhớ!',
    pill: 'Xem món cá hồi đặc biệt!',
  },
  {
    image: '/images/auth-clams.jpg',
    title: 'Nghêu Hấp Chanh Sả Thanh Mát',
    desc: 'Nghêu biển tươi roi rói hòa trong nước dùng thơm lừng vị sả, ớt tươi và lá chanh ấm nồng.',
    tagline: 'Hương Vị Thiên Nhiên,<br />Khơi Nguồn Cảm Hứng!',
    pill: 'Khám phá thực đơn biển!',
  },
];

export function AuthPage({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [username, setUsername] = useState('eli_trekker');
  const [email, setEmail] = useState('elitrecker@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tự động chuyển ảnh mỗi 5 giây
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const redirectPath = searchParams.get('redirect') || '/dishes';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setPending(true);

    try {
      const actualEmail = (email === 'example@email.com' || !email) ? 'elitrecker@gmail.com' : email;
      const actualPassword = password === '••••••••' ? 'password123' : password;

      if (mode === 'login') {
        await login({ email: actualEmail, password: actualPassword, remember: rememberMe });
        setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
      } else {
        await register({
          username: username || 'eli_trekker',
          email: actualEmail,
          password: actualPassword,
          remember: rememberMe,
        });
        setSuccessMsg('Đăng ký thành công! Đang chuyển đến thực đơn món ăn...');
      }

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setPending(false);
    }
  };

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    if (newMode === 'login') {
      setEmail('elitrecker@gmail.com');
      setPassword('••••••••');
    } else {
      setUsername('eli_trekker');
      setEmail('elitrecker@gmail.com');
      setPassword('••••••••');
    }
  };

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
          {mode === 'login' ? (
            <div className="auth-form-section">
              <h2 className="auth-form-title">Chào Mừng Trở Lại</h2>
              <p className="auth-form-subtitle">Đăng nhập nhanh với tài khoản liên kết</p>

              {/* Nút mạng xã hội với Google Color chính hãng */}
              <div className="auth-open-accounts">
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng nhập bằng Apple"
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.03-1.89.57-2.5 1.28-.55.63-.99 1.66-.86 2.63.95.07 1.89-.47 2.48-1.19z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng nhập bằng Google"
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
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
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
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
                    type="text"
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
                        alert('Tài khoản demo: elitrecker@gmail.com / mật khẩu: password123');
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
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.03-1.89.57-2.5 1.28-.55.63-.99 1.66-.86 2.63.95.07 1.89-.47 2.48-1.19z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="auth-open-btn"
                  aria-label="Đăng ký bằng Google"
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
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
                  onClick={() => handleSubmit({ preventDefault: () => {} })}
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
                  if (event.currentTarget.getAttribute('src') !== '/images/login.jpg') {
                    event.currentTarget.src = '/images/login.jpg';
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
