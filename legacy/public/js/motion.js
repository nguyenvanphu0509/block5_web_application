(() => {
  // Motion intensity and timing are kept together for easy tuning.
  const motion = { duration: 600, distance: 20, stagger: 70, parallax: 24 };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 801px)');
  const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const seen = new WeakSet();
  const revealed = new WeakSet();
  const animations = new Set();
  const selector = '.section-heading, .journey-showcase, .features article, .restaurant-card, .dish-card, .review-card, .final-content, .page-heading, .dish-detail';

  function reveal(element, delay = 0) {
    if (reduced.matches || !element.animate) return;
    const animation = element.animate([
      { opacity: 0, translate: `0 ${desktop.matches ? motion.distance : 12}px` },
      { opacity: 1, translate: '0 0' },
    ], { duration: motion.duration, delay, easing, fill: 'backwards' });
    animations.add(animation);
    const release = () => animations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }

  // Elements remain visible by default if JS or IntersectionObserver is unavailable.
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      revealed.add(entry.target);
      const siblings = [...entry.target.parentElement.children].filter(element => element.matches(selector));
      const index = Math.max(0, siblings.indexOf(entry.target));
      const delay = desktop.matches ? Math.min(index % 3, 2) * motion.stagger : 0;
      reveal(entry.target, delay);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }) : null;

  function observe(root = document, updated = false) {
    if (reduced.matches || !observer) return;
    root.querySelectorAll(selector).forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      // Pagination already animates its grid; don't animate those cards twice.
      if (updated) {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          revealed.add(element);
          return;
        }
      }
      observer.observe(element);
    });
  }

  const landscapes = [...document.querySelectorAll('.hero-landscape, .cta-landscape')];
  let frame = null;
  function paintParallax() {
    frame = null;
    landscapes.forEach(layer => {
      const image = layer.querySelector('img');
      if (!image) return;
      if (reduced.matches || !desktop.matches) {
        image.style.transform = '';
        return;
      }
      const bounds = layer.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const progress = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / ((window.innerHeight + bounds.height) / 2);
      const offset = Math.max(-1, Math.min(1, progress)) * motion.parallax;
      image.style.transform = `translateY(${offset.toFixed(2)}px) scale(1.08)`;
    });
  }
  function requestParallax() {
    if (frame === null) frame = window.requestAnimationFrame(paintParallax);
  }

  const heroItems = document.querySelectorAll('.hero-tag, .hero-photo-group, .hero-eyebrow, .hero h1, .hero-description, .hero .button-row');
  heroItems.forEach((element, index) => reveal(element, index * motion.stagger));
  observe();
  requestParallax();
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax, { passive: true });
  desktop.addEventListener('change', requestParallax);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
    } else {
      document.querySelectorAll(selector).forEach(element => {
        if (!revealed.has(element)) observer?.observe(element);
      });
    }
    requestParallax();
  });
  document.addEventListener('home:updated', event => {
    // Clear references to removed cards before observing newly rendered content.
    observer?.disconnect();
    observe(event.detail.section, true);
    // Reconnect unseen sections further down the document.
    document.querySelectorAll(selector).forEach(element => {
      if (!reduced.matches && !revealed.has(element)) observer?.observe(element);
    });
    requestParallax();
  });
})();
