/* Concept B scroll scenes. The motion language is the silversmith's: lines
   are engraved stroke by stroke, stones are pressed into their settings, and
   every route leads back to the stall at Camden Lock. With reduced motion
   everything rests in its finished state. */
(function () {
  "use strict";

  var M = window.Motion;
  if (!M) return;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var formatNumber = function (n, dp) {
    return dp ? n.toFixed(dp) : Math.round(n).toLocaleString("en-GB");
  };

  /* Headings: the outline is cut first, then the ink runs into it. */
  var heads = document.querySelectorAll("main h2");
  each(heads, function (h) { h.classList.add("engrave"); });
  M.reveal(heads);

  /* Chapters: the photo is revealed through engraving lines, the stone is
     set into its bezel, and the coordinates count up from zero. */
  var countUp = function (el) {
    var to = parseFloat(el.dataset.count);
    var dp = (el.dataset.count.split(".")[1] || "").length;
    var start = performance.now();
    var step = function (now) {
      var k = M.easeOut((now - start) / 1700);
      el.textContent = formatNumber(to * k, dp);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  M.reveal(document.querySelectorAll(".chapter"), function (chapter, instant) {
    if (!instant) each(chapter.querySelectorAll("[data-count]"), countUp);
  }, "0px 0px -22% 0px");

  /* Pieces: a raking light passes across each photograph in turn. */
  M.reveal(document.querySelectorAll(".piece"));

  /* ---------- The four corners, measured from the stall ---------- */
  var globeEl = document.querySelector("[data-globe]");
  if (globeEl) initGlobe(globeEl);

  if (M.reduce) return;

  /* Hero: the words fall behind as you scroll on; hero.js lowers the light. */
  var hero = document.querySelector(".hero");
  var heroCopy = hero && hero.querySelector(".hero__copy");
  if (heroCopy) {
    M.scene(hero, function (rect) {
      var p = M.clamp01(-rect.top / rect.height);
      heroCopy.style.transform = p ? "translate3d(0," + (p * 20).toFixed(2) + "vh,0)" : "";
      heroCopy.style.opacity = String(1 - M.part(p, 0.1, 0.6));
    });
  }

  /* Chapter photographs drift against the text on wide screens; the opal
     chapter's colour plays as you move past it, as an opal does when turned. */
  each(document.querySelectorAll(".chapter"), function (chapter) {
    var media = chapter.querySelector(".chapter__media");
    var opal = chapter.classList.contains("chapter--opal");
    var shift = 0;
    M.scene(chapter, function (rect, v) {
      if (opal) chapter.style.setProperty("--play", (M.span(rect, v, 1, 0) * 200 - 100).toFixed(1) + "deg");
      if (v.w <= 860) {
        if (shift) { shift = 0; media.style.transform = ""; }
        return;
      }
      shift = -(rect.top + rect.height / 2 - v.h / 2) * 0.08;
      media.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
    });
  });

  /* Story: four roads run in from the corners of the page to the stall. */
  var story = document.getElementById("story");
  var roads = story && story.querySelector(".roads");
  var gemLayer = story && story.querySelector(".roads--gems");
  var photo = story && story.querySelector(".story__photo img");
  if (roads && gemLayer && photo) {
    var NS = "http://www.w3.org/2000/svg";
    var STONES = ["amber", "opal", "pounamu", "turquoise"];
    var routes = [];
    var make = function (tag, attrs, parent) {
      var el = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      parent.appendChild(el);
      return el;
    };
    // Each road ends at a corner of the photograph, where its stone is set.
    var buildRoads = function () {
      var sr = story.getBoundingClientRect(), pr = photo.getBoundingClientRect();
      var w = sr.width, h = sr.height, inset = 10;
      var l = pr.left - sr.left - inset, t = pr.top - sr.top - inset;
      var r = l + pr.width + inset * 2, b = t + pr.height + inset * 2;
      var ends = [[0, 0, l, t], [w, 0, r, t], [w, h, r, b], [0, h, l, b]];
      var box = "0 0 " + w.toFixed(0) + " " + h.toFixed(0);
      roads.setAttribute("viewBox", box);
      gemLayer.setAttribute("viewBox", box);
      roads.textContent = "";
      Array.prototype.slice.call(gemLayer.querySelectorAll(".road__gem")).forEach(function (g) { g.remove(); });
      routes = ends.map(function (e, i) {
        var line = make("path", { d: "M " + e[0] + " " + e[1] + " L " + e[2] + " " + e[3], pathLength: "1", "class": "road road--" + STONES[i] }, roads);
        var gem = make("g", { "class": "road__gem road__gem--" + STONES[i] }, gemLayer);
        make("circle", { r: "11" }, gem);
        make("circle", { r: "8" }, gem);
        return { line: line, gem: gem, x0: e[0], y0: e[1], x1: e[2], y1: e[3] };
      });
    };
    buildRoads();
    M.onResize(buildRoads);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { buildRoads(); M.request(); });
    M.scene(story, function (rect, v) {
      var p = M.span(rect, v, 0.9, 0.95);
      routes.forEach(function (r, i) {
        var k = M.ease(M.part(p, i * 0.06, 0.74 + i * 0.06));
        var set = M.part(k, 0.94, 1);
        var x = r.x0 + (r.x1 - r.x0) * k, y = r.y0 + (r.y1 - r.y0) * k;
        var size = 0.55 + 0.45 * set + 0.25 * Math.sin(Math.PI * set);
        r.line.style.strokeDashoffset = String(1 - k);
        r.gem.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + size.toFixed(3) + ")");
        r.gem.style.opacity = k > 0 ? "1" : "0";
      });
      story.classList.toggle("is-arrived", p > 0.97);
    });
  }

  /* Sign-up: the Agadez cross is engraved, outline first, then its marks. */
  var signup = document.getElementById("signup");
  var crossPaths = signup ? Array.prototype.slice.call(signup.querySelectorAll(".cross path")) : [];
  if (crossPaths.length) {
    var spans = crossPaths.map(function (path) { return path.dataset.at.split(" ").map(parseFloat); });
    M.scene(signup, function (rect, v) {
      var k = M.clamp01((v.h - rect.top) / (v.h * 0.8));
      crossPaths.forEach(function (path, i) {
        path.style.strokeDashoffset = String(1 - M.ease(M.part(k, spans[i][0], spans[i][1])));
      });
    });
  }

  /* ---------- Globe ---------- */
  function initGlobe(figure) {
    var canvas = figure.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var D = Math.PI / 180;
    var vec = function (lat, lon) {
      lat *= D; lon *= D;
      return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
    };
    var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    var norm = function (a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var slerp = function (a, b, t) {
      var w = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
      if (w < 1e-5) return a;
      var s = Math.sin(w), ka = Math.sin((1 - t) * w) / s, kb = Math.sin(t * w) / s;
      return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
    };

    var HOME = vec(51.54, -0.146);
    var LEGS = [
      { key: "amber", name: "Amber", at: vec(54.9, 19.9), km: 1400, ink: "#C9761A", stops: ["#FFF1C2", "#F5B54A", "#D9861C", "#6E3204"] },
      { key: "turquoise", name: "Turquoise", at: vec(17.0, 8.0), km: 3900, ink: "#1F8C84", stops: ["#C9F3EC", "#59C8BD", "#2BA39A", "#13544F"] },
      { key: "opal", name: "Opal", at: vec(-29.0, 134.8), km: 15500, ink: "#6A5FD0", stops: ["#FFFFFF", "#9FE8FF", "#B88CFF", "#2B3D7A"] },
      { key: "pounamu", name: "Pounamu", at: vec(-42.7, 171.0), km: 18800, ink: "#2F6B4F", stops: ["#CFEBD9", "#4D9A70", "#2F6B4F", "#12382A"] }
    ];
    // Where the globe faces: London first, then along each route (leaning
    // towards the stone), then the one view that keeps every point in sight.
    // Aotearoa is nearly London's antipode, so its route is seen from halfway.
    var START = vec(38, 2);
    var VIEWS = LEGS.map(function (leg) {
      var k = leg.key === "pounamu" ? 1 : 1.15;
      return norm([HOME[0] + leg.at[0] * k, HOME[1] + leg.at[1] * k, HOME[2] + leg.at[2] * k]);
    });
    VIEWS.push(vec(8, 94));
    LEGS.forEach(function (leg) {
      leg.angle = Math.acos(dot(HOME, leg.at));
      leg.lift = 0.03 + 0.07 * leg.angle / Math.PI;
      leg.row = figure.querySelector('[data-leg="' + leg.key + '"]');
      leg.kmEl = leg.row && leg.row.querySelector("[data-km]");
    });

    var W = 0, dpr = 1, last = -1;
    var size = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(W * dpr);
      last = -1;
    };

    var serif = '"Bodoni Moda", "Didot", serif';
    var sans = '"Schibsted Grotesk", system-ui, sans-serif';

    function render(P) {
      var f = P * (LEGS.length + 0.7);
      var i = Math.min(VIEWS.length - 1, Math.floor(f));
      var from = i === 0 ? START : VIEWS[i - 1];
      var c = norm(slerp(from, VIEWS[i], M.ease(M.part(f - i, 0, 0.42))));
      var e = norm(cross([0, 0, 1], c));
      var n = cross(c, e);
      var cx = W / 2, cy = W / 2, R = W / 2 - 46;
      var proj = function (v, lift) {
        var k = R * (lift || 1);
        return { x: cx + dot(v, e) * k, y: cy - dot(v, n) * k, z: dot(v, c), r: Math.hypot(dot(v, e), dot(v, n)) * (lift || 1) };
      };
      var seen = function (q) { return q.z >= 0 || q.r > 1; };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);

      // Shadow, then the silver body.
      var sh = ctx.createRadialGradient(cx, cy + R * 0.96, 0, cx, cy + R * 0.96, R * 0.9);
      sh.addColorStop(0, "rgba(20,26,54,.22)");
      sh.addColorStop(1, "rgba(20,26,54,0)");
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.ellipse(cx, cy + R * 0.98, R * 0.9, R * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      var g = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.04, cx, cy, R * 1.02);
      g.addColorStop(0, "#FFFFFF");
      g.addColorStop(0.45, "#E4E7EB");
      g.addColorStop(0.85, "#BCC2CA");
      g.addColorStop(1, "#9DA4AF");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Engraved graticule: only the near side.
      var line = function (pts, alpha, width) {
        ctx.strokeStyle = "rgba(28,36,73," + alpha + ")";
        ctx.lineWidth = width;
        ctx.beginPath();
        var pen = false;
        pts.forEach(function (q) {
          if (q.z > 0) { if (pen) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); pen = true; }
          else pen = false;
        });
        ctx.stroke();
      };
      var lat, lon, pts;
      for (lon = -180; lon < 180; lon += 15) {
        pts = [];
        for (lat = -90; lat <= 90; lat += 3) pts.push(proj(vec(lat, lon)));
        line(pts, lon % 90 === 0 ? 0.34 : 0.17, 0.8);
      }
      for (lat = -75; lat <= 75; lat += 15) {
        pts = [];
        for (lon = -180; lon <= 180; lon += 3) pts.push(proj(vec(lat, lon)));
        line(pts, lat === 0 ? 0.42 : 0.17, lat === 0 ? 1.1 : 0.8);
      }

      // Rim: a turned edge with ticks that travel with the globe.
      ctx.strokeStyle = "rgba(28,36,73,.55)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(28,36,73,.28)";
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, 0, Math.PI * 2); ctx.stroke();
      var turn = Math.atan2(c[1], c[0]);
      ctx.beginPath();
      for (var t = 0; t < 72; t++) {
        var a = turn + t * Math.PI / 36, long = t % 6 === 0;
        ctx.moveTo(cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4));
        ctx.lineTo(cx + Math.cos(a) * (R + (long ? 14 : 9)), cy + Math.sin(a) * (R + (long ? 14 : 9)));
      }
      ctx.stroke();

      // Routes: lifted great-circle arcs from the stall, drawn as you scroll.
      LEGS.forEach(function (leg, li) {
        var k = M.part(f, li + 0.18, li + 0.9);
        leg.k = k;
        if (k <= 0) return;
        var steps = Math.max(8, Math.round(96 * k));
        var all = [];
        for (var s = 0; s <= steps; s++) {
          var u = (s / steps) * k;
          var q = proj(slerp(HOME, leg.at, u), 1 + leg.lift * Math.sin(Math.PI * u));
          q.seen = seen(q);
          all.push(q);
        }
        // Hidden stretches (behind the globe) are drawn faint and dashed.
        ctx.lineCap = "round";
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = leg.ink;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        all.forEach(function (q, j) { if (!q.seen && j && !all[j - 1].seen) { ctx.moveTo(all[j - 1].x, all[j - 1].y); ctx.lineTo(q.x, q.y); } });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        all.forEach(function (q, j) { if (q.seen && j && all[j - 1].seen) { ctx.moveTo(all[j - 1].x, all[j - 1].y); ctx.lineTo(q.x, q.y); } });
        ctx.stroke();
        // The travelling point.
        var head = all[all.length - 1];
        if (k < 1 && head.seen) {
          ctx.fillStyle = leg.ink;
          ctx.shadowColor = leg.ink;
          ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(head.x, head.y, 3.2, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // The stall.
      var home = proj(HOME);
      if (home.z > -0.02) {
        ctx.fillStyle = "#1C2449";
        ctx.beginPath();
        ctx.moveTo(home.x, home.y - 6); ctx.lineTo(home.x + 6, home.y); ctx.lineTo(home.x, home.y + 6); ctx.lineTo(home.x - 6, home.y);
        ctx.closePath(); ctx.fill();
        label(home, "Camden Lock", null, true);
      }

      // Stones are set where each route lands.
      LEGS.forEach(function (leg) {
        var pop = M.part(leg.k || 0, 0.9, 1);
        if (pop <= 0) return;
        var q = proj(leg.at);
        if (q.z < 0.02) return;
        var s = 1 + 0.25 * Math.sin(Math.PI * pop);
        var r = 8 * Math.min(1, pop * 1.6) * s;
        ctx.fillStyle = "#EEF0F2";
        ctx.strokeStyle = "rgba(28,36,73,.55)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, r + 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        var gg = ctx.createRadialGradient(q.x - r * 0.35, q.y - r * 0.4, r * 0.05, q.x, q.y, r);
        leg.stops.forEach(function (col, j) { gg.addColorStop(j / (leg.stops.length - 1), col); });
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
        if (pop > 0.5) label(q, leg.name, formatNumber(leg.km, 0) + " km", false);
      });

      // Legend: rows light up and their distances count as each route is drawn.
      LEGS.forEach(function (leg) {
        if (!leg.row) return;
        var k = leg.k || 0;
        leg.row.classList.toggle("is-on", k > 0);
        leg.row.classList.toggle("is-set", k >= 1);
        if (leg.kmEl) leg.kmEl.textContent = formatNumber(Math.round(leg.km * k / 100) * 100, 0);
      });
    }

    function label(q, title, sub, home) {
      // The stall is labelled below and to the left, clear of the routes leaving it.
      var right = !home && q.x < W * 0.72;
      var x = q.x + (right ? 15 : -12);
      ctx.textAlign = right ? "left" : "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#1C2449";
      ctx.font = "italic 500 " + (home ? 15 : 17) + "px " + serif;
      ctx.fillText(title, x, q.y + (home ? 18 : sub ? -1 : 5));
      if (sub) {
        ctx.font = "400 12px " + sans;
        ctx.fillStyle = "rgba(28,36,73,.72)";
        ctx.fillText(sub, x, q.y + 14);
      }
    }

    var draw = function (P) {
      if (Math.abs(P - last) < 0.0004) return;
      last = P;
      render(P);
    };

    size();
    M.onResize(function () { size(); M.request(); });
    if (M.reduce) {
      var still = function () { last = -1; draw(1); };
      still();
      window.addEventListener("resize", still);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(still);
      return;
    }
    draw(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var p = last; last = -1; draw(Math.max(0, p)); });

    // On wide screens the globe is sticky beside the text, so progress follows
    // its column; on narrow screens it follows the globe itself.
    var column = figure.parentElement;
    M.scene(column, function (rect, v) {
      var P = v.w > 860 ? M.span(rect, v, 0.3, 1.02) : M.span(rect, v, 0.8, 0.78);
      draw(P);
    });
  }
})();
