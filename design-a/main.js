/* Concept A page interactions: header state, forms picker (scroll-carved
   when motion is on), bag notice, sign-up. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header turns solid once the hero has scrolled away. */
  var top = document.querySelector("[data-top]");
  var hero = document.querySelector(".hero");
  if (top && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      top.classList.toggle("is-solid", !entries[0].isIntersecting);
    }, { rootMargin: "-72px 0px 0px 0px" }).observe(hero);
  }

  /* Forms picker */
  var FORMS = {
    "koru": {
      name: "Koru",
      gloss: "The unfurling fern frond",
      meaning: "New life, growth and fresh starts. The koru is the young shoot of the silver fern, curled tight before it opens. It's a common gift for a birth, a new home or a new chapter.",
      link: "Shop koru pendants",
      fill: "fill-kawakawa"
    },
    "hei-matau": {
      name: "Hei matau",
      gloss: "The fish hook",
      meaning: "Strength, abundance and safe passage over water. In Māori tradition the demigod Māui fished up the North Island with his hook, so the hei matau is often given to people setting out on a journey.",
      link: "Shop hei matau",
      fill: "fill-inanga"
    },
    "pikorua": {
      name: "Pikorua",
      gloss: "The twist",
      meaning: "Two paths that cross, part and always meet again. The pikorua stands for the bond between people: friends, partners, family. A double or triple twist joins more lives together.",
      link: "Shop pikorua twists",
      fill: "fill-kahurangi"
    },
    "toki": {
      name: "Toki",
      gloss: "The adze",
      meaning: "Courage, determination and strength of purpose. Adzes were the essential tools for building and carving, and ceremonial toki were carried by leaders. It's often given for a new job or a big step.",
      link: "Shop toki",
      fill: "fill-kawakawa"
    },
    "roimata": {
      name: "Roimata",
      gloss: "The teardrop",
      meaning: "Comfort and healing. Roimata means tears, and the form honours sorrow shared between people. It's often given in remembrance, or to someone going through a hard time.",
      link: "Shop roimata",
      fill: "fill-inanga"
    }
  };

  var picker = document.querySelector(".forms__picker");
  var art = document.getElementById("form-art");
  if (picker && art) {
    var fillSvg = art.querySelector(".forms__fill");
    var fillPath = fillSvg.querySelector("path");
    var lineSvg = art.querySelector(".forms__line");
    var linePath = lineSvg.querySelector("path");
    var glow = art.querySelector(".forms__glow");
    var marker = picker.querySelector(".forms__marker");
    var textBox = document.querySelector(".forms__text");
    var nameEl = document.getElementById("form-name");
    var glossEl = document.getElementById("form-gloss");
    var meaningEl = document.getElementById("form-meaning");
    var linkEl = document.getElementById("form-link");
    var buttons = Array.prototype.slice.call(picker.querySelectorAll("button[data-form]"));
    var keys = buttons.map(function (b) { return b.dataset.form; });
    var current = null, swapTimer = 0, slots = [];

    var showForm = function (key, announce) {
      if (key === current) return;
      var first = current === null;
      var form = FORMS[key];
      var source = document.querySelector("#f-" + key + " path");
      if (!form || !source) return;
      current = key;

      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.form === key)); });
      var d = source.getAttribute("d");
      var rule = source.getAttribute("fill-rule") || "nonzero";
      fillPath.setAttribute("d", d);
      fillPath.setAttribute("fill-rule", rule);
      fillPath.setAttribute("fill", "url(#" + form.fill + ")");
      linePath.setAttribute("d", d);
      linePath.setAttribute("fill-rule", rule);

      // Only announce changes the visitor asked for, not every scroll step.
      textBox.setAttribute("aria-live", announce ? "polite" : "off");
      var write = function () {
        nameEl.textContent = form.name;
        glossEl.textContent = form.gloss;
        meaningEl.textContent = form.meaning;
        linkEl.textContent = form.link;
        textBox.classList.remove("is-swapping");
      };
      clearTimeout(swapTimer);
      if (first || reduceMotion) write();
      else {
        textBox.classList.add("is-swapping");
        swapTimer = setTimeout(write, 240);
      }
      var active = buttons[keys.indexOf(key)];
      if (picker.scrollWidth > picker.clientWidth) {
        picker.scrollTo({ left: active.offsetLeft - 24, behavior: reduceMotion ? "auto" : "smooth" });
      }
    };

    // The gold marker under the picker glides between names.
    var measure = function () {
      slots = buttons.map(function (b) { return { x: b.offsetLeft, w: b.offsetWidth }; });
    };
    var placeMarker = function (f) {
      if (!marker || !slots.length) return;
      var i = Math.min(Math.floor(f), slots.length - 1), t = f - i;
      var a = slots[i], b = slots[Math.min(i + 1, slots.length - 1)];
      marker.style.transform = "translateX(" + (a.x + (b.x - a.x) * t) + "px) scaleX(" + (a.w + (b.w - a.w) * t) + ")";
    };
    measure();
    picker.classList.add("has-marker");
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); placeMarker(keys.indexOf(current)); });
    window.addEventListener("resize", function () { measure(); placeMarker(Math.max(0, keys.indexOf(current))); });

    var track = document.querySelector("[data-forms-track]");
    var scrollMode = !reduceMotion && track && window.Motion;
    var go;

    if (scrollMode) {
      // Scrolling carves each form in turn: the gold outline is traced, the
      // polished stone fills in behind it, then light comes through.
      var M = window.Motion;
      var lead = 0.3;
      var hint = document.querySelector("[data-forms-hint]");
      if (hint) hint.textContent = "Keep scrolling to see each one carved, or choose one by name.";
      track.classList.add("is-scroll");

      var travel = function (rect, v) { return rect.height - v.h + v.h * lead; };
      M.scene(track, function (rect, v) {
        var n = keys.length;
        var f = Math.min(M.clamp01((v.h * lead - rect.top) / travel(rect, v)) * n, n - 0.0001);
        var i = Math.floor(f), local = f - i, last = i === n - 1;
        showForm(keys[i], false);

        var trace = M.ease(M.part(local, 0.02, 0.48));
        var fill = M.part(local, 0.34, 0.6);
        var light = M.easeOut(M.part(local, 0.5, 0.78));
        var out = last ? 0 : M.part(local, 0.88, 0.99);
        linePath.style.strokeDashoffset = String(1 - trace);
        lineSvg.style.opacity = String((1 - M.part(local, 0.5, 0.72)) * (trace > 0 ? 1 : 0));
        fillSvg.style.opacity = String(fill * (1 - out));
        glow.style.opacity = String(light * (1 - out));
        art.style.transform = "perspective(900px) rotateY(" + (-16 + 32 * local) + "deg) scale(" + (0.94 + 0.06 * M.easeOut(local / 0.6)) + ")";
        placeMarker(i + (last ? 0 : M.ease(M.part(local, 0.88, 1))));
      });

      go = function (index) {
        var rect = track.getBoundingClientRect();
        var v = M.view;
        var y = window.scrollY + rect.top - v.h * lead + travel(rect, v) * (index + 0.72) / keys.length;
        window.scrollTo({ top: Math.round(y), behavior: "smooth" });
      };
    } else {
      go = function (index) { showForm(keys[index], true); placeMarker(index); };
    }

    picker.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-form]");
      if (button) go(keys.indexOf(button.dataset.form));
    });
    picker.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      var index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      var next = (index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length;
      buttons[next].focus();
      go(next);
    });
    showForm("koru", false);
    placeMarker(0);
  }

  /* "Add to bag" is visual only until the shop is built. */
  var notice = document.getElementById("notice");
  var showNotice = function () {
    if (!notice) return;
    notice.hidden = false;
    notice.style.animation = "none";
    notice.getBoundingClientRect();
    notice.style.animation = "";
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(function () { notice.hidden = true; }, 6000);
  };
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-add-to-bag], [data-bag]")) showNotice();
    if (event.target.closest("#notice a")) notice.hidden = true;
  });

  /* Sign-up */
  var form = document.getElementById("signup-form");
  if (form) {
    var input = document.getElementById("signup-email");
    var error = document.getElementById("signup-error");
    var done = document.getElementById("signup-done");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      input.value = value;
      if (!value || !input.checkValidity()) {
        error.textContent = value ? "Check the email address. It should look like name@example.com." : "Enter your email address.";
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", "signup-error");
        input.focus();
        return;
      }
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") {
        error.hidden = true;
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    });
  }
})();
