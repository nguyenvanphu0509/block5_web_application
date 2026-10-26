const imageEditor = document.querySelector('[data-image-editor]');
if (imageEditor) {
  const urlInput = imageEditor.querySelector('#imagePath');
  const fileInput = imageEditor.querySelector('#imageFile');
  const preview = imageEditor.querySelector('[data-image-preview]');
  const feedback = imageEditor.querySelector('[data-image-feedback]');
  const origins = JSON.parse(imageEditor.dataset.origins);
  const current = imageEditor.dataset.current;
  const fallback = imageEditor.dataset.fallback;
  let objectUrl;
  let timer;
  function releaseFile() { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; }
  function show(src, message = '', invalid = false) {
    preview.src = src;
    feedback.textContent = message;
    feedback.classList.toggle('is-error', invalid);
  }
  function updatePreview() {
    releaseFile();
    if (fileInput.disabled) {
      const value = urlInput.value.trim();
      if (!value) { urlInput.setCustomValidity(''); show(current); return; }
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.port || (!origins.includes(url.origin) && !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname))) throw new Error();
        urlInput.setCustomValidity('');
        show(url.href, 'Đang xem trước ảnh từ đường dẫn…');
      } catch {
        const message = 'Cần URL HTTPS từ nguồn ảnh được cho phép, ví dụ Unsplash hoặc Supabase.';
        urlInput.setCustomValidity(message);
        show(current, message, true);
      }
    } else {
      const file = fileInput.files[0];
      if (!file) { fileInput.setCustomValidity(''); show(current); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        const message = 'Chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.';
        fileInput.setCustomValidity(message);
        show(current, message, true);
        return;
      }
      fileInput.setCustomValidity('');
      objectUrl = URL.createObjectURL(file);
      show(objectUrl, `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }
  }
  function selectMethod() {
    clearTimeout(timer);
    const isFile = imageEditor.querySelector('input[name="imageMode"]:checked').value === 'file';
    urlInput.disabled = isFile;
    fileInput.disabled = !isFile;
    urlInput.setCustomValidity(''); fileInput.setCustomValidity('');
    updatePreview();
  }
  imageEditor.querySelectorAll('[name="imageMode"]').forEach(input => input.addEventListener('change', selectMethod));
  urlInput.addEventListener('input', () => { clearTimeout(timer); urlInput.setCustomValidity(''); timer = setTimeout(updatePreview, 350); });
  urlInput.addEventListener('change', () => { clearTimeout(timer); updatePreview(); });
  fileInput.addEventListener('change', updatePreview);
  preview.addEventListener('error', () => {
    if (preview.getAttribute('src') === fallback) return;
    preview.src = fallback;
    feedback.textContent = 'Không tải được ảnh. Kiểm tra đường dẫn hoặc chọn ảnh khác.';
    feedback.classList.add('is-error');
  });
  preview.addEventListener('load', () => {
    if (feedback.textContent === 'Đang xem trước ảnh từ đường dẫn…') feedback.textContent = 'Ảnh đã sẵn sàng để xem trước.';
  });
  window.addEventListener('pagehide', releaseFile);
  selectMethod();
}
