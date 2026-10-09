/* Concept A scroll scenes. They borrow the hero's language: a cut opens
   along the same diagonal, the type is carved (Commissioner's FLAR axis), and
   light passes through the stone. With reduced motion everything rests in its
   finished state. */
(function () {
  "use strict";

  var M = window.Motion;
  if (!M) return;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* Headings are cut open and carved as they arrive. */
  var heads = document.querySelectorAll("main h2:not(.gift__title)");
  each(heads, function (h) { h.classList.add("carve"); });
  M.reveal(heads);

  /* Treasure photographs split open along the hero's cut line. */
  M.reveal(document.querySelectorAll(".treasure__cut"));

  if (M.reduce) return;

  /* Hero: scrolling on pushes into the stone (hero.js) while the words fall behind. */
  var hero = document.querySelector(".hero");
  var heroCopy = hero && hero.querySelector(".hero__copy");
  if (heroCopy) {
    M.scene(hero, function (rect) {
      var p = M.clamp01(-rect.top / rect.height);
      heroCopy.style.transform = p ? "translate3d(0," + (p * 22).toFixed(2) + "vh,0)" : "";
      heroCopy.style.opacity = String(1 - M.part(p, 0.08, 0.55));
    });
  }

  /* Gift headline: carved word by word as it rises into view. */
  var giftTitle = document.querySelector(".gift__title");
  if (giftTitle) {
    var words = giftTitle.textContent.trim().split(/\s+/).map(function (text) {
      var w = document.createElement("span");
      w.className = "word";
      w.textContent = text;
      return w;
    });
    giftTitle.textContent = "";
    words.forEach(function (w, i) {
      if (i) giftTitle.appendChild(document.createTextNode(" "));
      giftTitle.appendChild(w);
    });
    giftTitle.classList.add("is-split");
    M.scene(giftTitle, function (rect, v) {
      var p = M.span(rect, v, 0.92, 0.6);
      words.forEach(function (w, i) {
        var a = (i / words.length) * 0.62;
        var k = M.easeOut(M.part(p, a, a + 0.38));
        w.style.opacity = (0.12 + 0.88 * k).toFixed(3);
        w.style.fontVariationSettings = '"FLAR" ' + Math.round(k * 100) + ', "VOLM" 0';
      });
    });
  }

  /* Gift pendant: a toki lowered on its cord. It turns as the page moves,
     sways with the speed of the scroll, and swings if you brush past it. */
  var gift = document.getElementById("gift");
  var pendant = gift && gift.querySelector("[data-pendant]");
  if (pendant) {
    var shine = pendant.querySelector(".pendant__shine");
    var angle = 0, spin = 0, push = 0;
    gift.addEventListener("pointermove", function (e) {
      var r = pendant.getBoundingClientRect();
      if (e.clientX > r.left - 16 && e.clientX < r.right + 16 && e.clientY > r.top && e.clientY < r.bottom) {
        push += Math.max(-40, Math.min(40, e.movementX || 0)) * 0.012;
        M.request();
      }
    });
    M.scene(gift, function (rect, v) {
      var drop = M.easeOut(M.clamp01((v.h - rect.top) / (v.h * 0.62)));
      var through = M.span(rect, v, 1, 0);
      var target = Math.max(-0.13, Math.min(0.13, -v.v * 0.00004));
      push += (-46 * (angle - target) - 4.2 * push) * v.dt;
      angle += push * v.dt;
      spin = (through - 0.5) * 56;
      pendant.style.transform = "translate3d(0," + (-(1 - drop) * 100).toFixed(2) + "%,0) perspective(700px) rotate(" + angle.toFixed(4) + "rad) rotateY(" + spin.toFixed(2) + "deg)";
      shine.style.opacity = (0.12 + 0.5 * Math.max(0, 1 - Math.abs(spin) / 22) * drop).toFixed(3);
      return Math.abs(push) > 0.002 || Math.abs(angle - target) > 0.002;
    });
  }

  /* Collection: a light travels behind the plinths and each stone glows as it passes. */
  var list = document.querySelector(".pieces");
  var plinths = list ? Array.prototype.slice.call(list.querySelectorAll(".piece__plinth")) : [];
  if (plinths.length) {
    var spots = [];
    var measurePlinths = function () {
      var lr = list.getBoundingClientRect();
      spots = plinths.map(function (el) {
        var r = el.getBoundingClientRect();
        return { x: r.left - lr.left + r.width / 2, y: r.top - lr.top + r.height / 2, w: r.width };
      });
    };
    measurePlinths();
    M.onResize(measurePlinths);
    M.scene(list, function (rect, v) {
      var p = M.span(rect, v, 0.95, 0.3);
      var lx = rect.left + (-0.15 + 1.3 * p) * rect.width;
      spots.forEach(function (s, i) {
        var dx = (rect.left + s.x - lx) / (s.w * 1.15);
        var dy = (rect.top + s.y - v.h * 0.5) / (v.h * 0.55);
        plinths[i].style.setProperty("--lit", Math.exp(-dx * dx - dy * dy).toFixed(3));
      });
    });
  }

  /* Treasures drift at slightly different depths on wide screens. */
  var depths = { amber: -0.05, turquoise: 0.11, moonstone: -0.03, bone: 0.09 };
  each(document.querySelectorAll(".treasure"), function (fig) {
    var kind = (fig.className.match(/treasure--(\w+)/) || [])[1];
    var d = depths[kind] || 0, shift = 0;
    M.scene(fig, function (rect, v) {
      if (v.w <= 760) {
        if (shift) { shift = 0; fig.style.transform = ""; }
        return;
      }
      var c = rect.top - shift + rect.height / 2 - v.h / 2;
      shift = -c * d;
      fig.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
    });
  });

  /* Sign-up: a koru frond unfurls, with a point of light at its tip. */
  var signup = document.getElementById("signup");
  var frond = signup && signup.querySelector(".frond__line");
  if (frond) {
    var tip = signup.querySelector(".frond__tip");
    var frondLength = frond.getTotalLength();
    M.scene(signup, function (rect, v) {
      var k = M.ease(M.clamp01((v.h - rect.top) / (v.h * 0.78)));
      var at = frond.getPointAtLength(frondLength * k);
      frond.style.strokeDashoffset = String(1 - k);
      tip.setAttribute("cx", at.x.toFixed(1));
      tip.setAttribute("cy", at.y.toFixed(1));
      tip.style.opacity = (k > 0 && k < 1 ? Math.min(1, k * 12, (1 - k) * 12) : 0).toFixed(2);
    });
  }

  /* Story: walk past the stall wall. */
  var strip = document.querySelector("[data-strip]");
  var stripTrack = strip && strip.querySelector(".strip__track");
  if (stripTrack) {
    var reach = 0;
    var measureStrip = function () {
      var pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
      reach = Math.max(0, stripTrack.scrollWidth - (strip.clientWidth - 2 * pad));
    };
    measureStrip();
    M.onResize(measureStrip);
    strip.classList.add("is-moving");
    M.scene(strip, function (rect, v) {
      stripTrack.style.transform = "translate3d(" + (-M.span(rect, v, 1, 0) * reach).toFixed(1) + "px,0,0)";
    });
  }
})();
