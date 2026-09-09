function initializeHelpCenters() {
  document.querySelectorAll('[data-help-center]').forEach((center) => {
    if (center.dataset.initialized) return;
    center.dataset.initialized = 'true';
    const menu = center.querySelector('[data-help-menu]');
    const mobile = window.matchMedia('(max-width: 749px)');
    const synchronize = () => { menu.open = !mobile.matches; };
    synchronize();
    mobile.addEventListener('change', synchronize);
    menu.addEventListener('click', (event) => {
      if (mobile.matches && event.target.closest('a[href^="#"]')) menu.open = false;
    });
  });
}
initializeHelpCenters();
document.addEventListener('shopify:section:load', initializeHelpCenters);
