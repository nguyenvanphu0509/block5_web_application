import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { useAuth } from '../AuthContext.jsx';
import { Pager, Picture, RestaurantCard, StateView } from '../components.jsx';

function RestaurantSearch({ initial, onSearch }) {
  const [text, setText] = useState(initial), [suggestions, setSuggestions] = useState([]), [active, setActive] = useState(-1), [suggestionPending, setSuggestionPending] = useState(false);
  useEffect(() => {
    if (!text.trim() || text === initial) { setSuggestions([]); setSuggestionPending(false); return; }
    const controller = new AbortController();
    setSuggestionPending(true);
    const timer = setTimeout(() => api(`/restaurants/suggestions?q=${encodeURIComponent(text)}`, { signal: controller.signal }).then(x => { if (!controller.signal.aborted) { setSuggestions(x.data); setActive(-1); } }).catch(() => { if (!controller.signal.aborted) setSuggestions([]); }).finally(() => { if (!controller.signal.aborted) setSuggestionPending(false); }), 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [text, initial]);
  const choose = value => { setText(value); setSuggestions([]); onSearch(value); };
  return <><form className="search-form" onSubmit={event => { event.preventDefault(); choose(active >= 0 && suggestions[active] ? suggestions[active].name : text); }}><label className="sr-only" htmlFor="destination-search">Tìm quán ăn, khu vực hoặc món nổi bật</label><input id="destination-search" maxLength="120" placeholder="Tên quán, quận hoặc món ăn…" value={text} role="combobox" aria-autocomplete="list" aria-expanded={!!suggestions.length} aria-controls="restaurant-suggestions" aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined} onChange={e => setText(e.target.value)} onKeyDown={e => {
    if (e.key === 'Escape') { setSuggestions([]); setActive(-1); }
    if (e.key === 'ArrowDown' && suggestions.length) { e.preventDefault(); setActive(x => (x + 1) % suggestions.length); }
    if (e.key === 'ArrowUp' && suggestions.length) { e.preventDefault(); setActive(x => (x - 1 + suggestions.length) % suggestions.length); }
  }}/><button className="button small">Tìm quán ăn ↗</button></form>{suggestionPending && <p className="suggestion-loading" role="status">Đang tải…</p>}{suggestions.length > 0 && <ul id="restaurant-suggestions" className="suggestions" role="listbox">{suggestions.map((x, i) => <li key={x.id} id={`suggestion-${i}`} role="option" aria-selected={i === active}><button type="button" onClick={() => choose(x.name)}>{x.name} · {x.district}</button></li>)}</ul>}</>;
}

export function Home() {
  const { isAuthenticated } = useAuth();
  const dishesLink = isAuthenticated ? '/dishes' : '/login?redirect=/dishes';
  const [params, setParams] = useSearchParams();
  const state = useLoad(params.toString(), signal => api(`/home?${params}`, { signal }));
  const previousData = useRef(null);
  useEffect(() => {
    if (state.result?.data) previousData.current = state.result.data;
  }, [state.result]);
  const data = state.result?.data || (state.status === 'loading' ? previousData.current : null);
  const refreshing = state.status === 'loading' && !!data;
  const href = (changes, anchor) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(changes)) next.set(key, value); return `/?${next}#${anchor}`; };
  const search = value => { const next = new URLSearchParams(params); next.set('destinationQ', value); next.set('destinationPage', '1'); setParams(next); };

  return <main id="main" tabIndex="-1">
    {refreshing && <p className="sr-only" role="status">Đang tải nội dung…</p>}
    
    {/* HERO SECTION */}
    <section className="hero">
      <div className="hero-landscape landscape">
        <Picture src="/images/banner.jpg" fallback="/Banner.jpeg" alt="SEACLUB Seafood Restaurant & Wine" width="2200" height="1200"/>
      </div>
      <div className="hero-content shell">
        {/* Floating artisanal decorations matching Appetito sample */}
        <div className="hero-fresh-badge" aria-hidden="true">
          <span className="badge-so">SO</span>
          <span className="badge-fresh">FRESH</span>
        </div>
        <div className="hero-lemon-slice" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" fill="#F4A261" stroke="#E9C46A" strokeWidth="4"/>
            <circle cx="50" cy="50" r="37" fill="#FFFDF8"/>
            <path d="M50 16 L50 48 M50 84 L50 52 M16 50 L48 50 M84 50 L52 50 M26 26 L48 48 M74 74 L52 52 M26 74 L48 52 M74 26 L52 48" stroke="#E9C46A" strokeWidth="3"/>
          </svg>
        </div>

        <div className="hero-tag">
          <span className="country-pill"><span className="flag">★</span> VIỆT NAM · SÀI GÒN</span>
          <span className="italic">Hương vị Việt</span>
        </div>

        {/* 3 Featured Dishes - Center photo styled as circular ceramic dish plate */}
        <div className="hero-photo-group" aria-label="Ba món ăn nổi bật">
          {Array.from({ length: 3 }, (_, i) => {
            const dish = data?.featured[i];
            const target = dish ? (isAuthenticated ? `/dishes/${dish.id}` : `/login?redirect=${encodeURIComponent(`/dishes/${dish.id}`)}`) : dishesLink;
            return <Link className={`hero-photo ${i === 1 ? 'center-photo' : ''} image-fallback`} key={i} to={target}>
              <Picture src={dish?.imagePath} fallback={['/images/noodles.svg', '/images/rice.svg', '/images/rolls.svg'][i]} alt={dish?.name || 'Minh họa ẩm thực Việt'} width="600" height="600"/>
              <span>{dish?.name || 'Một hương vị mới'}<small>SAIGON COLLECTION · 0{i + 1}</small></span>
            </Link>;
          })}
        </div>

        <span className="hero-taste-tag">TASTE THE FRESHNESS</span>
        <p className="eyebrow hero-eyebrow">CHẠM VÀO HƯƠNG VỊ ĐỊA PHƯƠNG</p>
        <h1>Khám phá tinh hoa<br/>ẩm thực <em>Sài Gòn</em></h1>
        <p className="hero-description">Từ góc phố thân quen đến những trải nghiệm mới mẻ.<br/>Mỗi món ăn là một câu chuyện, mỗi hành trình là một hương vị.</p>
        <div className="button-row">
          <Link className="button" to={dishesLink}>Xem thực đơn ↗</Link>
          <Link className="button outline" to="/#destinations">Khám phá địa điểm ↓</Link>
        </div>
        <div className="hero-footnote"><span className="little-leaf">✳</span> Được tạo nên từ cảm hứng ẩm thực Việt</div>
      </div>
    </section>

    {/* UPPER DARK BAND: Welcome to Kitchen (Deep Midnight Navy #14212D) */}
    <section className="dark-band kitchen-welcome" aria-label="Gian bếp Sài Gòn">
      <div className="shell dark-band-inner">
        <div className="dark-band-left">
          <span className="dark-band-badge">SAIGON CULINARY HERITAGE</span>
          <h2 className="dark-band-title">WELCOME TO OUR INCREDIBLE KITCHEN, PLEASE ENJOY.</h2>
        </div>
        <div className="dark-band-right">
          <p>
            Chào mừng bạn đến với không gian ẩm thực giao hòa giữa bản sắc Sài Gòn mộc mạc và phong vị đương đại. Mỗi nguyên liệu tươi ngon từ chợ sớm, từng giọt nước dùng ninh thảo mộc đến ngọn lửa than hồng đều mang theo sự tận tâm và niềm đam mê vị giác.
          </p>
          <span className="dark-band-accent">CHẠM VÀO TINH HOA · TASTE THE FRESHNESS</span>
        </div>
      </div>
    </section>

    {/* WE OFFER SECTION (Appetito style with circular plate & culinary list) */}
    <section className="section shell we-offer-section" id="offer">
      <div className="we-offer-grid">
        <div className="we-offer-plate-wrap">
          <div className="ceramic-dish-plate">
            <Picture src="/images/auth-seafood.jpg" fallback="/images/rolls.svg" alt="Món mực và hải sản tươi ngon Sài Gòn" width="600" height="600" loading="lazy"/>
            <span className="plate-tag">NGUYÊN LIỆU TRONG NGÀY</span>
          </div>
        </div>
        <div className="we-offer-content">
          <span className="section-badge">CHECK IT OUT</span>
          <h2>WE OFFER</h2>
          <p className="we-offer-desc">Những món ngon đặc sắc làm nên nét duyên ẩm thực của thành phố mến khách.</p>
          <ul className="we-offer-list">
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🍜</span>
                <div>
                  <strong>MÓN NƯỚC & PHỞ THẢO MỘC</strong>
                  <p>Nước dùng thanh ngọt hầm từ xương bò và hoa hồi, quế thanh, thảo quả tươi mới.</p>
                </div>
              </div>
            </li>
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🐙</span>
                <div>
                  <strong>HẢI SẢN & ĐẶC SẢN NƯỚNG SÀI GÒN</strong>
                  <p>Hải sản tươi sống nướng mỡ hành, sốt tiêu đen và muối ớt xanh đậm đà.</p>
                </div>
              </div>
            </li>
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🥗</span>
                <div>
                  <strong>MÓN CUỐN & RAU THƠM BẢN ĐỊA</strong>
                  <p>Gỏi cuốn tôm thịt, chả giò giòn tan kèm các loại rau rừng thanh mát.</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* PHOTOGRAPHIC GALLERY STRIP */}
    <div className="ingredients-gallery-strip" aria-label="Bộ sưu tập nguyên liệu tươi ngon">
      <figure className="gallery-strip-item">
        <Picture src="/images/auth-salmon.jpg" fallback="/images/restaurant.svg" alt="Hải sản tươi sạch" width="600" height="400" loading="lazy"/>
        <figcaption>HẢI SẢN TƯƠI MỖI NGÀY</figcaption>
      </figure>
      <figure className="gallery-strip-item">
        <Picture src="/images/auth-clams.jpg" fallback="/images/restaurant.svg" alt="Nghêu sò tươi ngon" width="600" height="400" loading="lazy"/>
        <figcaption>NGỌT THANH TỪ BIỂN VIỆT</figcaption>
      </figure>
      <figure className="gallery-strip-item">
        <Picture src="/images/auth-seafood.jpg" fallback="/images/restaurant.svg" alt="Hương vị Sài Gòn" width="600" height="400" loading="lazy"/>
        <figcaption>GIA VỊ SÀI GÒN NỒNG ĐẬM</figcaption>
      </figure>
    </div>

    {/* INSPIRING MEALS SECTION (Appetito style) */}
    <section className="section shell journey" id="journey">
      <div className="section-heading text-center">
        <span className="section-badge">TASTY AND CRUNCHY</span>
        <h2>INSPIRING MEALS</h2>
        <p>Những món ăn khơi nguồn cảm hứng mỗi ngày từ gian bếp ẩm thực Sài Gòn.</p>
      </div>

      {/* Top Meal Showcase with Signature */}
      <div className="top-meal-feature">
        <div className="top-meal-tabs">
          <span className="tab-pill active">MÓN CHÍNH</span>
          <span className="tab-pill">TRÁNG MIỆNG</span>
          <span className="tab-pill">THỨC UỐNG</span>
        </div>
        <div className="top-meal-card">
          <div className="top-meal-text">
            <span className="eyebrow">OUR TOP MEAL</span>
            <h3>Gợi ý món ăn nổi bật</h3>
            <p>Được thực khách và toà soạn bình chọn nhiều nhất tuần qua với hương vị chuẩn mực.</p>
            <span className="chef-signature">J.L. Mc · Saigon Table</span>
          </div>
          <div className="top-meal-thumb">
            <Picture src="/images/auth-salmon.jpg" fallback="/images/rice.svg" alt="Top meal" width="220" height="160" loading="lazy"/>
          </div>
        </div>
      </div>
    </section>

    {/* SECOND DARK BAND: OUR FULL MENU (Deep Midnight Navy #14212D) */}
    <section className="dark-band full-menu-banner" aria-label="Bộ sưu tập thực đơn">
      <div className="shell dark-menu-content">
        <span className="dark-band-badge">TASTY AND QUALITY · BỘ SƯU TẬP</span>
        <h2>OUR FULL MENU</h2>
        <p>
          Trải nghiệm hành trình ẩm thực phong phú từ những món ăn đường phố dân dã đến các địa điểm ẩm thực đạt danh hiệu Michelin tại Sài Gòn.
        </p>
        <Link className="button dark-menu-btn" to={dishesLink}>XEM TOÀN BỘ THỰC ĐƠN ↗</Link>
      </div>
    </section>

    {/* DESTINATIONS SECTION */}
    <section className="section destinations-section" id="destinations" aria-busy={refreshing}>
      <div className="shell">
        <div className="section-heading">
          <span className="section-badge">⌖ SAIGON, THROUGH A LOCAL LENS</span>
          <h2>Những quán ăn <em>đáng khám phá</em></h2>
          <p>{data?.totalRestaurants ?? '…'} quán ăn (gồm quán demo). Tìm theo tên quán, khu vực, loại ẩm thực hoặc món nổi bật.</p>
        </div>
        <RestaurantSearch key={params.get('destinationQ') || ''} initial={params.get('destinationQ') || ''} onSearch={search}/>
        <div className="quick-search" aria-label="Tìm nhanh">
          {['Phở', 'Bún', 'Món chay', 'Quận 1', 'Cơm tấm'].map(keyword => (
            <Link key={keyword} to={href({ destinationQ: keyword, destinationPage: 1 }, 'destinations')}>{keyword}</Link>
          ))}
        </div>
        {!refreshing && <StateView state={state}/>}
        {data && <>
          <div className="catalog-toolbar">
            <span>{data.destinationCount} quán ăn tham khảo</span>
            <Link to={dishesLink}>Xem toàn bộ món ăn ↗</Link>
          </div>
          {!data.restaurants.length && <div className="empty-state">
            <h3>Chưa tìm thấy địa điểm</h3>
            <Link to={href({ destinationQ: '', destinationPage: 1 }, 'destinations')}>Xem tất cả địa điểm</Link>
          </div>}
          <div className="restaurant-grid">
            {data.restaurants.map(x => <RestaurantCard key={x.id} restaurant={x}/>)}
          </div>
          <Pager label="Phân trang địa điểm" page={data.state.destinationPage} pages={Math.max(1, data.destinationPages)} href={page => href({ destinationPage: page }, 'destinations')}/>
        </>}
        <p className="source-note">Khoảng giá tham khảo của quán, không phải giá từng món. Tên quận dùng để tra cứu khu vực quen thuộc; địa chỉ theo hồ sơ nguồn. Quán demo dùng ảnh không gian minh họa. Thông tin quán thật tham khảo MICHELIN Guide.</p>
      </div>
    </section>

    {/* BOOK A TABLE SECTION (Appetito style reservation bar) */}
    <section className="section book-table-section" id="booking" aria-label="Đặt bàn trải nghiệm">
      <div className="shell book-table-inner">
        <span className="section-badge">DINNER, EVENT AND THE REST</span>
        <h2 className="book-table-title">BOOK A TABLE</h2>
        <p className="book-table-desc">
          Gợi ý bàn ăn ấm cúng cho gia đình, bạn bè hoặc những buổi gặp gỡ đặc biệt tại các không gian ẩm thực Sài Gòn.
        </p>
        <form className="book-table-form" onSubmit={e => e.preventDefault()}>
          <div className="book-field">
            <span className="book-field-icon" aria-hidden="true">👤</span>
            <input type="text" defaultValue="2 Thực khách" aria-label="Số thực khách" readOnly/>
          </div>
          <div className="book-field">
            <span className="book-field-icon" aria-hidden="true">📅</span>
            <input type="text" defaultValue="Hôm nay · Tối nay" aria-label="Ngày đặt bàn" readOnly/>
          </div>
          <div className="book-field">
            <span className="book-field-icon" aria-hidden="true">⏰</span>
            <input type="text" defaultValue="19:00" aria-label="Giờ đặt bàn" readOnly/>
          </div>
          <Link to={dishesLink} className="button book-submit-btn">BOOK A TABLE</Link>
        </form>
        <p className="book-table-note">Toà soạn kết nối thông tin địa điểm trực tiếp với thực đơn Michelin Guide Sài Gòn</p>
      </div>
    </section>

    {/* REVIEWS SECTION */}
    <section className="section shell reviews" id="reviews" aria-busy={refreshing}>
      <div className="section-heading">
        <span className="section-badge">✧ NHỮNG CÂU CHUYỆN NHỎ</span>
        <h2>Cảm hứng từ những <em>hành trình</em></h2>
        <p>Nội dung minh họa cho bài tập · Nhân vật và nhận xét hư cấu.</p>
      </div>
      <nav className="review-tabs" aria-label="Loại nội dung cảm hứng">
        {[['text', 'Nhận xét'], ['gallery', 'Hành trình ảnh']].map(([tab, label]) => (
          <Link key={tab} className={(params.get('reviewTab') || 'text') === tab ? 'active' : ''} to={href({ reviewTab: tab }, 'reviews')}>{label}</Link>
        ))}
      </nav>
      {data && <>
        {!data.reviews.length && <p className="empty-state">Hành trình đang chờ bạn.</p>}
        <div className="review-grid">
          {data.reviews.map((review, i) => (
            <article key={review.id} className={`review-card ${data.state.reviewTab === 'gallery' ? 'gallery-mode' : ''}`}>
              <span className="stars" aria-label="5 sao minh họa">★★★★★</span>
              {data.state.reviewTab === 'text' ? (
                <blockquote>{review.text}</blockquote>
              ) : (
                <>
                  <h3>Một ngày, nhiều hương vị</h3>
                  <p>Ghé qua những không gian ẩm thực Sài Gòn.</p>
                </>
              )}
              <div className="mini-gallery">
                {data.reviewPhotos[i]?.map(photo => (
                  <Picture key={photo.id} src={photo.imagePath} fallback="/images/restaurant.svg" alt={`Không gian ${photo.name}`} width="600" height="600" loading="lazy"/>
                ))}
              </div>
              <div className="review-person">
                <span className="avatar">{review.initials}</span>
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.location} · Nhân vật minh họa</span>
                </div>
                <span className="quote-mark">”</span>
              </div>
            </article>
          ))}
        </div>
        <Pager label="Phân trang cảm hứng" page={data.state.reviewPage} pages={Math.max(1, data.reviewPages)} href={page => href({ reviewPage: page }, 'reviews')}/>
      </>}
    </section>

    {/* FINAL CTA / ABOUT */}
    <section className="final-cta" id="about">
      <div className="shell final-content">
        <div className="cta-photo-group">
          {['rolls', 'greens', 'rice'].map(x => (
            <Picture key={x} src={`/images/${x}.svg`} alt="Minh họa hương vị Việt" width="600" height="600" loading="lazy"/>
          ))}
        </div>
        <span className="section-badge">A LITTLE CURIOSITY. A NEW FLAVOUR.</span>
        <h2>Sẵn sàng khám phá<br/><em>hương vị tiếp theo?</em></h2>
        <p>Hãy để một món ăn mới mở ra một câu chuyện mới.</p>
        <Link className="button" to={dishesLink}>Khám phá thực đơn ↗</Link>
        <p className="cta-note">Ẩm thực Việt · Một dự án học tập về ẩm thực.</p>
      </div>
      <div className="cta-landscape landscape">
        <Picture src="/images/landing-hero-bg.jpg" fallback="https://images.unsplash.com/photo-1785304968643-e73c3ad004d3?q=80&w=1323&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" alt="Tôm hùm và hàu tươi thượng hạng" width="2200" height="1200" loading="lazy"/>
      </div>
    </section>
  </main>;
}
