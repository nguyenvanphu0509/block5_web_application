import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { DishCard, External, money, dateLabel, Pager, Picture, RestaurantPrice, StateView } from '../components.jsx';
import { resources } from '../../../shared/resources.js';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [searchReset, setSearchReset] = useState(0);
  const searchSection = useRef(null);
  const [showSearchShortcut, setShowSearchShortcut] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setShowSearchShortcut(entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(searchSection.current);
    return () => observer.disconnect();
  }, []);
  const returnToSearch = () => {
    searchSection.current.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    searchSection.current.querySelector('input[type="search"]')?.focus({ preventScroll: true });
  };
  const config = useLoad('catalog-config', signal => api('/config', { signal }));
  const view = ['pages', 'more', 'infinite'].includes(params.get('view')) ? params.get('view') : 'pages';
  const searchFields = ['q', 'mode', 'category', 'minPrice', 'maxPrice', 'available'];
  const searchKey = JSON.stringify(searchFields.map(field => params.get(field) || ''));
  useEffect(() => {
    if (view !== 'pages' && params.get('page') !== '1') {
      const next = new URLSearchParams(params); next.set('page', '1'); setParams(next, { replace: true });
    }
  }, [view, params, setParams]);
  const change = changes => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) v === '' || v == null ? next.delete(k) : next.set(k, v);
    next.set('page', '1'); setParams(next);
  };
  const query = new URLSearchParams(params); query.delete('view');
  if (!query.has('page') || view !== 'pages') query.set('page', '1');
  const href = changes => { const next = new URLSearchParams(params); for (const [k, v] of Object.entries(changes)) next.set(k, v); return `/dishes?${next}#menu-results`; };
  return <main id="main" tabIndex="-1" className="shell page-main">
    <div className="page-heading"><span className="section-badge">THE SAIGON TABLE</span><h1>Một thực đơn.<br/><em>Muôn vàn cảm hứng.</em></h1><p>Khám phá món ăn bằng tên, mô tả hoặc tên gần đúng.</p></div>
    <div id="dish-search-section" ref={searchSection}><CatalogSearch key={`${searchKey}:${searchReset}`} params={params} categories={categories} onSearch={change} onReset={() => { setSearchReset(value => value + 1); setParams({}); }}/></div>
    <CatalogResults key={`${view}:${query}`} query={query.toString()} view={view} href={href} onCategories={setCategories} controls={<div className="catalog-display-controls">
      <label>Hiển thị<select aria-label="Kiểu phân trang" value={view} onChange={e => change({ view: e.target.value })}><option value="pages">Số trang</option><option value="more">Tải thêm</option><option value="infinite">Cuộn vô hạn</option></select></label>
      <label>Mỗi trang<select aria-label="Món mỗi trang" value={params.get('pageSize') || '12'} onChange={e => change({ pageSize: e.target.value })}>{[...new Set([6,12,24,48,100, Number(params.get('pageSize') || 12)])].filter(n => Number.isInteger(n) && n > 0 && n <= 100).sort((a,b) => a-b).map(n => <option key={n}>{n}</option>)}</select></label>
      <label>Sắp xếp<select aria-label="Sắp xếp" value={params.get('sort') || 'default'} disabled={!config.result} onChange={e => change({ sort: e.target.value })}>{Object.entries(config.result?.data.sorts || { default: 'Mặc định' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>}/>
    <p className="source-note">Giá demo không phải giá bán xác nhận. Món có ghi “Dữ liệu demo Block 7” dùng cho bài tập.</p>
    {showSearchShortcut && <button type="button" className="button catalog-back-to-search" aria-label="Quay lại tìm món ăn" onClick={returnToSearch}><span aria-hidden="true">↑</span> Tìm món</button>}
  </main>;
}
const searchMethods = {
  basic: { label: 'Thông thường', placeholder: 'Phở bò, bún chả, bánh mì…', help: 'Tìm theo tên món. Thử “phở” để khám phá Phở bò, Phở gà.' },
  fulltext: { label: 'Toàn văn', placeholder: 'Ví dụ: phở OR bún, phở -gà…', help: 'Tìm trong tên và mô tả, hỗ trợ không dấu. Có thể nhập “nay tôi muốn ăn phở bò”. phở bò: có đủ hai từ; "phở bò": đúng cụm từ; phở OR bún: có một trong hai; phở -gà: loại món có từ gà. Sắp xếp mặc định ưu tiên khớp tên món.' },
  fuzzy: { label: 'Gần đúng', placeholder: 'Nhập tên món, kể cả khi chưa nhớ chính xác…', help: 'Tìm tên gần giống để hỗ trợ một số lỗi gõ. Ví dụ: “pho boo” có thể tìm Phở bò.' },
};
function SearchIcon({ kind, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    filter: <><path d="M3 7h5m4 0h9M3 17h9m4 0h5"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    spark: <path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[kind]}</svg>;
}
function CatalogSearch({ params, categories, onSearch, onReset }) {
  const form = useRef(null);
  // The method and filter fields remain drafts until submitted.
  const [method, setMethod] = useState(() => ['fulltext', 'fuzzy'].includes(params.get('mode')) ? params.get('mode') : 'basic');
  const [category, setCategory] = useState(params.get('category') || '');
  const allCategories = [...new Set([...categories, ...(category ? [category] : [])])];
  const preferred = ['Hải sản', 'Rượu vang', 'Ăn nhẹ', 'Bánh', 'Ẩm thực đường phố', 'Cơm'];
  const chips = [...preferred.filter(item => allCategories.includes(item)), ...allCategories.filter(item => !preferred.includes(item))].slice(0, 6);
  if (category && !chips.includes(category)) chips.splice(5, 1, category);
  const apply = (overrides = {}) => {
    if (!form.current.reportValidity()) return;
    const values = { ...Object.fromEntries(new FormData(form.current)), ...overrides };
    const filtered = ['category', 'minPrice', 'maxPrice', 'available'].some(key => values[key]?.trim());
    if (values.mode === 'basic' && filtered) values.mode = 'advanced';
    onSearch(values);
  };
  return <form ref={form} onSubmit={event => { event.preventDefault(); apply(); }} className="catalog-search" role="search" aria-label="Tìm kiếm món ăn">
    <div className="catalog-search-heading"><div><p className="catalog-search-eyebrow">Một chút cảm hứng cho bữa ăn</p><h2>Hôm nay, bạn muốn ăn gì?</h2></div><span className="catalog-search-spark"><SearchIcon kind="spark"/></span></div>
    <div className="catalog-search-row">
      <label className="catalog-keyword" htmlFor="dish-search"><span className="catalog-sr-only">Từ khóa</span><SearchIcon kind="search"/><input id="dish-search" name="q" type="search" aria-label="Tìm món ăn" aria-describedby="search-method-help" maxLength="120" defaultValue={params.get('q') || ''} placeholder={searchMethods[method].placeholder}/></label>
      <label className="catalog-method" htmlFor="search-method"><span>Cách tìm</span><select id="search-method" name="mode" aria-label="Cách tìm" value={method} onChange={event => setMethod(event.target.value)}>{Object.entries(searchMethods).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select><SearchIcon kind="chevron"/></label>
      <button className="button catalog-search-submit" type="submit">Tìm món ngon<SearchIcon kind="arrow"/></button>
    </div>
    <p id="search-method-help" className="search-method-help" aria-live="polite">{searchMethods[method].help}</p>
    <div className="catalog-category-chips" role="group" aria-label="Chọn nhanh loại món">{['', ...chips].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); apply({ category: item }); }}>{item || 'Tất cả món'}</button>)}</div>
    <div className="catalog-filter-section">
      <button type="button" className="catalog-reset" onClick={onReset}>Xóa điều kiện</button>
      <details className="catalog-advanced">
        <summary><SearchIcon kind="filter"/><span>Bộ lọc nâng cao</span><SearchIcon kind="chevron"/></summary>
        <div className="catalog-filter-panel">
          <div className="catalog-filter-fields">
            <label>Loại món<select name="category" aria-label="Loại món" value={category} onChange={event => setCategory(event.target.value)}><option value="">Tất cả loại món</option>{allCategories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Giá từ<span className="catalog-price-field"><input name="minPrice" aria-label="Giá từ" type="number" min="0" step="1" placeholder="Không giới hạn" defaultValue={params.get('minPrice') || ''}/><span aria-hidden="true">₫</span></span></label>
            <label>Giá đến<span className="catalog-price-field"><input name="maxPrice" aria-label="Giá đến" type="number" min="0" step="1" placeholder="Không giới hạn" defaultValue={params.get('maxPrice') || ''}/><span aria-hidden="true">₫</span></span></label>
            <button className="catalog-filter-apply" type="submit">Áp dụng bộ lọc</button>
          </div>
          <label className="catalog-availability">Trạng thái<select aria-label="Trạng thái" name="available" defaultValue={params.get('available') || ''}><option value="">Tất cả</option><option value="true">Đang phục vụ</option><option value="false">Tạm hết</option></select></label>
        </div>
      </details>
    </div>
  </form>;
}
function CatalogResults({ query, view, href, onCategories, controls }) {
  const [result, setResult] = useState(null), [pending, setPending] = useState(true), [error, setError] = useState(null);
  const request = useRef(null), active = useRef(true), busy = useRef(false), next = useRef(Number(new URLSearchParams(query).get('page') || 1)), ended = useRef(false), sentinel = useRef(null);
  const load = useCallback(async () => {
    if (busy.current || ended.current || !active.current) return;
    busy.current = true; setPending(true); setError(null);
    const controller = new AbortController(); request.current = controller;
    const params = new URLSearchParams(query); params.set('page', String(next.current));
    try {
      const response = await api(`/dishes?${params}`, { signal: controller.signal, auth: false });
      if (controller.signal.aborted || !active.current) return;
      const data = response.data;
      onCategories(response.meta.categories);
      ended.current = !data.items.length || data.page * data.pageSize >= data.total;
      next.current = data.page + 1;
      setResult(before => ({ ...data, items: view === 'pages' || !before ? data.items : [...new Map([...before.items, ...data.items].map(x => [x.id, x])).values()] }));
    } catch (err) { if (!controller.signal.aborted && active.current) setError(err); }
    finally { if (!controller.signal.aborted && active.current) { busy.current = false; setPending(false); } }
  }, [query, view, onCategories]);
  useEffect(() => { active.current = true; load(); return () => { active.current = false; request.current?.abort(); busy.current = false; }; }, [load]);
  useEffect(() => {
    if (view !== 'infinite' || !result || pending || error || ended.current || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(x => x.isIntersecting)) load(); }, { rootMargin: '200px 0px' });
    observer.observe(sentinel.current); return () => observer.disconnect();
  }, [view, result, pending, error, load]);
  return <section id="menu-results" aria-busy={pending}>
    <div className="catalog-results-toolbar"><p className="catalog-result-count" role="status"><span aria-hidden="true" className="catalog-count-dot"/>{result ? <><strong>{result.total}</strong> món ăn</> : pending ? 'Đang tải…' : 'Chưa tải được số món'}</p>{controls}</div>
    {result && <><p className="catalog-results-summary" role="status">Đang hiển thị {result.items.length} / <strong>{result.total} món phù hợp</strong></p><div className="dish-grid">{result.items.map(dish => <DishCard key={dish.id} dish={dish}/>)}</div>{!result.items.length && <p className="empty-state">Chưa có món phù hợp ở trang này.</p>}{view === 'pages' && <Pager page={result.page} pages={Math.max(1, Math.ceil(result.total / result.pageSize))} href={page => href({ page })}/>}</>}
    {pending && (!result || view === 'pages') && <p className="catalog-loading-status" role="status">Đang tải…</p>}
    {error && <div role="alert"><p>{error.message}</p><button className="button outline" onClick={load}>Thử lại</button></div>}
    {view !== 'pages' && result && !ended.current && !error && <button className="button outline catalog-load-more" disabled={pending} onClick={load}>{pending ? 'Đang tải…' : 'Tải thêm'}</button>}
    {view !== 'pages' && result && ended.current && <p className="catalog-loading-status" role="status">Đã tải hết kết quả.</p>}
    <div ref={sentinel} aria-hidden="true" style={{ height: 1 }}/>
  </section>;
}

export function PublicDetail({ resource }) {
  const { id } = useParams();
  const state = useLoad(`${resource}/${id}`, signal => api(`/${resource}/${id}`, { signal, auth: resource !== 'dishes' }));
  const record = state.result?.data;
  return <main id="main" tabIndex="-1" className="shell page-main"><Link className="back-link" to={resource === 'restaurants' ? '/#destinations' : '/dishes'}>← Trở lại khám phá</Link><StateView state={state}/>{record && (resource === 'dishes' ? <div className="dish-detail"><figure className="detail-image image-fallback"><Picture src={record.imagePath} alt={record.name} width="600" height="600"/><figcaption>{record.photoType || 'Ảnh minh họa'}</figcaption></figure><section><span className="section-badge">{record.category || 'Ẩm thực Việt'}</span><h1>{record.name}</h1>{record.restaurant && <Link to={`/restaurants/${record.restaurant.id}`}>Tại {record.restaurant.name} ↗</Link>}<p className="detail-description">{record.description || 'Chưa có mô tả cho món này.'}</p><p className="detail-price">{money(record.price)} <small>{record.priceIsDemo ? 'GIÁ DEMO' : record.price == null ? 'GIÁ CHƯA XÁC NHẬN' : 'GIÁ THAM KHẢO'}</small></p><span className={`availability ${record.available ? '' : 'unavailable'}`}>{record.available ? 'Đang phục vụ' : 'Tạm hết'}</span><div className="recipe-info"><h2>Đầu bếp & nguyên liệu</h2><p>{record.chef ? <Link to={`/chefs/${record.chef.id}`}>{record.chef.name}</Link> : 'Chưa gắn đầu bếp.'}</p><ul className="ingredient-tags">{record.ingredients?.map(link => <li key={link.ingredientId}><Link to={`/dishes?ingredientId=${link.ingredientId}`}>{link.ingredient.name} ({link.ingredient.unit})</Link></li>)}</ul>{!record.ingredients?.length && <p>Chưa có nguyên liệu.</p>}{record.recipeIsDemo && <p className="source-note">Đầu bếp / công thức là gợi ý demo.</p>}</div><dl className="record-meta"><div><dt>Mã món</dt><dd>#{record.id}</dd></div><div><dt>Ngày tạo</dt><dd>{dateLabel(record.createdAt)}</dd></div></dl><External href={record.michelinUrl}>Nguồn Michelin ↗</External></section></div> : resource === 'restaurants' ? <><div className="dish-detail"><figure className="detail-image restaurant-space"><Picture src={record.imagePath} fallback="/images/restaurant.svg" alt={record.name} width="600" height="600"/><figcaption>{record.photo?.label}</figcaption></figure><section><span className="section-badge">{record.cuisine}</span><h1>{record.name}</h1>{record.isDemo && <p className="source-note">Quán hư cấu cho bài tập.</p>}<p>{record.address || 'Địa chỉ đang cập nhật'}</p><p>{record.ward} · {record.district}</p><p className="detail-price"><RestaurantPrice record={record}/><small>KHOẢNG GIÁ CỦA QUÁN</small></p><p>Món nổi bật: {record.notableDishes?.join(' · ') || 'Đang cập nhật'}</p><External href={record.photo?.sourceUrl}>Nguồn ảnh không gian ↗</External><p><External href={record.michelinUrl} className="button outline">Xem hồ sơ Michelin ↗</External></p></section></div><div className="section-heading"><h2>Món ăn tại <em>quán</em></h2></div>{!record.dishes?.length && <p className="empty-state">Thực đơn đang cập nhật.</p>}<div className="dish-grid">{record.dishes?.map(dish => <DishCard key={dish.id} dish={dish}/>)}</div></> : <section className="form-card"><h1>{record.name}</h1>{resources[resource].fields.map(([field, label]) => <p key={field}>{label}: {record[field] || '—'}</p>)}{record.isDemo && <p>Dữ liệu demo</p>}<Link to={`/dishes?${resource === 'chefs' ? 'chefId' : 'ingredientId'}=${record.id}`}>Xem các món liên quan ↗</Link></section>)}</main>;
}
