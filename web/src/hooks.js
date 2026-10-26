import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Each caller owns its data. Tag state with its URL to avoid rendering stale records.
export function useLoad(key, load) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: null, status: 'loading' });
  const loader = useRef(load); loader.current = load;
  const identity = `${key}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    setState({ key: identity, status: 'loading' });
    loader.current(controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ key: identity, status: 'ok', result });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key: identity, status: error.code === 'NOT_FOUND' ? 'notFound' : 'error', error });
    });
    return () => controller.abort();
  }, [identity]);
  return { ...(state.key === identity ? state : { status: 'loading' }), retry: () => setRevision(x => x + 1) };
}
export function useMotion(root, key) {
  useEffect(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations = new Set(), seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const animation = entry.target.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'ease-out' });
        animations.add(animation); animation.finished.finally(() => animations.delete(animation)).catch(() => {});
      }
    }, { threshold: 0.08 });
    const scan = () => root.current?.querySelectorAll('.section-heading, .dish-card, .restaurant-card, .review-card, .journey-showcase').forEach(x => { if (!seen.has(x)) { seen.add(x); observer.observe(x); } });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root.current, { childList: true, subtree: true });
    let frame;
    const paint = () => {
      frame = null;
      const desktop = window.matchMedia('(min-width:801px)').matches;
      root.current?.querySelectorAll('.landscape img').forEach(img => {
        const bounds = img.parentElement.getBoundingClientRect();
        const progress = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / ((window.innerHeight + bounds.height) / 2);
        img.style.transform = desktop ? `translateY(${Math.max(-1, Math.min(1, progress)) * 24}px) scale(1.08)` : '';
      });
    };
    const scroll = () => { if (!frame) frame = window.requestAnimationFrame(paint); };
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll); paint();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cancel = () => { observer.disconnect(); mutations.disconnect(); animations.forEach(x => x.cancel()); window.cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); root.current?.querySelectorAll('.landscape img').forEach(img => { img.style.transform = ''; }); };
    media.addEventListener('change', cancel);
    return () => { cancel(); media.removeEventListener('change', cancel); };
  }, [key, root]);
}
export function NavigationEffects() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) { window.scrollTo(0, 0); document.querySelector('main')?.focus({ preventScroll: true }); return; }
    const target = () => document.getElementById(location.hash.slice(1));
    if (target()) { target().scrollIntoView(); return; }
    const observer = new MutationObserver(() => { if (target()) { target().scrollIntoView(); observer.disconnect(); } });
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.search, location.hash]);
  return null;
}
