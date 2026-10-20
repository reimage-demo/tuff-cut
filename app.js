(() => {
  'use strict';
  document.documentElement.classList.add('js');
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (toggle && nav) {
    const mobile = window.matchMedia('(max-width: 800px)');
    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
    function syncMenu() { toggle.hidden = !mobile.matches; closeMenu(); }
    syncMenu();
    mobile.addEventListener('change', syncMenu);
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
    });
  }
  const config = window.TUFF_CUTS || {};
  document.querySelectorAll('[data-barber]').forEach(link => {
    const barber = config.barbers?.[link.dataset.barber];
    if (!barber?.phone) return;
    const phone = barber.phone.replace(/[^+\d]/g, '');
    if (!/^\+1\d{10}$/.test(phone)) return;
    link.href = `tel:${phone}`;
    link.textContent = `Call ${barber.name} directly`;
    const note = document.querySelector(`[data-contact-note="${link.dataset.barber}"]`);
    if (note) note.textContent = barber.phone;
  });
  function safePaymentURL(value) {
    if (!value) return null;
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
  }
  function localImage(value) {
    return typeof value === 'string' && /^assets\/[a-zA-Z0-9_./-]+\.(png|webp|jpg|jpeg|svg)$/i.test(value) && !value.includes('..') ? value : null;
  }
  document.querySelectorAll('[data-payment]').forEach(method => {
    const payment = config.payments?.[method.dataset.payment];
    if (!payment) return;
    const slot = method.querySelector('.payment-slot');
    const status = method.querySelector('.payment-status');
    const recipient = method.querySelector('.payment-recipient');
    const link = method.querySelector('.payment-link');
    const qrImage = localImage(payment.qrImage);
    const url = safePaymentURL(payment.url);
    // A verified recipient is required before displaying a payment destination.
    if (!payment.recipient || (!qrImage && !url)) return;
    const availability = document.querySelector('[data-payment-availability]');
    if (availability) availability.textContent = 'Use an available payment option above, or ask at the counter for help. Confirm the recipient with your barber before sending.';
    recipient.textContent = `Recipient: ${payment.recipient}`;
    recipient.hidden = false;
    if (qrImage) {
      const img = new Image();
      img.alt = `${method.querySelector('h2').textContent} payment QR code for ${payment.recipient}`;
      img.width = 240; img.height = 240;
      img.addEventListener('load', () => {
        slot.replaceChildren(img); slot.classList.add('ready');
        status.textContent = 'Scan with your phone and confirm the recipient.';
      });
      img.addEventListener('error', () => {
        status.textContent = 'The QR code is unavailable. Please ask at the counter.';
      });
      img.src = qrImage;
    }
    if (url) {
      link.href = url; link.hidden = false;
      if (!qrImage) { slot.hidden = true; status.textContent = 'Open the payment link and confirm the recipient.'; }
    }
  });
})();
