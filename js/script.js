/* ==========================================================================
   Diksha Sharma — portfolio behaviour
   Plain ES5+/ES6 in a single IIFE. No frameworks, no build step.
   Sections below map 1:1 to the features in the brief.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. THEME TOGGLE  (persisted in localStorage under "ds-theme")
     The initial value is set by the inline script in <head> so the page
     never flashes the wrong theme; this only handles switching.
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var themeToggle = $('#themeToggle');

  function syncToggleLabel() {
    var isDark = root.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  themeToggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ds-theme', next); } catch (e) { /* storage blocked */ }
    syncToggleLabel();
  });

  syncToggleLabel();

  /* ------------------------------------------------------------------
     2. MOBILE NAV
     ------------------------------------------------------------------ */
  var burger   = $('#burger');
  var navLinks = $('#navLinks');
  var scrim    = $('#navScrim');

  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    scrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  scrim.addEventListener('click', function () { setMenu(false); });

  // close the drawer after tapping a link
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('.nav__link')) setMenu(false);
  });

  // reset state if the viewport grows past the mobile breakpoint
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) setMenu(false);
  });

  /* ------------------------------------------------------------------
     3. NAVBAR STATE: shadow on scroll, progress bar, active section
     All three run off one rAF-throttled scroll handler.
     ------------------------------------------------------------------ */
  var nav      = $('#nav');
  var progress = $('#scrollProgress');
  var toTop    = $('#toTop');
  var sections = $$('main section[id]');
  var linkFor  = {};

  $$('.nav__link').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });

  function onScroll() {
    var y = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;

    nav.classList.toggle('is-stuck', y > 8);
    progress.style.width = docHeight > 0 ? ((y / docHeight) * 100) + '%' : '0%';
    toTop.classList.toggle('is-visible', y > 600);

    // active link = the last section whose top has passed the nav line
    var current = sections[0] ? sections[0].id : null;
    var line = y + 140;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= line) current = sec.id;
    });
    // at the very bottom, force the last section so short sections still light up
    if (docHeight - y < 4 && sections.length) current = sections[sections.length - 1].id;

    $$('.nav__link').forEach(function (a) { a.classList.remove('is-active'); });
    if (current && linkFor[current]) linkFor[current].classList.add('is-active');
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  onScroll();

  /* ------------------------------------------------------------------
     4. BACK TO TOP
     ------------------------------------------------------------------ */
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------
     5. SCROLL REVEAL
     Elements carrying .reveal fade up once when they enter the viewport.
     Reduced-motion users get everything visible immediately (CSS handles
     the styling; here we just skip the observer).
     ------------------------------------------------------------------ */
  var revealEls = $$('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // small stagger within a group so rows don't all pop at once
        var delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
        setTimeout(function () { entry.target.classList.add('is-visible'); }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    // stagger siblings inside grids/lists
    ['.projects', '.skills', '.cards', '.kpis', '.timeline'].forEach(function (sel) {
      var group = $(sel);
      if (!group) return;
      $$('.reveal', group).forEach(function (el, i) { el.dataset.revealDelay = String(Math.min(i, 5) * 70); });
    });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
     6. PROJECT FILTERING
     ------------------------------------------------------------------ */
  var filters  = $$('.filter');
  var projects = $$('#projectGrid .project');
  var emptyMsg = $('#projectsEmpty');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var category = btn.dataset.filter;

      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      var shown = 0;
      projects.forEach(function (card) {
        var match = category === 'all' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !match);
        if (match) {
          shown++;
          // replay the reveal so filtered-in cards animate back in
          if (!prefersReducedMotion) {
            card.classList.remove('is-visible');
            // force reflow so the transition restarts
            void card.offsetWidth;
            card.classList.add('is-visible');
          }
        }
      });

      emptyMsg.hidden = shown > 0;
    });
  });

  /* ------------------------------------------------------------------
     7. LIGHTBOX GALLERIES
     Image lists point at real files in assets/img/.
     ------------------------------------------------------------------ */
  var galleries = {
    mars: {
      title: 'MARS Cosmetics — College Starter Kit',
      images: [
        { src: 'assets/img/mars/slide-01.jpg', alt: 'Problem slide: Stop buying makeup like it\u2019s homework' },
        { src: 'assets/img/mars/slide-02.jpg', alt: 'Insight slide: capture their loyalty before the competition does' },
        { src: 'assets/img/mars/slide-03.jpg', alt: 'Opportunity slide: discover, trial, habit, upgrade pathway' },
        { src: 'assets/img/mars/slide-04.jpg', alt: 'Solution slide: the five-in-one College Starter Kit' },
        { src: 'assets/img/mars/slide-05.jpg', alt: 'Campaign hook slide' },
        { src: 'assets/img/mars/slide-06.jpg', alt: 'Execution slide: four-phase campaign rollout' },
        { src: 'assets/img/mars/slide-07.jpg', alt: 'Marketing strategy slide: three channels' },
        { src: 'assets/img/mars/slide-08.jpg', alt: 'Expected results slide: 35 percent average student savings' },
        { src: 'assets/img/mars/slide-09.jpg', alt: 'Business impact slide: why this strategy wins' },
        { src: 'assets/img/mars/slide-10.jpg', alt: 'Closing slide' },
        { src: 'assets/img/mars/slide-11.jpg', alt: 'Closing slide' },
        { src: 'assets/img/mars/slide-12.jpg', alt: 'Closing slide' },
        { src: 'assets/img/mars/slide-13.jpg', alt: 'Closing slide' },
        { src: 'assets/img/mars/slide-14.jpg', alt: 'Closing slide' },
        { src: 'assets/img/mars/ideation-01.jpg', alt: 'Handwritten ideation: target audience, problems and product strategy' },
        { src: 'assets/img/mars/ideation-02.jpg', alt: 'Handwritten ideation: campaign name development' }
      ]
    },
    haldiram: {
      title: 'Haldiram\u2019s — Thanda Funda (working notes)',
      images: [
        { src: 'assets/img/haldiram/slide-01.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-01.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-02.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-03.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-04.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-05.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-06.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-07.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-08.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-09.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-10.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-11.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-12.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-13.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-14.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/slide-15.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/page-01.jpg', alt: 'Notes: campaign brief, name and installation concept' },
        { src: 'assets/img/haldiram/page-02.jpg', alt: 'Notes: consumer insight, target audience and reel concept' },
        { src: 'assets/img/haldiram/page-03.jpg', alt: 'Notes: reel concepts and Instagram captions' },
        { src: 'assets/img/haldiram/page-04.jpg', alt: 'Notes: story ideas and post ideas with sketches' },
        { src: 'assets/img/haldiram/page-05.jpg', alt: 'Notes: campaign evaluation against the memorability test' }
      ]
    }
  };

  var lightbox = $('#lightbox');
  var lbImage  = $('#lbImage');
  var lbCap    = $('#lbCaption');
  var lbCount  = $('#lbCount');
  var lbPrev   = $('#lbPrev');
  var lbNext   = $('#lbNext');
  var lbClose  = $('#lbClose');

  var active = null;   // current gallery object
  var index  = 0;      // current image index
  var lastFocused = null;

  function render() {
    var item = active.images[index];
    lbImage.src = item.src;
    lbImage.alt = item.alt;
    lbCap.textContent = active.title;
    lbCount.textContent = (index + 1) + ' / ' + active.images.length;
  }

  function openGallery(key, trigger) {
    active = galleries[key];
    if (!active) return;
    index = 0;
    lastFocused = trigger || document.activeElement;
    render();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeGallery() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImage.src = '';
    if (lastFocused) lastFocused.focus();
  }

  function step(delta) {
    if (!active) return;
    index = (index + delta + active.images.length) % active.images.length;
    render();
  }

  $$('[data-gallery]').forEach(function (el) {
    el.addEventListener('click', function () { openGallery(el.dataset.gallery, el); });
  });

  lbClose.addEventListener('click', closeGallery);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });

  // click the backdrop (not the image or controls) to dismiss
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeGallery();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) {
      if (e.key === 'Escape') setMenu(false);
      return;
    }
    if (e.key === 'Escape')     closeGallery();
    if (e.key === 'ArrowLeft')  step(-1);
    if (e.key === 'ArrowRight') step(1);
    // simple focus trap across the four controls
    if (e.key === 'Tab') {
      var focusables = [lbClose, lbPrev, lbNext];
      var i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      var nextIndex = e.shiftKey ? (i - 1 + focusables.length) % focusables.length
                                 : (i + 1) % focusables.length;
      focusables[nextIndex < 0 ? 0 : nextIndex].focus();
    }
  });

  /* ------------------------------------------------------------------
     8. CONTACT FORM VALIDATION
     Validates in the browser, then hands the message to the visitor's
     mail client. There is no server here — to collect submissions
     directly, point the form at a service such as Formspree and replace
     the mailto handoff below with a fetch() POST.
     ------------------------------------------------------------------ */
  var form   = $('#contactForm');
  var status = $('#formStatus');

  var rules = {
    cName:    { min: 2,  msg: 'Enter your name (at least 2 characters).' },
    cEmail:   { email: true, msg: 'Enter a valid email address.' },
    cSubject: { min: 3,  msg: 'Give the message a subject.' },
    cMessage: { min: 15, msg: 'Add a little more detail — at least 15 characters.' }
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function validateField(id) {
    var input = document.getElementById(id);
    var field = input.closest('.field');
    var error = $('#err' + id.slice(1));
    var rule  = rules[id];
    var value = input.value.trim();
    var ok    = true;

    if (!value) {
      ok = false;
      error.textContent = 'This field is required.';
    } else if (rule.email && !EMAIL_RE.test(value)) {
      ok = false;
      error.textContent = rule.msg;
    } else if (rule.min && value.length < rule.min) {
      ok = false;
      error.textContent = rule.msg;
    } else {
      error.textContent = '';
    }

    field.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  Object.keys(rules).forEach(function (id) {
    var input = document.getElementById(id);
    // validate on blur, then live-correct once the field has been touched
    input.addEventListener('blur', function () { validateField(id); });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(id);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = Object.keys(rules).map(validateField).every(Boolean);

    if (!valid) {
      status.classList.remove('is-ok');
      status.textContent = 'Fix the highlighted fields and send again.';
      var firstBad = $('.field.is-invalid input, .field.is-invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }

    var name    = $('#cName').value.trim();
    var email   = $('#cEmail').value.trim();
    var subject = $('#cSubject').value.trim();
    var message = $('#cMessage').value.trim();

    var body = message + '\n\n—\n' + name + '\n' + email;
    window.location.href = 'mailto:dikshalwar@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    status.classList.add('is-ok');
    status.textContent = 'Opening your email app with the message ready to send.';
    form.reset();
  });

  /* ------------------------------------------------------------------
     9. FOOTER YEAR
     ------------------------------------------------------------------ */
  $('#year').textContent = String(new Date().getFullYear());

})();
