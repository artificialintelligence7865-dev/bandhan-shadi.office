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

  /* ---------- WhatsApp form submission (no server needed, works on GitHub Pages) ---------- */
  var WHATSAPP_NUMBER = '923335822363'; // international format, no + or leading zero

  // Read a field value; empty optional fields show as "-"
  function val(form, name) {
    var el = form.elements[name];
    var v = el && el.value ? String(el.value).trim().replace(/\s+/g, ' ') : '';
    return v || '-';
  }

  // Each builder returns the full WhatsApp message text for its form
  var messageBuilders = {
    'register-form': function (f) {
      return [
        '*Bandhan Shadi Office - New Registration*',
        '*بندھن شادی آفس - نئی رجسٹریشن*',
        '',
        '- Name / نام: ' + val(f, 'full_name'),
        '- Age / عمر: ' + val(f, 'age'),
        '- Gender / جنس: ' + val(f, 'gender'),
        '- Marital Status / ازدواجی حیثیت: ' + val(f, 'marital_status'),
        '- City / شہر: ' + val(f, 'city'),
        '- Phone / فون نمبر: ' + val(f, 'phone'),
        '- Education / تعلیم: ' + val(f, 'education'),
        '- Occupation / پیشہ: ' + val(f, 'occupation'),
        '- Religion/Sect / مذہب و مسلک: ' + val(f, 'religion_sect'),
        '- Height / قد: ' + val(f, 'height'),
        '- Requirements / رشتے کی ضروریات: ' + val(f, 'requirements'),
        '',
        'Note: Please attach the candidate photo in this chat.',
        'نوٹ: براہِ کرم اسی چیٹ میں امیدوار کی تصویر بھی بھیج دیں۔'
      ].join('\n');
    },
    'payment-form': function (f) {
      return [
        '*Bandhan Shadi Office - Payment Proof*',
        '*بندھن شادی آفس - ادائیگی کی تفصیل*',
        '',
        '- Name / نام: ' + val(f, 'pay_name'),
        '- Phone / فون نمبر: ' + val(f, 'pay_phone'),
        '- Easypaisa TID / ٹرانزیکشن آئی ڈی: ' + val(f, 'tid'),
        '- Amount Sent / رقم: ' + val(f, 'amount_paid'),
        '',
        'Note: Please attach the payment screenshot in this chat.',
        'نوٹ: براہِ کرم اسی چیٹ میں ادائیگی کا اسکرین شاٹ بھی بھیج دیں۔'
      ].join('\n');
    }
  };

  function wireForm(formSel) {
    var form = $(formSel);
    if (!form) return;
    var msg = $('.form-msg', form);
    var build = messageBuilders[form.id];

    function show(text, ok) {
      msg.textContent = text;
      msg.className = 'form-msg show ' + (ok ? 'ok' : 'err');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();               // stop the normal form post
      msg.className = 'form-msg';

      // Honeypot: silently ignore bots
      if (form.elements['website'] && form.elements['website'].value) return;

      if (!form.checkValidity()) {
        $$('input,select,textarea', form).forEach(function (el) {
          el.classList.toggle('invalid', !el.checkValidity());
        });
        form.reportValidity();
        return;
      }
      $$('.invalid', form).forEach(function (el) { el.classList.remove('invalid'); });

      var message = build(form);
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

      // Opened directly inside the click handler so popup blockers allow it
      var win = window.open(url, '_blank');
      if (!win) { window.location.href = url; } // fallback if the popup was blocked

      show('WhatsApp is opening with your details. Please press Send, and attach the ' +
           (form.id === 'register-form' ? 'photo' : 'payment screenshot') + ' in the chat.', true);
    });
  }
  wireForm('#register-form');
  wireForm('#payment-form');

  /* ---------- Footer year ---------- */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
