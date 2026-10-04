/* ==========================================================
   Bandhan Shadi Office - Main Script
   Modules: theme, mobile menu, currency toggle, copy button,
            image previews, AJAX form submission, active nav
   ========================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Theme toggle ---------- */
  var themeBtn = $('#theme-toggle');
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('bso-theme', t); } catch (e) {}
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menu-toggle');
  var nav = $('#main-nav');
  function closeMenu() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---------- Highlight active nav link while scrolling ---------- */
  if ('IntersectionObserver' in window) {
    var links = $$('a', nav);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- Currency toggle (PKR / USD) ---------- */
  var curBtn = $('#currency-toggle');
  var curLabels = $$('.cur-label');
  function setCurrency(cur) {
    var usd = cur === 'USD';
    curBtn.setAttribute('aria-checked', String(usd));
    curLabels.forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-cur') === cur); });
    $$('.amount').forEach(function (el) {
      var n = Number(el.getAttribute(usd ? 'data-usd' : 'data-pkr'));
      el.textContent = usd ? '$' + n.toLocaleString('en-US') : 'Rs ' + n.toLocaleString('en-US');
    });
  }
  setCurrency('PKR');
  curBtn.addEventListener('click', function () {
    setCurrency(curBtn.getAttribute('aria-checked') === 'true' ? 'PKR' : 'USD');
  });

  /* ---------- Copy Easypaisa number ---------- */
  var copyBtn = $('#copy-number');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var num = copyBtn.getAttribute('data-copy');
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = num; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- Image validation + preview ---------- */
  var MAX_BYTES = 3 * 1024 * 1024;
  var ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

  function wirePreview(inputSel, imgSel) {
    var input = $(inputSel), img = $(imgSel);
    if (!input) return;
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      img.hidden = true;
      input.setCustomValidity('');
      if (!f) return;
      if (ALLOWED.indexOf(f.type) === -1) {
        input.setCustomValidity('Please choose a JPG, PNG or WEBP image.');
        input.reportValidity(); return;
      }
      if (f.size > MAX_BYTES) {
        input.setCustomValidity('Image must be 3 MB or smaller.');
        input.reportValidity(); return;
      }
      img.src = URL.createObjectURL(f);
      img.hidden = false;
    });
  }
  wirePreview('#photo', '#photo-preview');
  wirePreview('#screenshot', '#shot-preview');

  /* ---------- AJAX form submission ---------- */
  function wireForm(formSel) {
    var form = $(formSel);
    if (!form) return;
    var msg = $('.form-msg', form);
    var btn = $('button[type="submit"]', form);

    function show(text, ok) {
      msg.textContent = text;
      msg.className = 'form-msg show ' + (ok ? 'ok' : 'err');
      msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';

      if (!form.checkValidity()) {
        $$('input,select,textarea', form).forEach(function (el) {
          el.classList.toggle('invalid', !el.checkValidity());
        });
        form.reportValidity();
        return;
      }
      $$('.invalid', form).forEach(function (el) { el.classList.remove('invalid'); });

      var original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';

      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body.success) {
            show(res.body.message || 'Submitted successfully.', true);
            form.reset();
            $$('.preview', form).forEach(function (p) { p.hidden = true; });
          } else {
            show((res.body && res.body.message) || 'Something went wrong. Please try again.', false);
          }
        })
        .catch(function () {
          show('Network error. Please check your connection or contact us on WhatsApp.', false);
        })
        .finally(function () {
          btn.disabled = false; btn.textContent = original;
        });
    });
  }
  wireForm('#register-form');
  wireForm('#payment-form');

  /* ---------- Footer year ---------- */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
