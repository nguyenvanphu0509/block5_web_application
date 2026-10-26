import photos from '../../data/restaurant-space-images.json' with { type: 'json' };

const byId = new Map(photos.map(photo => [photo.id, photo]));
export function restaurantPhoto(restaurant) {
  const photo = byId.get(restaurant.id);
  if (!photo || photo.name !== restaurant.name || photo.imagePath !== restaurant.imagePath) {
    return { label: 'Ảnh quán', sourceUrl: null };
  }
  return { label: photo.isDemo ? 'Không gian minh họa · Demo' : 'Không gian quán', sourceUrl: photo.sourceUrl };
}
