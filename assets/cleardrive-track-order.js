/* Accessibility and input validation around the app's own order lookup. */
(() => {
  const connectedRoots = new WeakSet();
  function enhanceLookup() {
    const root = document.getElementById('track123-app');
    if (!root) return;
    const order = root.querySelector('.track123_form_input1');
    const email = root.querySelector('.track123_form_input2');
    const orderLabel = root.querySelector('#track123_order_number');
    const emailLabel = root.querySelector('#track123_order_email');
    if (!order || !email || !orderLabel || !emailLabel) return;
    order.required = true;
    order.autocomplete = 'off';
    order.setAttribute('aria-labelledby', orderLabel.id);
    order.placeholder = 'e.g. #1001';
    email.required = true;
    email.type = 'email';
    email.autocomplete = 'email';
    email.setAttribute('aria-labelledby', emailLabel.id);
    email.placeholder = 'Email used at checkout';
    if (orderLabel.textContent !== 'Order number') orderLabel.textContent = 'Order number';
    if (emailLabel.textContent !== 'Email address') emailLabel.textContent = 'Email address';
    if (connectedRoots.has(root)) return;
    connectedRoots.add(root);
    root.addEventListener('click', event => {
      if (!(event.target instanceof Element) || !event.target.closest('#track123_submit_button')) return;
      const fields = [root.querySelector('.track123_form_input1'), root.querySelector('.track123_form_input2')];
      for (const field of fields) {
        if (!field) return;
        field.setCustomValidity(field.value.trim() ? '' : 'Please fill out this field.');
        if (!field.checkValidity()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          field.reportValidity();
          return;
        }
      }
    }, true);
    root.addEventListener('input', event => {
      if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing || !(event.target instanceof HTMLInputElement)) return;
      if (!event.target.matches('.track123_form_input1, .track123_form_input2')) return;
      event.preventDefault();
      root.querySelector('#track123_submit_button')?.click();
    });
  }
  enhanceLookup();
  const observer = new MutationObserver(enhanceLookup);
  observer.observe(document.getElementById('MainContent') || document.body, { childList: true, subtree: true });
})();
