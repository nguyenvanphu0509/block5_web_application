(() => {
  for (const button of document.querySelectorAll('[data-toggle-password]')) {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-label', visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      button.setAttribute('aria-pressed', String(visible));
      button.querySelector('[data-eye-slash]').toggleAttribute('hidden', visible);
    });
  }
  for (const form of document.querySelectorAll('[data-auth-form]')) {
    form.addEventListener('submit', event => {
      if (form.dataset.submitting) { event.preventDefault(); return; }
      form.dataset.submitting = 'true';
      const button = form.querySelector('[type=submit]');
      button.disabled = true;
      button.textContent = 'Đang xử lý…';
    });
  }
  for (const input of document.querySelectorAll('[name=otp]')) {
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); });
    input.addEventListener('paste', event => {
      event.preventDefault();
      input.value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    });
  }
  for (const button of document.querySelectorAll('[data-resend-until]')) {
    const update = () => {
      if (button.form.dataset.submitting) return;
      const seconds = Math.max(0, Math.ceil((Number(button.dataset.resendUntil) - Date.now()) / 1000));
      button.disabled = seconds > 0;
      button.textContent = seconds ? `Gửi lại OTP sau ${seconds}s` : 'Gửi lại OTP';
    };
    update();
    setInterval(update, 1000);
  }
  // A restored page must obtain a fresh CAPTCHA instead of replaying an old POST.
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  const banners = [...document.querySelectorAll('.auth-banner-image')];
  let slide = 0;
  if (banners.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      const next = banners.findIndex((_, offset) => {
        const index = (slide + offset + 1) % banners.length;
        return banners[index].complete && banners[index].naturalWidth > 0;
      });
      if (next === -1) return;
      banners[slide].classList.remove('active');
      slide = (slide + next + 1) % banners.length;
      banners[slide].classList.add('active');
    }, 5000);
  }
})();
