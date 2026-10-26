// Chỉ mở img-src cho các nguồn ảnh cụ thể đã duyệt, giữ nguyên quyền script.
export const imageSources = [
  "'self'", 'blob:', 'https://images.unsplash.com', 'https://plus.unsplash.com',
  'https://media.istockphoto.com', 'https://prod-pics.guide.michelin.com', 'https://*.supabase.co',
  'https://cdn.hstatic.net', 'https://cdn.sbfoods.co.jp', 'https://cdn.tgdd.vn',
  'https://cdn2.fptshop.com.vn', 'https://cdnv2.tgdd.vn', 'https://file.hstatic.net',
  'https://gcs.tripi.vn', 'https://hd1.hotdeal.vn', 'https://hotel84.com',
  'https://hue.gov.vn', 'https://image.vietnamnews.vn', 'https://images.ckbk.com',
  'https://images.food52.com', 'https://images.squarespace-cdn.com', 'https://img-global.cpcdn.com',
  'https://kenh14cdn.com', 'https://khosifafood.vn', 'https://luhanhvietnam.com.vn',
  'https://product.hstatic.net', 'https://rootedfare.com', 'https://storage.googleapis.com',
  'https://tantrieutravel.com', 'https://thanhnien.mediacdn.vn', 'https://ttol.vietnamnetjsc.vn',
  'https://vietnamtravel.com', 'https://www.monngon.tv',
  // Approved restaurant photo origins (no backend data/credentials in shared code).
  "https://mia.vn",
  "https://dynamic-media-cdn.tripadvisor.com",
  "https://prod-pics.guide.michelin.com",
  "https://axwwgrkdco.cloudimg.io",
  "https://images.squarespace-cdn.com",
  "https://d1u7goitqk7klj.cloudfront.net",
  "https://hotel84.com",
  "https://pasgo.vn",
  "https://cafefcdn.com",
  "https://kenh14cdn.com",
  "https://down-vn.img.susercontent.com",
  "https://res.klook.com",
  "https://static.wixstatic.com",
  "https://media.phunumoi.net.vn",
  "https://cdn.tgdd.vn",
  "https://www.cathaypacific.com",
  "https://afamilycdn.com",
  "https://littlebearsgn.com",
  "https://images2.thanhnien.vn",
  "https://www.frasersproperty.com",
  "https://media.vov.vn",
  "https://images.unsplash.com",
].join(' ');

export function isAllowedDishImage(value) {
  try {
    if (typeof value !== 'string' || value.length > 2000) return false;
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && (imageSources.split(' ').includes(url.origin) || /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname));
  } catch { return false; }
}
