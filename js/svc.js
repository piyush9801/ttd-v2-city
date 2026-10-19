/* The Talent Dept. · round 12 · v2 City · The Work. The seven services stand as a skyline: one cluster each on one
   ground line, the names under them, Talent Booking the Signal cluster. Choose a cluster (click, Enter, or the arrow
   keys) and its service opens below; the services in the head choose one too. When the skyline first comes into
   view it is built once, floor by floor, left to right, and then stands still. */
(function () {
  var city = document.querySelector('.svc-city'); if (!city) return;
  var tabs = [].slice.call(city.querySelectorAll('.sc'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pick(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i, p = document.getElementById(t.getAttribute('aria-controls'));
      t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      if (p) p.hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { pick(k); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, j = e.key === 'ArrowRight' ? (k + 1) % n : e.key === 'ArrowLeft' ? (k - 1 + n) % n :
        e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (j > -1) { e.preventDefault(); pick(j, true); }
    });
  });
  [].forEach.call(document.querySelectorAll('a[data-sp]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); pick(+a.getAttribute('data-sp'));
      city.closest('section').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  // the build: only if the skyline starts below the fold, so the first frame is always whole
  if (reduce || !('IntersectionObserver' in window) || document.documentElement.classList.contains('still')) return;
  if (city.getBoundingClientRect().top < innerHeight * .9) return;
  city.classList.add('pre');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { city.classList.add('built'); io.disconnect(); } });
  }, { threshold: .45 });
  io.observe(city);
})();
