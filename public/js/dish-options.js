const dishOptions = document.querySelector('#dish-options');
const dishOptionsTrigger = document.querySelector('[data-open-dish-options]');
if (dishOptions && dishOptionsTrigger) {
  dishOptionsTrigger.addEventListener('click', () => dishOptions.showModal());
  dishOptions.querySelector('[data-close-dish-options]').addEventListener('click', () => dishOptions.close());
  dishOptions.addEventListener('click', event => {
    const bounds = dishOptions.getBoundingClientRect();
    if (event.target === dishOptions && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dishOptions.close();
  });
  dishOptions.addEventListener('close', () => dishOptionsTrigger.focus());
  // Keep the existing search anchor useful for links from the header.
  if (window.location.hash === '#search') {
    document.querySelector('#dish-search')?.focus();
  }
}
