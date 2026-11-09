import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { useAuth } from '../AuthContext.jsx';
import { Pager, Picture, RestaurantCard, StateView } from '../components.jsx';

const INSPIRING_MEALS = {
  rawbar: {
    id: 'rawbar',
    tab: 'SEAFOOD & RAW BAR',
    eyebrow: 'OUR SIGNATURE PAIRING',
    title: 'Pan-Seared Salmon & Seasonal Greens',
    desc: 'Phi lê cá hồi áp chảo vàng mặt, dùng cùng rau xanh và topping rau củ. Một gợi ý nhẹ nhàng cho bữa tối.',
    signature: 'Cá hồi áp chảo · Gợi ý thưởng thức',
    image: '/images/auth-salmon.jpg',
    fallback: '/images/rolls.svg',
    alt: 'Cá hồi áp chảo cùng rau xanh và topping rau củ',
  },
  wine: {
    id: 'wine',
    tab: 'WINE PAIRING',
    eyebrow: 'SOMMELIER WINE SELECTION',
    title: 'Rosé & Tomato Bruschetta',
    desc: 'Vang rosé bên bánh mì nướng cà chua và thảo mộc, gợi ý một khởi đầu thư thả cho buổi tối.',
    signature: 'Wine & Dine · Gợi ý kết hợp',
    image: '/images/editorial-wine.jpg',
    fallback: '/images/restaurant.svg',
    alt: 'Hai ly vang rosé và bánh mì cà chua',
  },
  dessert: {
    id: 'dessert',
    tab: 'DESSERT & COCKTAIL',
    eyebrow: 'AFTER DINNER DELIGHTS',
    title: 'Citrus & Berry Cocktails',
    desc: 'Bộ ba cocktail sắc màu với chanh vàng, bạc hà và trái cây, một gợi ý thư giãn sau bữa tối.',
    signature: 'Cocktail · Gợi ý sau bữa tối',
    image: '/images/meal-dessert.jpg',
    fallback: '/images/rice.svg',
    alt: 'Ba ly cocktail trang trí bằng chanh, bạc hà và trái cây',
  },
};

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
  const [activeMealTab, setActiveMealTab] = useState('rawbar');
  const currentMeal = INSPIRING_MEALS[activeMealTab] || INSPIRING_MEALS.rawbar;
  const href = (changes, anchor) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(changes)) next.set(key, value); return `/?${next}#${anchor}`; };
  const search = value => { const next = new URLSearchParams(params); next.set('destinationQ', value); next.set('destinationPage', '1'); setParams(next); };

  return <main id="main" tabIndex="-1">
    {refreshing && <p className="sr-only" role="status">Đang tải nội dung…</p>}
    
    {/* HERO SECTION: Fully recreated UI matching SEACLUB seafood & wine banner (Pure CSS/HTML, No pasted background image) */}
    <section className="hero banner-hero-section">
      {/* Background radial atmosphere, compass orbit rings & faint typography watermark */}
      <div className="banner-backdrop" aria-hidden="true">
        <div className="banner-glow-spot"></div>
        <div className="banner-orbit-circle circle-lg"></div>
        <div className="banner-orbit-circle circle-sm"></div>
        <span className="banner-watermark-text">OYSTERS</span>
      </div>

      <div className="shell banner-hero-grid">
        {/* LEFT COLUMN: Classical typography, subtitle, description, buttons & bottom-left dish */}
        <div className="banner-hero-left">
          <span className="banner-eyebrow">seafood + wine · ẩm thực đương đại</span>
          <h1 className="banner-title">
            FISH RESTAURANT<br />
            <em>TINH HOA ẨM THỰC</em>
          </h1>
          <p className="banner-desc">
            Delicious food and fine wine. Hải sản tươi sống cùng các dòng vang hảo hạng tuyển chọn, kiến tạo trải nghiệm ẩm thực đỉnh cao giữa lòng Sài Gòn.
          </p>
          <div className="banner-actions">
            <Link className="button banner-btn-menu" to={dishesLink}>Menu · Xem thực đơn ↗</Link>
            <a className="button outline banner-btn-outline" href="#offer">Khám phá Raw Bar ↓</a>
          </div>

          {/* Bottom-left corner dish like in Banner design */}
          <div className="banner-corner-dish" aria-label="Món gợi ý đặc sắc">
            <div className="corner-dish-img">
              <img src="/images/hero-pasta-dish.jpg" alt="Mì mực đen hải sản" width="84" height="84" loading="lazy"/>
            </div>
            <div className="corner-dish-text">
              <span className="corner-dish-badge">GỢI Ý ĐẶC BIỆT</span>
              <strong>Mì mực đen hải sản</strong>
              <small>Tôm sú biển · 18 $</small>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The majestic oyster platter, floating limes, price annotations & wine */}
        <div className="banner-hero-right">
          <div className="banner-platter-stage">
            {/* The circular silver platter cutout from Banner */}
            <div className="banner-platter-frame">
              <img src="/images/oysters.png" alt="Khay hàu sữa tươi ướp đá và chanh vàng" width="440" height="440"/>
            </div>

            {/* Floating lemon slices (chanh 1, 2, 3, 4) arranged naturally around top, bottom & LEFT of oyster platter (NO overlap on wine bottle) */}
            <div className="banner-floating-lime lime-top" aria-hidden="true">
              <img src="/images/chanh1.png" alt="" width="44" height="44"/>
            </div>
            <div className="banner-floating-lime lime-left-top" aria-hidden="true">
              <img src="/images/chanh2.png" alt="" width="46" height="40"/>
            </div>
            <div className="banner-floating-lime lime-bottom" aria-hidden="true">
              <img src="/images/chanh3.png" alt="" width="46" height="42"/>
            </div>
            <div className="banner-floating-lime lime-left-bottom" aria-hidden="true">
              <img src="/images/chanh4.png" alt="" width="42" height="42"/>
            </div>

            {/* Dressed oysters price annotation matching showroom tag */}
            <div className="banner-tag platter-tag" aria-hidden="true">
              <span>Dressed Oysters</span>
              <strong>25 $</strong>
              <small>Hàu sữa tươi Nha Trang</small>
            </div>

            {/* Wine bottle element & price annotation matching showroom tag */}
            <div className="banner-wine-stage">
              <img className="banner-wine-img" src="/images/wine.png" alt="Vang đỏ thượng hạng" width="90" height="200"/>
              <div className="banner-tag wine-tag" aria-hidden="true">
                <span>Tignanello Wine</span>
                <strong>300 $</strong>
                <small>Vang đỏ hảo hạng</small>
              </div>
            </div>
          </div>

          {/* Database featured dishes bar */}
          <div className="hero-photo-group" aria-label="Ba món ăn nổi bật">
            {Array.from({ length: 3 }, (_, i) => {
              const dish = data?.featured[i];
              const target = dish ? (isAuthenticated ? `/dishes/${dish.id}` : `/login?redirect=${encodeURIComponent(`/dishes/${dish.id}`)}`) : dishesLink;
              return <Link className="hero-photo image-fallback" key={i} to={target}>
                <Picture src={dish?.imagePath} fallback={['/images/noodles.svg', '/images/rice.svg', '/images/rolls.svg'][i]} alt={dish?.name || 'Minh họa ẩm thực Việt'} width="400" height="400"/>
                <span>{dish?.name || 'Một hương vị mới'}<small>SAIGON · 0{i + 1}</small></span>
              </Link>;
            })}
          </div>
        </div>
      </div>
    </section>

    {/* UPPER DARK BAND: Welcome to Kitchen (Deep Midnight Ocean Navy #07131B - #0B1E2B) */}
    <section className="dark-band kitchen-welcome" aria-label="Gian bếp Sài Gòn & Hải sản">
      <div className="shell dark-band-inner">
        <div className="dark-band-left">
          <span className="dark-band-badge">SEAFOOD &amp; CONTEMPORARY DINING</span>
          <h2 className="dark-band-title">WELCOME TO OUR INCREDIBLE KITCHEN, PLEASE ENJOY.</h2>
        </div>
        <div className="dark-band-right">
          <p>
            Chào mừng bạn đến với không gian ẩm thực giao hòa giữa hải sản tươi ngon tuyển chọn và các dòng vang hảo hạng. Từng con hàu ướp lạnh, giọt rượu vang sánh mịn đến hương vị thảo mộc bản địa đều mang đến trải nghiệm vị giác thăng hoa.
          </p>
          <span className="dark-band-accent">CHẠM VÀO TINH HOA · TASTE THE FRESHNESS</span>
        </div>
      </div>
    </section>

    {/* SEAFOOD & RAW BAR (WE OFFER SECTION with circular plate & curated list) */}
    <section className="section shell we-offer-section" id="offer">
      <div className="we-offer-grid">
        <div className="we-offer-plate-wrap">
          <div className="ceramic-dish-plate">
            <Picture src="/images/editorial-oysters.jpg" fallback="/images/rolls.svg" alt="Hàu trên đá lạnh dùng cùng chanh vàng" width="600" height="600" loading="lazy"/>
            <span className="plate-tag">SEAFOOD &amp; RAW BAR</span>
          </div>
        </div>
        <div className="we-offer-content">
          <span className="section-badge">CHECK IT OUT · CUISINE SELECTION</span>
          <h2>WE OFFER</h2>
          <p className="we-offer-desc">Hải sản tươi sống, bộ sưu tập vang hảo hạng và ẩm thực Sài Gòn tinh hoa.</p>
          <ul className="we-offer-list">
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🦪</span>
                <div>
                  <strong>SEAFOOD &amp; RAW BAR</strong>
                  <p>Hàu trên đá lạnh cùng chanh vàng, cá hồi áp chảo và những đĩa hải sản nướng.</p>
                </div>
              </div>
            </li>
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🍷</span>
                <div>
                  <strong>WINE CELLAR &amp; PAIRING</strong>
                  <p>Khám phá vang rosé và những gợi ý kết hợp rượu vang với món khai vị, hải sản.</p>
                </div>
              </div>
            </li>
            <li>
              <div className="we-offer-item-head">
                <span className="we-offer-icon">🍲</span>
                <div>
                  <strong>SAIGON CONTEMPORARY CUISINE</strong>
                  <p>Những món ăn được trình bày chỉn chu, từ hương vị Việt đến các gợi ý dùng bữa đương đại.</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* PHOTOGRAPHIC GALLERY STRIP */}
    <div className="ingredients-gallery-strip" aria-label="Bộ sưu tập nguyên liệu tươi ngon & hầm rượu vang">
      <figure className="gallery-strip-item">
        <Picture src="/images/editorial-lobster.jpg" fallback="/images/restaurant.svg" alt="Tôm hùm nướng, tôm biển và sò điệp" width="600" height="400" loading="lazy"/>
        <figcaption>SEAFOOD GRILL · TÔM HÙM &amp; SÒ ĐIỆP</figcaption>
      </figure>
      <figure className="gallery-strip-item">
        <Picture src="/images/editorial-wine.jpg" fallback="/images/restaurant.svg" alt="Hai ly vang rosé cùng bánh mì cà chua" width="600" height="400" loading="lazy"/>
        <figcaption>WINE PAIRING · ROSÉ &amp; MÓN KHAI VỊ</figcaption>
      </figure>
      <figure className="gallery-strip-item">
        <Picture src="/images/editorial-dining.jpg" fallback="/images/restaurant.svg" alt="Bàn ăn thanh lịch trong không gian ánh sáng ấm" width="600" height="400" loading="lazy"/>
        <figcaption>CONTEMPORARY DINING · KHÔNG GIAN BÀN TIỆC</figcaption>
      </figure>
    </div>

    {/* INSPIRING MEALS & CELLAR SECTION */}
    <section className="section shell journey" id="journey">
      <div className="section-heading text-center">
        <span className="section-badge">TASTY AND QUALITY · WINE &amp; DINE</span>
        <h2>INSPIRING MEALS &amp; CELLAR</h2>
        <p>Những món ăn thượng hạng kết hợp ăn ý cùng danh mục vang tinh tuyển từ toà soạn.</p>
      </div>

      {/* Top Meal Showcase with Signature */}
      <div className="top-meal-feature">
        <div className="top-meal-tabs" role="tablist" aria-label="Lựa chọn món ăn và rượu vang">
          {Object.entries(INSPIRING_MEALS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeMealTab === key}
              className={`tab-pill ${activeMealTab === key ? 'active' : ''}`}
              onClick={() => setActiveMealTab(key)}
            >
              {item.tab}
            </button>
          ))}
        </div>
        <div className="top-meal-card" role="tabpanel" key={currentMeal.id}>
          <div className="top-meal-text">
            <span className="eyebrow">{currentMeal.eyebrow}</span>
            <h3>{currentMeal.title}</h3>
            <p>{currentMeal.desc}</p>
            <span className="chef-signature">{currentMeal.signature}</span>
          </div>
          <div className="top-meal-thumb">
            <Picture
              src={currentMeal.image}
              fallback={currentMeal.fallback}
              alt={currentMeal.alt}
              width="220"
              height="160"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    {/* SECOND DARK BAND: OUR FULL MENU (Deep Midnight Ocean Navy #07131B - #0B1E2B) */}
    <section className="dark-band full-menu-banner" aria-label="Bộ sưu tập thực đơn & hầm vang">
      <div className="shell dark-menu-content">
        <span className="dark-band-badge">TASTY AND QUALITY · BỘ SƯU TẬP</span>
        <h2>OUR FULL MENU</h2>
        <p>
          Hành trình khám phá trọn vẹn từ Raw Bar tươi sống, hầm vang Wine Cellar đến các địa điểm ẩm thực đạt danh hiệu Michelin Guide tại Sài Gòn.
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
