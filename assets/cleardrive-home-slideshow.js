(() => {
  if (window.CleardriveHomeSlideshow) {
    window.CleardriveHomeSlideshow.initialize(document);
    return;
  }
  const selector = '[data-cleardrive-slideshow]';
  const instances = new WeakMap();

  function initialize(root) {
    if (instances.has(root)) return;
    const slides = [...root.querySelectorAll('[data-hero-slide]')];
    if (slides.length < 2) return;
    const controls = [...root.querySelectorAll('[data-slide-to]')];
    const pause = root.querySelector('[data-slideshow-pause]');
    const interval = 3500;
    let index = 0;
    let timer;
    let paused = false;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });
      controls.forEach((control, i) => {
        control.setAttribute('aria-current', String(i === index));
      });
      root.dataset.activeSlide = String(index + 1);
    }

    function stop() {
      window.clearInterval(timer);
      timer = undefined;
    }

    function start() {
      stop();
      if (paused || document.hidden) return;
      timer = window.setInterval(() => show(index + 1), interval);
    }

    const abort = new AbortController();
    const options = { signal: abort.signal };
    controls.forEach((control, i) => {
      control.addEventListener('click', () => { show(i); start(); }, options);
    });
    if (pause) {
      pause.addEventListener('click', () => {
        paused = !paused;
        pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
        pause.setAttribute('aria-pressed', String(paused));
        pause.dataset.paused = String(paused);
        start();
      }, options);
    }
    document.addEventListener('visibilitychange', start, options);
    const cleanup = () => { stop(); abort.abort(); instances.delete(root); };
    instances.set(root, cleanup);
    show(0);
    start();
  }

  function initializeWithin(container) {
    if (container.matches?.(selector)) initialize(container);
    container.querySelectorAll(selector).forEach(initialize);
  }

  window.CleardriveHomeSlideshow = { initialize: initializeWithin };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeWithin(document), { once: true });
  } else {
    initializeWithin(document);
  }
  document.addEventListener('shopify:section:load', event => initializeWithin(event.target));
  document.addEventListener('shopify:section:unload', event => {
    if (event.target.matches?.(selector)) instances.get(event.target)?.();
    event.target.querySelectorAll(selector).forEach(root => instances.get(root)?.());
  });
})();
