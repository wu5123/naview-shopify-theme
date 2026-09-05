if (!customElements.get('cleardrive-user-guide')) {
  customElements.define('cleardrive-user-guide', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.cleanup = new AbortController();
      const { signal } = this.cleanup;
      const contents = this.querySelector('.cd-ug__contents');
      const mobile = window.matchMedia('(max-width: 820px)');
      const syncContents = () => { contents.open = !mobile.matches; };
      syncContents();
      mobile.addEventListener('change', syncContents, { signal });
      contents.querySelector('summary').addEventListener('click', (event) => {
        if (!mobile.matches) event.preventDefault();
      }, { signal });
      const links = [...contents.querySelectorAll('a')];
      links.forEach(link => link.addEventListener('click', () => {
        if (mobile.matches) contents.open = false;
      }, { signal }));
      this.observer = new IntersectionObserver((entries) => {
        const visible = entries.filter(entry => entry.isIntersecting);
        if (!visible.length) return;
        const active = visible[0].target.id;
        links.forEach(link => {
          if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-18% 0px -62% 0px', threshold: 0 });
      this.querySelectorAll('[data-guide-chapter]').forEach(chapter => this.observer.observe(chapter));

      const tabs = [...this.querySelectorAll('[data-control-tab]')];
      const panels = [...this.querySelectorAll('[data-control-panel]')];
      const selectTab = (index, focus = false) => {
        tabs.forEach((tab, i) => {
          tab.setAttribute('aria-selected', String(index === i));
          tab.tabIndex = index === i ? 0 : -1;
          panels[i].hidden = index !== i;
        });
        if (focus) tabs[index].focus();
      };
      selectTab(0);
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectTab(index), { signal });
        tab.addEventListener('keydown', (event) => {
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          selectTab(next, true);
        }, { signal });
      });

      // Links still open the original image when JavaScript or dialog is unavailable.
      if (typeof HTMLDialogElement !== 'undefined') {
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'cd-ug__zoom';
        this.dialog.setAttribute('aria-label', 'Enlarged guide screenshot');
        const close = document.createElement('button');
        close.type = 'button';
        close.setAttribute('aria-label', 'Close enlarged image');
        close.textContent = '×';
        const toolbar = document.createElement('div');
        toolbar.className = 'cd-ug__zoom-toolbar';
        const zoom = document.createElement('button');
        zoom.type = 'button';
        zoom.className = 'cd-ug__zoom-toggle';
        zoom.textContent = 'Zoom in';
        zoom.setAttribute('aria-pressed', 'false');
        toolbar.append(zoom, close);
        const viewport = document.createElement('div');
        viewport.className = 'cd-ug__zoom-viewport';
        viewport.tabIndex = 0;
        viewport.setAttribute('aria-label', 'Image area. When zoomed in, scroll to see more of the screen.');
        const image = document.createElement('img');
        const caption = document.createElement('p');
        const zoomHint = document.createElement('p');
        zoomHint.className = 'cd-ug__zoom-hint';
        zoomHint.textContent = 'Swipe or scroll across the image to see more.';
        zoomHint.hidden = true;
        viewport.append(image);
        this.dialog.append(toolbar, viewport, zoomHint, caption);
        this.append(this.dialog);
        zoom.addEventListener('click', () => {
          const enlarged = this.dialog.dataset.zoomed !== 'true';
          this.dialog.dataset.zoomed = String(enlarged);
          zoom.setAttribute('aria-pressed', String(enlarged));
          zoom.textContent = enlarged ? 'Fit to screen' : 'Zoom in';
          zoomHint.hidden = !enlarged;
          if (enlarged) viewport.focus();
        }, { signal });
        close.addEventListener('click', () => this.dialog.close(), { signal });
        this.dialog.addEventListener('click', event => { if (event.target === this.dialog) this.dialog.close(); }, { signal });
        this.dialog.addEventListener('close', () => {
          document.documentElement.style.overflow = this.previousOverflow || '';
          this.lastZoomTrigger?.focus({ preventScroll: true });
        }, { signal });
        this.querySelectorAll('[data-guide-zoom]').forEach(link => link.addEventListener('click', event => {
          event.preventDefault();
          this.lastZoomTrigger = link;
          image.src = link.href;
          image.alt = link.dataset.caption;
          caption.textContent = link.dataset.caption;
          this.dialog.dataset.zoomed = 'false';
          zoom.setAttribute('aria-pressed', 'false');
          zoom.textContent = 'Zoom in';
          zoomHint.hidden = true;
          viewport.scrollLeft = 0;
          this.previousOverflow = document.documentElement.style.overflow;
          this.dialog.showModal();
          document.documentElement.style.overflow = 'hidden';
        }, { signal }));
      }
    }
    disconnectedCallback() {
      if (this.dialog?.open) {
        document.documentElement.style.overflow = this.previousOverflow || '';
        this.dialog.close();
      }
      this.cleanup?.abort();
      this.observer?.disconnect();
      this.dialog?.remove();
      this.initialized = false;
    }
  });
}
