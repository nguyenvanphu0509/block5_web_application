import { Link } from 'react-router-dom';
import { Fragment, useEffect, useRef, useState } from 'react';
import { resources } from '../../shared/resources.js';

export const money = value => value == null ? 'Hỏi quán' : `${Number(value).toLocaleString('vi-VN')} ₫`;
export const dateLabel = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
export function RestaurantPrice({ record }) { const { priceMinVnd: min, priceMaxVnd: max } = record; return <>{min == null && max == null ? 'Hỏi quán' : max == null ? `Từ ${money(min)}` : min === 0 ? `Dưới ${money(max)}` : `${money(min)} – ${money(max)}`}</>; }
export function External({ href, children, ...props }) { return href ? <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a> : null; }
export function Picture({ src, alt, fallback = '/images/noodles.svg', ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img src={failed || !src ? fallback : src} alt={alt} onError={() => setFailed(true)} {...props} />;
}
export function StateView({ state }) {
  if (state.status === 'ok') return null;
  return <div className="empty-state" role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
    <h2>{state.status === 'loading' ? 'Đang tải…' : state.status === 'notFound' ? 'Không tìm thấy bản ghi' : 'Không thể tải dữ liệu'}</h2>
    {state.error && <p>{state.error.message}</p>}
    {state.status === 'error' && <button className="button outline" onClick={state.retry}>Thử lại</button>}
    {state.status === 'notFound' && <Link className="button outline" to="/dishes">Về thực đơn</Link>}
  </div>;
}
export function AdminNav() { return <nav className="admin-nav" aria-label="Quản trị">{Object.entries(resources).map(([key, x]) => <Link key={key} to={`/admin/${key}`}>{x.label}</Link>)}</nav>; }
export function FieldError({ name, errors }) { return errors?.[name] ? <p id={`${name}-error`} className="field-error" role="alert">{errors[name]}</p> : null; }
export function DishCard({ dish }) { return <article className="dish-card"><Link className="dish-image image-fallback" to={`/dishes/${dish.id}`}><Picture src={dish.imagePath} alt={dish.name} width="600" height="600" loading="lazy"/><span className="image-arrow">↗</span></Link><div className="dish-card-content"><div className="eyebrow">{dish.category || 'Ẩm thực Việt'}</div><h2><Link to={`/dishes/${dish.id}`}>{dish.name}</Link></h2>{dish.restaurant && <p className="dish-restaurant"><Link to={`/restaurants/${dish.restaurant.id}`}>{dish.restaurant.name} ↗</Link>{dish.restaurant.district && ` · ${dish.restaurant.district}`}</p>}<p className="card-description">{dish.description || 'Một hương vị đang chờ khám phá.'}</p><div className="card-bottom"><strong>{money(dish.price)} {dish.priceIsDemo && <small className="demo-price">Giá demo</small>}</strong><span className={`availability ${dish.available ? '' : 'unavailable'}`}><span className="status-dot"/>{dish.available ? 'Đang phục vụ' : 'Tạm hết'}</span></div></div></article>; }
export function RestaurantCard({ restaurant: x }) { return <article className="restaurant-card"><Link className="restaurant-image image-fallback restaurant-space" to={`/restaurants/${x.id}`}><Picture src={x.imagePath} alt={`Không gian ${x.name}`} fallback="/images/restaurant.svg" width="500" height="500" loading="lazy"/><span className="photo-badge">{x.photo?.label || 'Ảnh quán'}</span><span className="image-arrow">↗</span></Link><div className="restaurant-content"><div className="eyebrow">{x.cuisine}{x.isDemo && ' · Demo'}</div><h3><Link to={`/restaurants/${x.id}`}>{x.name}</Link></h3><p className="restaurant-address">{x.address || 'Địa chỉ đang cập nhật'}</p><p className="restaurant-area">{x.district}</p><p className="restaurant-specialties">{x.notableDishes?.join(' · ')}</p><External href={x.photo?.sourceUrl} className="restaurant-photo-credit">Nguồn ảnh không gian ↗</External><div className="restaurant-bottom"><span><RestaurantPrice record={x}/></span><External href={x.michelinUrl}>MICHELIN ↗</External></div></div></article>; }
export function Pager({ page = 1, pages = 1, href, label = 'Phân trang' }) {
  const numbers = pages <= 12 ? Array.from({ length: pages }, (_, i) => i + 1) : [...new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2])].filter(x => x > 0 && x <= pages).sort((a, b) => a - b);
  return <nav className="pagination menu-pagination" aria-label={label}>{page > 1 && <Link aria-label="Trang trước" className="circle-button" to={href(Math.min(page - 1, pages))}>←</Link>}{numbers.map((n, i) => <Fragment key={n}>{i > 0 && n - numbers[i - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}<Link className={`circle-button ${n === page ? 'active' : ''}`} aria-current={n === page ? 'page' : undefined} aria-label={`Trang ${n}`} to={href(n)}>{n}</Link></Fragment>)}{page < pages && <Link aria-label="Trang tiếp" className="circle-button" to={href(page + 1)}>→</Link>}<span>Trang {page} / {pages}</span></nav>;
}
export function SortDialog({ sorts, current, href }) {
  const dialog = useRef(null), trigger = useRef(null);
  return <><button className="menu-options-trigger" ref={trigger} aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>Sắp xếp ↗</button><dialog ref={dialog} className="dish-options-dialog" aria-labelledby="sort-title" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}><div className="dish-options-header"><h2 id="sort-title">Khám phá theo cách bạn muốn</h2><button className="circle-button" aria-label="Đóng tùy chọn món ăn" autoFocus onClick={() => dialog.current.close()}>×</button></div><nav className="dish-sort-options" aria-label="Cách sắp xếp món ăn">{Object.entries(sorts).map(([key, label]) => <Link key={key} className={`dish-sort-option ${key === current ? 'active' : ''}`} to={href(key)} onClick={() => dialog.current.close()}>{label} ↗</Link>)}</nav><Link to="/dishes" onClick={() => dialog.current.close()}>Bỏ bộ lọc</Link></dialog></>;
}
