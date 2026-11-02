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
  for (const box of document.querySelectorAll('[data-captcha]')) {
    const form = box.closest('form');
    const image = box.querySelector('img');
    const input = box.querySelector('[name=captcha]');
    const id = box.querySelector('[name=challengeId]');
    const refreshButton = box.querySelector('[data-refresh-captcha]');
    const submitButton = form.querySelector('[type=submit]');
    const status = box.querySelector('[data-captcha-status]');
    let loading = false;
    async function refresh() {
      if (loading || form.dataset.submitting) return;
      loading = true;
      submitButton.disabled = true;
      refreshButton.disabled = true;
      input.disabled = true;
      id.value = '';
      image.removeAttribute('src');
      status.textContent = 'Đang tải mã xác nhận…';
      try {
        const response = await fetch(`/captcha?purpose=${box.dataset.captcha}`, {cache:'no-store'});
        if (!response.ok) throw new Error();
        const data = await response.json();
        // Keep the displayed image and challenge ID in sync, including slow networks.
        const loaded = new Image();
        loaded.src = data.imageUrl;
        await loaded.decode();
        image.src = loaded.src;
        id.value = data.id;
        input.value = '';
        input.disabled = false;
        submitButton.disabled = false;
        status.textContent = 'Nhập 6 ký tự trong ảnh. Mã có hiệu lực 2 phút, dùng một lần.';
      } catch {
        status.textContent = 'Không tải được mã. Bấm “Đổi mã” để thử lại.';
      } finally {
        loading = false;
        refreshButton.disabled = false;
      }
    }
    refreshButton.addEventListener('click', refresh);
    refresh();
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
