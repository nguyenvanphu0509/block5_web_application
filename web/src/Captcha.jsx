import { useEffect, useRef, useState } from 'react';

export function Captcha({ onChange, revision }) {
  const container = useRef(null), callback = useRef(onChange);
  callback.current = onChange;
  const [error, setError] = useState('');
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  useEffect(() => {
    if (!siteKey) return;
    let active = true, widget;
    const render = () => {
      if (!active) return;
      window.grecaptcha.ready(() => {
        if (!active) return;
        widget = window.grecaptcha.render(container.current, {
          sitekey: siteKey, callback: token => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => { callback.current(''); setError('Không tải được CAPTCHA. Vui lòng thử lại.'); },
        });
      });
    };
    let script = document.querySelector('script[data-spa-captcha]');
    if (window.grecaptcha?.render) render();
    else {
      if (!script) {
        script = document.createElement('script'); script.dataset.spaCaptcha = 'true';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'; script.async = true;
        document.head.append(script);
      }
      script.addEventListener('load', render);
    }
    const failed = () => setError('Không tải được CAPTCHA. Vui lòng tải lại trang.');
    script?.addEventListener('error', failed);
    return () => {
      active = false; script?.removeEventListener('load', render); script?.removeEventListener('error', failed);
      if (widget !== undefined) window.grecaptcha?.reset(widget);
    };
  }, [siteKey, revision]);
  if (!siteKey) return <p role="alert">Chưa cấu hình CAPTCHA. Vui lòng liên hệ quản trị viên.</p>;
  return <><div key={revision} ref={container}/>{error && <p role="alert">{error}</p>}</>;
}
