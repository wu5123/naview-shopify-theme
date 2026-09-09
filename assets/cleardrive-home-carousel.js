(() => {
  if (window.CleardriveHomeCarousel) {
    window.CleardriveHomeCarousel.initialize(document);
    return;
  }
  const selector = '[data-cleardrive-slideshow]';
  const instances = new WeakMap();

  function initialize(root) {
    if (instances.has(root)) return;
    const track = root.querySelector('[data-carousel-track]');
    const slides = [...root.querySelectorAll('[data-hero-slide]')];
    if (!track || slides.length < 2) return;
    const dots = [...root.querySelectorAll('[data-slide-to]')];
    const pause = root.querySelector('[data-slideshow-pause]');
    const previous = root.querySelector('[data-slide-previous]');
    const next = root.querySelector('[data-slide-next]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const abort = new AbortController();
    const options = { signal: abort.signal };
    let index = 0;
    let position = 1;
    let intervalTimer;
    let settleTimer;
    let paused = false;
    let moving = false;
    let gesture;

    const clones = [slides.at(-1).cloneNode(true), slides[0].cloneNode(true)];
    clones.forEach(clone => {
      clone.removeAttribute('data-hero-slide');
      clone.setAttribute('data-carousel-clone', '');
      clone.setAttribute('aria-hidden', 'true');
    });
    track.prepend(clones[0]);
    track.append(clones[1]);

    function updateActive() {
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      root.dataset.activeSlide = String(index + 1);
    }

    function place(animated) {
      track.style.transition = animated && !reducedMotion.matches
        ? 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      track.style.transform = `translate3d(${-position * 100}%, 0, 0)`;
    }

    function settle() {
      window.clearTimeout(settleTimer);
      position = index + 1;
      place(false);
      moving = false;
    }

    function goTo(target, direction = 0) {
      if (moving) return false;
      const destination = (target + slides.length) % slides.length;
      if (destination === index) return false;
      // Adjacent cloned ends allow both directions to loop without rewinding.
      position = direction > 0 && index === slides.length - 1 && destination === 0
        ? slides.length + 1
        : direction < 0 && index === 0 && destination === slides.length - 1
          ? 0 : destination + 1;
      index = destination;
      moving = !reducedMotion.matches;
      place(true);
      updateActive();
      if (moving) settleTimer = window.setTimeout(settle, 650);
      else settle();
      return true;
    }

    function stop() {
      window.clearInterval(intervalTimer);
      intervalTimer = undefined;
    }

    function start() {
      stop();
      if (!paused && !document.hidden) {
        intervalTimer = window.setInterval(() => goTo(index + 1, 1), 4000);
      }
    }

    function step(direction) {
      if (goTo(index + direction, direction)) start();
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      if (goTo(i)) start();
    }, options));
    previous?.addEventListener('click', () => step(-1), options);
    next?.addEventListener('click', () => step(1), options);
    pause?.addEventListener('click', () => {
      paused = !paused;
      pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      pause.setAttribute('aria-pressed', String(paused));
      pause.dataset.paused = String(paused);
      start();
    }, options);
    track.addEventListener('transitionend', event => {
      if (event.target === track && event.propertyName === 'transform' && moving) settle();
    }, options);
    root.addEventListener('keydown', event => {
      if (event.target !== root) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }, options);
    root.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || event.button !== 0 || event.target.closest('a, button')) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      root.setPointerCapture?.(event.pointerId);
    }, options);
    root.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = undefined;
      if (Math.abs(dx) >= Math.max(36, root.clientWidth * 0.06) && Math.abs(dx) > Math.abs(dy) * 1.35) {
        step(dx < 0 ? 1 : -1);
      }
    }, options);
    root.addEventListener('pointercancel', () => { gesture = undefined; }, options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) settle();
      start();
    }, options);
    const cleanup = () => {
      stop();
      window.clearTimeout(settleTimer);
      abort.abort();
      clones.forEach(clone => clone.remove());
      track.style.transition = 'none';
      track.style.transform = '';
      instances.delete(root);
    };
    instances.set(root, cleanup);
    place(false);
    updateActive();
    start();
  }

  function initializeWithin(container) {
    if (container.matches?.(selector)) initialize(container);
    container.querySelectorAll(selector).forEach(initialize);
  }
  window.CleardriveHomeCarousel = { initialize: initializeWithin };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeWithin(document), { once: true });
  } else initializeWithin(document);
  document.addEventListener('shopify:section:load', event => initializeWithin(event.target));
  document.addEventListener('shopify:section:unload', event => {
    if (event.target.matches?.(selector)) instances.get(event.target)?.();
    event.target.querySelectorAll(selector).forEach(root => instances.get(root)?.());
  });
})();
