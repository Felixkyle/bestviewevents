/* ==========================================================================
   KADIS EVENTS & MEDIA — premium ambient motion layer
   Cinematic loader, drifting bokeh field, cursor-tracked glow, 3D card
   tilt, animated stat counters, and periodic camera-shutter flashes.
   Every effect checks prefers-reduced-motion and no-ops if set.
   ========================================================================== */

(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Cinematic loader ---------------- */
  function hideLoader() {
    var loader = document.getElementById('cinema-loader');
    if (!loader) return;
    loader.classList.add('hide');
    setTimeout(function () { loader.remove(); }, 700);
  }
  if (REDUCED) {
    var l = document.getElementById('cinema-loader');
    if (l) l.remove();
  } else {
    window.addEventListener('load', function () { setTimeout(hideLoader, 550); });
    // safety net in case 'load' is delayed by slow assets
    setTimeout(hideLoader, 2200);
  }

  /* ---------------- Bokeh / light-particle field ---------------- */
  (function bokeh() {
    var canvas = document.getElementById('bokeh-canvas');
    if (!canvas || REDUCED) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);

    var palette = ['217,119,46', '232,161,94', '169,184,76', '194,77,92'];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function seed() {
      var count = W < 700 ? 18 : 34;
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 40 + Math.random() * 110,
          dx: (Math.random() - 0.5) * 0.12,
          dy: (Math.random() - 0.5) * 0.12,
          o: 0.03 + Math.random() * 0.07,
          c: palette[i % palette.length]
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -p.r) p.x = W + p.r;
        if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H + p.r;
        if (p.y > H + p.r) p.y = -p.r;

        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, 'rgba(' + p.c + ',' + p.o + ')');
        grad.addColorStop(1, 'rgba(' + p.c + ',0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    resize();
    seed();
    requestAnimationFrame(tick);
    window.addEventListener('resize', function () { resize(); seed(); });
  })();

  /* ---------------- Cursor-tracked hero glow ---------------- */
  (function heroGlow() {
    var hero = document.querySelector('.em-hero');
    var glow = document.getElementById('heroGlow');
    if (!hero || !glow || REDUCED) return;
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty('--mx', x + '%');
      glow.style.setProperty('--my', y + '%');
    });
  })();

  /* ---------------- 3D tilt on cards ---------------- */
  (function tilt() {
    if (REDUCED) return;
    var cards = document.querySelectorAll('.tilt');
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          var rotY = px * 8;
          var rotX = -py * 8;
          card.style.transform = 'perspective(700px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateY(-4px)';
          raf = null;
        });
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  })();

  /* ---------------- Animated stat counters ---------------- */
  (function counters() {
    var cells = document.querySelectorAll('[data-target]');
    if (!cells.length) return;
    var done = new WeakSet();

    function animateCell(el) {
      if (done.has(el)) return;
      done.add(el);
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (REDUCED) { el.textContent = target + suffix; return; }
      var start = null;
      var duration = 1400;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCell(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    cells.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- Periodic camera-shutter flash on hero cards ---------------- */
  (function shutterFlash() {
    if (REDUCED) return;
    var flashes = document.querySelectorAll('.shutter-flash');
    if (!flashes.length) return;
    function fire() {
      var el = flashes[Math.floor(Math.random() * flashes.length)];
      el.style.transition = 'none';
      el.style.opacity = '0.55';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .5s ease';
        el.style.opacity = '0';
      });
      setTimeout(fire, 3200 + Math.random() * 4000);
    }
    setTimeout(fire, 2600);
  })();

})();
