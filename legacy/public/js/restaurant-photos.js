function attachRestaurantPhotoFallbacks(root = document) {
root.querySelectorAll('.restaurant-space img').forEach(image => {
  if (image.dataset.photoFallback) return;
  image.dataset.photoFallback = 'true';
  function showFallback() {
    image.src = '/images/restaurant.svg';
    image.alt = 'Ảnh không gian quán đang cập nhật';
  }
  image.addEventListener('error', showFallback, { once: true });
  if (image.complete && image.naturalWidth === 0) showFallback();
});
}
attachRestaurantPhotoFallbacks();
document.addEventListener('home:updated', event => attachRestaurantPhotoFallbacks(event.detail.section));
