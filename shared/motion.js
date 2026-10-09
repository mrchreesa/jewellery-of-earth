/* Scroll motion shared by both concepts. One requestAnimationFrame loop runs
   only while the page is moving (or a scene asks to keep settling). Each frame
   reads every nearby scene's position first, then lets the scenes write, so
   the browser lays out once per frame. With prefers-reduced-motion nothing is
   registered and scenes show their finished state. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("motion");

  var scenes = [];
  var resizers = [];
  var view = { w: window.innerWidth, h: window.innerHeight, v: 0, dt: 1 / 60 };
  var raf = 0, lastT = 0, lastY = window.scrollY;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  var near = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      scenes.forEach(function (s) { if (s.el === entry.target) s.near = entry.isIntersecting; });
    });
    request();
  }, { rootMargin: "60% 0px 60% 0px" }) : null;

  function frame(now) {
    raf = 0;
    var dt = lastT && now - lastT < 200 ? (now - lastT) / 1000 : 1 / 60;
    lastT = now;
    var y = window.scrollY;
    view.v += ((y - lastY) / dt - view.v) * Math.min(1, dt * 10);
    if (Math.abs(view.v) < 4) view.v = 0;
    lastY = y;
    view.dt = dt;

    var active = scenes.filter(function (s) { return s.near; });
    var rects = active.map(function (s) { return s.el.getBoundingClientRect(); });
    var again = view.v !== 0;
    active.forEach(function (s, i) { if (s.fn(rects[i], view) === true) again = true; });
    if (again) request();
    else lastT = 0;
  }

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", function () {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    resizers.forEach(function (fn) { fn(view); });
    request();
  });
  window.addEventListener("load", request);

  window.Motion = {
    reduce: reduce,
    view: view,
    clamp01: clamp01,
    lerp: function (a, b, t) { return a + (b - a) * t; },
    ease: function (t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    easeOut: function (t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); },
    // Part of [a, b] that t has covered, 0 to 1.
    part: function (t, a, b) { return clamp01((t - a) / (b - a)); },

    // 0 while the element's top sits at `from` (a fraction of the viewport
    // height), rising to 1 when its bottom reaches `to`.
    span: function (rect, v, from, to) {
      var start = v.h * from, end = v.h * to - rect.height;
      return clamp01((start - rect.top) / Math.max(1, start - end));
    },

    // Call fn(rect, view) on every frame the element is near the viewport.
    // Return true from fn to ask for another frame while something settles.
    scene: function (el, fn) {
      if (!el) return;
      var s = { el: el, fn: fn, near: !near };
      scenes.push(s);
      if (near) near.observe(el);
      request();
    },

    onResize: function (fn) { resizers.push(fn); },
    request: request,

    // One-shot: add .is-in once the element is well inside the viewport.
    reveal: function (els, onIn, margin) {
      els = Array.prototype.slice.call(els);
      if (reduce || !("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("is-in"); if (onIn) onIn(el, true); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          if (onIn) onIn(entry.target, false);
          io.unobserve(entry.target);
        });
      }, { rootMargin: margin || "0px 0px -16% 0px" });
      els.forEach(function (el) { io.observe(el); });
    }
  };
})();
