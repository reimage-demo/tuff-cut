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
})();

(() => {
  const carousel = document.querySelector('.cuts-carousel');
  if (!carousel) return;
  const stage = carousel.querySelector('.cuts-stage');
  const originals = [...carousel.querySelectorAll('.cut-slide')];
  const count = originals.length;
  // Identical copies on both sides allow seamless native scrolling in either direction.
  const copy = slide => {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    return clone;
  };
  stage.prepend(...originals.map(copy));
  stage.append(...originals.map(copy));
  const slides = [...stage.querySelectorAll('.cut-slide')];
  const prev = carousel.querySelector('[data-cut-prev]');
  const next = carousel.querySelector('[data-cut-next]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 3, drag, initialized = false;
  const dots = originals.map((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${count}: ${slide.dataset.title}`);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show haircut ${i + 1}: ${slide.dataset.title}`);
    button.addEventListener('click', () => goTo(i));
    carousel.querySelector('.cut-dots').append(button);
    return button;
  });
  function cycleWidth() { return slides[count].offsetLeft - slides[0].offsetLeft; }
  function recenter() {
    if (!initialized) return;
    const cycle = cycleWidth();
    if (!cycle) return;
    const shift = stage.scrollLeft < cycle ? cycle : stage.scrollLeft >= cycle * 2 ? -cycle : 0;
    if (shift) {
      stage.scrollLeft += shift;
      if (drag) drag.left += shift;
    }
  }
  function update() {
    recenter();
    const center = stage.getBoundingClientRect().left + stage.clientWidth / 2;
    let nearest = Infinity;
    const rectangles = slides.map(slide => slide.getBoundingClientRect());
    slides.forEach((slide, i) => {
      // Measure the untransformed slide, then scale only its portrait.
      const rect = rectangles[i];
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      const emphasis = Math.max(0, 1 - distance / (rect.width + 24));
      slide.style.setProperty('--cut-scale', (.82 + .18 * emphasis).toFixed(4));
      slide.style.setProperty('--cut-opacity', (.7 + .3 * emphasis).toFixed(4));
      if (distance < nearest) { nearest = distance; current = i % count; }
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    carousel.querySelector('.cut-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    carousel.querySelector('.cut-title').textContent = originals[current].dataset.title;
  }
  function goTo(index, instant = false) {
    const logical = (index + count) % count;
    const viewport = stage.getBoundingClientRect();
    const screenCenter = viewport.left + stage.clientWidth / 2;
    const candidates = [logical, logical + count, logical + count * 2];
    const target = instant ? slides[logical + count] : candidates.map(i => slides[i]).reduce((best, slide) => {
      const distance = el => Math.abs(el.getBoundingClientRect().left + el.offsetWidth / 2 - screenCenter);
      return distance(slide) < distance(best) ? slide : best;
    });
    const rect = target.getBoundingClientRect();
    const left = stage.scrollLeft + rect.left + rect.width / 2 - screenCenter;
    stage.scrollTo({left, behavior: instant || reduced.matches ? 'instant' : 'smooth'});
    if (!instant) carousel.querySelector('.cut-announcement').textContent = `Haircut ${logical + 1} of ${count}: ${originals[logical].dataset.title}`;
    update();
  }
  carousel.classList.add('is-ready');
  carousel.querySelector('.cuts-controls').hidden = false;
  goTo(current, true);
  initialized = true;
  stage.addEventListener('scroll', update, {passive:true});
  stage.addEventListener('scrollend', update);
  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  carousel.addEventListener('keydown', event => {
    const targets = {ArrowRight:current+1, ArrowLeft:current-1, Home:0, End:count-1};
    if (!(event.key in targets)) return;
    event.preventDefault(); goTo(targets[event.key]);
  });
  // Native touch and trackpad scrolling; mouse users can also drag the strip.
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {x:event.clientX, left:stage.scrollLeft};
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (drag) stage.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  function endDrag() { drag = null; stage.classList.remove('is-dragging'); }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);
  stage.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientWidth : 1);
    event.preventDefault(); stage.scrollLeft += delta; update();
  }, {passive:false});
  new ResizeObserver(() => goTo(current, true)).observe(stage);
})();
