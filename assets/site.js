/* ===== Настройки сайта: поменяйте здесь ===== */
var SITE = {
  telegram: 'https://t.me/USERNAME',   // ссылка на Telegram
  cv: null,                             // ссылка на резюме (null = assets/cv.pdf)
  // фото для анимации на «Обо мне» (по слайдам: 0 — Путешествия, 1 — Книги, 2 — Фильмы); пусто = фото из макета
  aboutPhotos: {
    0: ['travel1', 'travel2', 'travel3', 'travel4', 'travel5', 'travel6', 'travel7'],
    1: ['books1', 'books2', 'books3', 'books4', 'books5', 'books6'],
    2: ['films1', 'films2', 'films3', 'films4', 'films5', 'films6']
  },
  // какие фото «вплетаются» в слова: номер строки (0 — первая), поверх которой ложится верх фото
  aboutWeave: { travel1: 0, travel7: 1 }
};
/* ============================================ */
(function () {
  document.querySelectorAll('[data-tg]').forEach(function (a) { a.href = SITE.telegram; });
  if (SITE.cv) document.querySelectorAll('[data-cv]').forEach(function (a) { a.href = SITE.cv; });

  // ---- galleries: drag to scroll (desktop) + dots (mobile)
  document.querySelectorAll('.gal').forEach(function (g) {
    var cs = getComputedStyle(g);
    g.style.scrollPaddingLeft = cs.paddingLeft;
    var down = false, sx = 0, sl = 0, moved = 0;
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = e.clientX; sl = g.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) g.classList.add('drag');
      g.scrollLeft = sl - dx / (parseFloat(document.documentElement.style.zoom) || 1);
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { g.classList.remove('drag'); }, 0);
    });
    g.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || e.shiftKey) return;
    }, { passive: true });
    // dots
    var p = g.parentElement, dots = null, el = g.nextElementSibling;
    while (el) { if (el.classList.contains('dots')) { dots = el; break; } if (el.querySelector && el.querySelector('.gal')) break; el = el.nextElementSibling; }
    if (!dots) return;
    var d = Array.prototype.slice.call(dots.children);
    if (d.length < 2) return;
    var items = [];
    Array.prototype.forEach.call(g.children, function (c) { if (c.tagName === 'I') return; if (c.classList.contains('gflat')) items.push.apply(items, c.children); else items.push(c); });
    while (d.length < items.length) { var c = d[d.length - 1].cloneNode(true); dots.appendChild(c); d.push(c); }
    d.slice(items.length).forEach(function (n) { n.remove(); });
    d = d.slice(0, items.length);
    var act = d[0], cur = 0;
    function upd() {
      var x = g.scrollLeft + g.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var c = it.offsetLeft + it.offsetWidth / 2, dd = Math.abs(c - x); if (dd < bd) { bd = dd; best = i; } });
      if (g.scrollLeft <= 2) best = 0;
      if (g.scrollLeft + g.clientWidth >= g.scrollWidth - 2) best = items.length - 1;
      if (best === cur) return; cur = best;
      var rest = Array.prototype.filter.call(dots.children, function (n) { return n !== act; });
      dots.insertBefore(act, rest[best] || null);
    }
    g.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    upd();
  });

  // ---- about slider
  document.querySelectorAll('[data-slider]').forEach(function (s) {
    var slides = Array.prototype.slice.call(s.querySelectorAll(':scope > .slide'));
    var i = 0, lock = false;
    slides.forEach(function (sl) {
      sl.querySelectorAll('.words').forEach(function (w) {
        Array.prototype.forEach.call(w.children, function (c, k) { c.style.setProperty('--i', k); });
      });
      sl.querySelectorAll('.ph').forEach(function (p, k) { p.style.setProperty('--i', k); });
    });
    function sync() {
      s.querySelectorAll('[data-dir="prev"]').forEach(function (b) { b.disabled = i === 0; });
      s.querySelectorAll('[data-dir="next"]').forEach(function (b) { b.disabled = i === slides.length - 1; });
    }
    function go(n) {
      if (lock || n < 0 || n >= slides.length || n === i) return;
      lock = true;
      var cur = slides[i];
      cur.classList.remove('on'); cur.classList.add('out');
      i = n;
      setTimeout(function () {
        cur.classList.remove('out');
        slides[i].classList.add('on');
        sync();
        setTimeout(function () { lock = false; }, 300);
      }, 380);
    }
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dir]');
      if (!b || b.disabled) return;
      go(i + (b.getAttribute('data-dir') === 'next' ? 1 : -1));
    });
    document.addEventListener('keydown', function (e) {
      if (!s.offsetParent) return;
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    });
    var tx = null, ty = 0;
    s.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    s.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
      tx = null;
    }, { passive: true });
    sync();
  });
})();

/* ===== «Обо мне»: зацикленная смена фото, фото вплетаются между строк ===== */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function offsetIn(el, stage) {
    var x = 0, y = 0;
    while (el && el !== stage) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y };
  }

  document.querySelectorAll('[data-slider] > .slide').forEach(function (slide) {
    var mobile = !!slide.closest('.L-m');
    var INTERVAL = mobile ? 450 : 300;  // мс между сменой фото
    var MAX_CARDS = mobile ? 3 : 4;     // сколько фото одновременно
    var words = slide.querySelector('.words');
    var phs = Array.prototype.slice.call(slide.querySelectorAll('.ph'));
    if (!words || !phs.length) return;
    var stage = words.parentElement;
    while (stage && !phs.every(function (p) { return stage.contains(p); })) stage = stage.parentElement;
    if (!stage) return;

    var si = slide.getAttribute('data-slide');
    var css = document.querySelector('link[rel=stylesheet][href*="site.css"]');
    var base = css ? css.getAttribute('href').split('site.css')[0] : 'assets/';
    var names = (window.SITE && SITE.aboutPhotos && SITE.aboutPhotos[si]) || [];
    var weaveMap = (window.SITE && SITE.aboutWeave) || {};
    var pool = names.length
      ? names.map(function (n) { return { url: base + 'img/about/' + n + '.webp', name: n }; })
      : phs.map(function (p) { return { url: getComputedStyle(p).backgroundImage.replace(/^url\(["']?|["']?\)$/g, ''), name: '' }; });
    pool.forEach(function (p) { var i = new Image(); i.onload = function () { p.ratio = i.naturalWidth / i.naturalHeight; }; i.src = p.url; });

    var cw = phs[0].offsetWidth, ch = phs[0].offsetHeight;
    var lines = Array.prototype.slice.call(words.children);
    slide.classList.add('collage');
    lines.forEach(function (l, i) { l.style.setProperty('--lz', String(10 + i * 10)); });
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    var layer = document.createElement('div');
    layer.className = 'clg';
    stage.appendChild(layer);

    // режимы по очереди: -1 = за всеми словами, k = верх фото поверх строки k, низ — под следующими строками
    var modes = [-1, -1, 0, -1, -1, 1];
    var cards = [], idx = 0, mIdx = 0, timer = null, prev = [];

    function rectOf(el) { var o = offsetIn(el, stage); return { x: o.x, y: o.y, w: el.offsetWidth, h: el.offsetHeight }; }

    var R = null;
    function measure() {
      // размеры берём в момент запуска (раскладка могла быть скрыта при загрузке)
      cw = phs[0].offsetWidth; ch = phs[0].offsetHeight;
      if (mobile && cw) { ch = Math.round(ch * 150 / cw); cw = 150; }  // на телефоне фото крупнее
      var R0 = phs.map(rectOf);
      R = { x: Math.min.apply(null, R0.map(function (r) { return r.x; })), y: Math.min.apply(null, R0.map(function (r) { return r.y; })) };
      R.w = Math.max.apply(null, R0.map(function (r) { return r.x + r.w; })) - R.x;
      R.h = Math.max.apply(null, R0.map(function (r) { return r.y + r.h; })) - R.y;
    }
    function place(mode) {
      var W = rectOf(words);
      if (mode >= 0) {
        var L = rectOf(lines[Math.min(mode, lines.length - 1)]);
        // центр фото — у левого или правого края слова, чтобы перекрывать его часть
        // фото заходит на слово только краем (~треть фото), чтобы слово читалось
        var left = Math.random() < 0.5;
        var cx = left ? L.x + cw * (0.12 + Math.random() * 0.06) : L.x + L.w - cw * (0.12 + Math.random() * 0.06);
        // на телефоне фото заходит на край слова слева или справа примерно на треть
        if (mobile) { cx = left ? L.x - cw * 0.25 : L.x + L.w + cw * 0.25; cx = Math.min(Math.max(cx, cw / 2), stage.offsetWidth - cw / 2); }
        return { x: cx - cw / 2, y: L.y - L.h * (0.15 + Math.random() * 0.2), r: Math.random() * 20 - 10 };
      }
      var best = null, bd = -1;
      for (var t = 0; t < 8; t++) {
        var c;
        if (mobile) {
          // на телефоне — плотная стопка вокруг центра слов, как в референсе
          var mx = W.x + W.w / 2, my = W.y + W.h / 2;
          c = { x: mx - cw / 2 + (Math.random() - 0.5) * W.w * 0.75, y: my - ch / 2 + (Math.random() - 0.5) * W.h * 1.1, r: Math.random() * 16 - 8 };
          c.x = Math.min(Math.max(c.x, 0), stage.offsetWidth - cw);
        } else {
          c = { x: W.x - cw * 0.35 + Math.random() * (W.w - cw * 0.3), y: Math.max(24, W.y - ch * 0.2) + Math.random() * Math.max(20, W.h - ch * 0.35), r: Math.random() * 24 - 12 };
        }
        var d = prev.reduce(function (m, p) { return Math.min(m, Math.hypot(p.x - c.x, p.y - c.y)); }, 1e9);
        if (d > bd) { bd = d; best = c; }
      }
      return best;
    }

    function addCard() {
      var ph = pool[idx % pool.length]; idx++;
      var mode = ph.name in weaveMap ? weaveMap[ph.name] : modes[mIdx++ % modes.length];
      if (mobile && mode >= 0) mode = 1;
      if (mode >= lines.length - 1) mode = -1;
      // одновременно «вплетено» только одно фото
      if (mode >= 0) cards.filter(function (c) { return c.classList.contains('weave'); }).forEach(function (c) { c.remove(); cards.splice(cards.indexOf(c), 1); });
      var s = place(mode);
      prev.push(s); if (prev.length > 3) prev.shift();
      var card = document.createElement('div');
      card.className = 'clg-card' + (mode >= 0 ? ' weave' : '');
      // обложки книг и вертикальные фото не обрезаем: ширина по пропорциям картинки
      var w = ph.ratio && ph.ratio < 0.8 ? Math.round(ch * Math.max(ph.ratio, 0.62)) : cw;
      card.style.width = w + 'px'; card.style.height = ch + 'px';
      card.style.backgroundImage = 'url("' + ph.url + '")';
      card.style.zIndex = mode >= 0 ? String(15 + mode * 10) : '1';
      var z = mode >= 0 ? 1.02 : 0.84 + Math.random() * 0.1;
      var ry = (Math.random() * 2 - 1) * 6, rx = 2 + Math.random() * 3;   // лёгкий наклон, без «сгиба»
      layer.appendChild(card);
      var start = performance.now(), dur = 220;
      (function step(now) {
        var k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
        card.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px) perspective(1600px) rotateX(' + rx + 'deg) rotateY(' + (ry * (1.3 - 0.3 * e)) + 'deg) rotate(' + s.r + 'deg) scale(' + (z * (0.88 + 0.12 * e)) + ')';
        card.style.opacity = String(Math.min(1, k * 2));
        if (k < 1) requestAnimationFrame(step);
      })(start);
      cards.push(card);
      while (cards.length > MAX_CARDS) { var old = cards.shift(); old.remove(); }
    }

    function run() { if (timer) return; measure(); if (!cw) return; for (var i = 0; i < MAX_CARDS; i++) addCard(); timer = setInterval(addCard, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; cards.forEach(function (c) { c.remove(); }); cards = []; }
    var delay = null;
    function sync() {
      var active = slide.classList.contains('on') && slide.offsetParent !== null && !document.hidden;
      if (active && !timer && !delay) delay = setTimeout(function () { delay = null; if (slide.classList.contains('on')) run(); }, 900);
      if (!active) { clearTimeout(delay); delay = null; if (timer) stop(); }
    }
    new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', function () { if (slide.offsetParent === null) { if (timer) stop(); } else sync(); });
    sync();
  });
})();

/* карточка проекта (мобильная): колонка подписей по ширине самой длинной подписи + постоянный зазор,
   чтобы текст не прилипал при любом шрифте/браузере */
(function () {
  var GAP = 28;
  function fit() {
    document.querySelectorAll('.ptab-m').forEach(function (t) {
      var labels = Array.prototype.map.call(t.querySelectorAll('.prow'), function (r) { return r.children[0]; }).filter(Boolean);
      if (!labels.length || !t.offsetParent) return;
      var max = 0;
      labels.forEach(function (l) {
        var r = document.createRange(); r.selectNodeContents(l);
        var lb = l.getBoundingClientRect().left;
        Array.prototype.forEach.call(r.getClientRects(), function (c) { max = Math.max(max, c.right - lb); });
      });
      var z = parseFloat(document.documentElement.style.zoom) || 1;
      t.style.setProperty('--lw', Math.ceil(max / z) + 'px');
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  fit();
})();
