/* ==========================================================================
   qiuyuxu.me —— 交互脚本
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 背景图加载后淡入（首屏不留白跳动） ---------- */
  var bgImage = document.getElementById('bgImage');
  if (bgImage) {
    if (bgImage.complete && bgImage.naturalWidth > 0) {
      bgImage.classList.add('is-ready');
    } else {
      bgImage.addEventListener('load', function () {
        bgImage.classList.add('is-ready');
      });
      bgImage.addEventListener('error', function () {
        bgImage.remove();
      });
    }
  }

  /* ---------- 2. 导航吸顶 + 滚动进度 + 回到顶部 ---------- */
  var nav       = document.getElementById('nav');
  var progress  = document.getElementById('progress');
  var toTop     = document.getElementById('totop');
  var ticking   = false;

  function onScroll() {
    var y   = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('is-on', y > 520);

    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 3. 移动端菜单 ---------- */
  var burger   = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');

  function closeMenu() {
    if (!navLinks || !burger) return;
    navLinks.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', '打开菜单');
  }

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });

    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });

    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('is-open')) return;
      if (!navLinks.contains(e.target) && !burger.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    }, { passive: true });
  }

  /* ---------- 4. 滚动揭示 ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 5. 导航高亮当前区块 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var links    = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));

  if (sections.length && links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { threshold: 0.01, rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 6. 页脚年份 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 7. 飘落花瓣（极轻量，可随时暂停） ---------- */
  var canvas = document.getElementById('petals');

  if (canvas && !reduceMotion) {
    var ctx      = canvas.getContext('2d');
    var dpr      = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var petals   = [];
    var rafId    = null;
    var running  = false;

    var COUNT = window.innerWidth < 720 ? 12 : 22;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePetal(randomY) {
      return {
        x:     Math.random() * W,
        y:     randomY ? Math.random() * H : -20 - Math.random() * 60,
        r:     3 + Math.random() * 4.5,          // 花瓣长度
        tilt:  Math.random() * Math.PI,
        spin:  (Math.random() - 0.5) * 0.014,
        vy:    0.22 + Math.random() * 0.42,
        vx:    (Math.random() - 0.5) * 0.34,
        alpha: 0.20 + Math.random() * 0.34,
        sway:  Math.random() * Math.PI * 2,
        swaySpeed: 0.006 + Math.random() * 0.012
      };
    }

    function seed() {
      petals.length = 0;
      for (var i = 0; i < COUNT; i++) petals.push(makePetal(true));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];

        p.y     += p.vy;
        p.sway  += p.swaySpeed;
        p.x     += p.vx + Math.sin(p.sway) * 0.42;
        p.tilt  += p.spin;

        if (p.y > H + 30) {
          petals[i] = makePetal(false);
          continue;
        }
        if (p.x < -40) p.x = W + 30;
        if (p.x > W + 40) p.x = -30;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tilt);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#FBFAF4';
        ctx.beginPath();
        // 一片简化的花瓣：两段对称贝塞尔
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.5, p.r * 0.7, p.r * 0.7, 0, p.r);
        ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.7, -p.r * 0.9, -p.r * 0.5, 0, -p.r);
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      rafId = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
      ctx.clearRect(0, 0, W, H);
    }

    resize();
    seed();
    start();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        seed();
      }, 180);
    }, { passive: true });

    // 页面切到后台或滚动出首屏时停下，别空转 CPU
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    window.addEventListener('scroll', function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > window.innerHeight * 1.15) stop(); else start();
    }, { passive: true });
  }

  /* ---------- 8. 平滑锚点（兜底老浏览器） ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - 66 - 16;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

})();
