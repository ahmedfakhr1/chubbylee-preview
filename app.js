(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- header: solid after the first screen, logo after the hero logo leaves ---------- */
  var hdr = $('#hdr');
  var heroLogo = $('.hero-logo');
  function hdrState() {
    if (!hdr) return;
    hdr.classList.toggle('solid', (w.scrollY || 0) > 40);
  }
  hdrState();
  w.addEventListener('scroll', hdrState, { passive: true });
  if (hdr && heroLogo && 'IntersectionObserver' in w) {
    new IntersectionObserver(function (es) {
      hdr.classList.toggle('logo-on', !es[0].isIntersecting);
    }, { threshold: 0 }).observe(heroLogo);
  }

  /* ---------- drawer ---------- */
  var drawer = $('#drawer'), burger = $('.burger'), lastFocus = null;
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (open) { drawer.removeAttribute('inert'); } else { drawer.setAttribute('inert', ''); }
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = d.activeElement; var x = $('.drawer-x', drawer); if (x) x.focus(); }
    else if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(true); });
  if (drawer) {
    $('.drawer-x', drawer).addEventListener('click', function () { setDrawer(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { lastFocus = null; setDrawer(false); }); });
  }
  d.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && drawer && drawer.classList.contains('open')) setDrawer(false);
  });

  /* ---------- AR pop-up ---------- */
  var dlg = $('#ar-dialog');
  $$('.ar-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!dlg) return;
      if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else { dlg.setAttribute('open', ''); }
    });
  });
  if (dlg) {
    $('[data-close]', dlg).addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg && dlg.close) dlg.close(); });
  }

  /* ---------- the shelf wall lights up all at once ---------- */
  var shelf = $('#shelf');
  if (shelf) {
    var cubbies = $$('.cubby', shelf);
    var lit = false;
    var lightUp = function () {
      if (lit) return; lit = true;
      cubbies.forEach(function (c) { c.classList.add('on'); });
    };
    if (reduce || !('IntersectionObserver' in w)) { lightUp(); }
    else {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); lightUp(); }
      }, { threshold: 0, rootMargin: '0px 0px 15% 0px' });
      io.observe(shelf);
    }
  }

  /* ---------- booking: seating cubbies, guests, hand-off ---------- */
  var seats = $('#seats');
  if (seats) {
    var btns = $$('.seat', seats), guests = 4, cur = btns.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || btns[0];
    var sum = $('#sum'), out = $('#g-out'), minus = $('#g-minus'), plus = $('#g-plus'), copy = $('#copy');
    var line = function () { return cur.getAttribute('data-seat') + ', ' + guests + ' guests'; };
    var paint = function () {
      sum.textContent = line();
      out.textContent = guests;
      minus.disabled = guests <= 2; plus.disabled = guests >= 12;
    };
    var pick = function (b, focus) {
      cur = b;
      btns.forEach(function (x) { var on = x === b; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
      if (focus) b.focus();
      paint();
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b, false); });
      b.addEventListener('keydown', function (ev) {
        var k = ev.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = btns[(i + 1) % btns.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = btns[(i + btns.length - 1) % btns.length];
        if (n) { ev.preventDefault(); pick(n, true); }
      });
    });
    minus.addEventListener('click', function () { if (guests > 2) { guests--; paint(); } });
    plus.addEventListener('click', function () { if (guests < 12) { guests++; paint(); } });
    copy.addEventListener('click', function () {
      var text = line(), done = function () {
        copy.textContent = 'Copied';
        setTimeout(function () { copy.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
      } else { fallback(text); done(); }
    });
    var fallback = function (text) {
      var t = d.createElement('textarea'); t.value = text; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select();
      try { d.execCommand('copy'); } catch (e) { /* nothing to do */ }
      d.body.removeChild(t);
    };
    paint();
  }

  /* ---------- phone dock: hides on scroll down, over the booking section and the footer ---------- */
  var dock = $('#dock');
  if (dock) {
    var lastY = w.scrollY || 0, dir = 'up', over = { book: false, foot: false }, ticking = false;
    var isHome = d.body.classList.contains('home');
    var render = function () {
      ticking = false;
      var y = w.scrollY || 0;
      var show = !over.book && !over.foot && (y > 420 && dir === 'up');
      dock.classList.toggle('show', show);
    };
    w.addEventListener('scroll', function () {
      var y = w.scrollY || 0;
      if (Math.abs(y - lastY) > 6) { dir = y > lastY ? 'down' : 'up'; lastY = y; }
      if (!ticking) { ticking = true; w.requestAnimationFrame(render); }
    }, { passive: true });
    if ('IntersectionObserver' in w) {
      [['book', $('#book')], ['foot', $('#foot')]].forEach(function (p) {
        if (!p[1]) return;
        new IntersectionObserver(function (es) { over[p[0]] = es[0].isIntersecting; render(); }, { threshold: 0 }).observe(p[1]);
      });
    }
    render();
  }

  /* ---------- menu chips: current section ---------- */
  var chips = $('#chips');
  if (chips) {
    var links = $$('.chip', chips), row = $('.chips-in', chips);
    var secs = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    var setCur = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
        if (on && row) {
          var l = a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2;
          if (row.scrollTo) row.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' }); else row.scrollLeft = l;
        }
      });
    };
    var visible = {};
    var pickTop = function () {
      var best = null;
      secs.forEach(function (s) { if (s && visible[s.id] && (best === null || s.offsetTop < best.offsetTop)) best = s; });
      if (best) setCur(best.id);
    };
    if ('IntersectionObserver' in w) {
      var hdrH = parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--hdr')) || 0;
      var top = hdrH + (chips.offsetHeight || 68) + 4;
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
        pickTop();
      }, { rootMargin: '-' + top + 'px 0px -55% 0px', threshold: 0 });
      secs.forEach(function (s) { if (s) spy.observe(s); });
    }
    links.forEach(function (a) { a.addEventListener('click', function () { setCur(a.getAttribute('href').slice(1)); }); });
    if (secs[0]) setCur(secs[0].id);
  }

  /* ---------- signature ---------- */
  (function(){var a=document.querySelector('a.sig');if(!a)return;function play(){a.classList.remove('on');void a.getBoundingClientRect();a.classList.add('on')}a.addEventListener('mouseenter',function(){if(!a.classList.contains('on'))play()});if(!matchMedia('(hover: none)').matches||!('IntersectionObserver' in window))return;var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(play,400)}},{threshold:.9});io.observe(a)})();
})();
