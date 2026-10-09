/* Concept A page interactions: header state, forms picker, bag notice, sign-up. */
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
    var fillPath = art.querySelector(".forms__fill");
    var linePath = art.querySelector(".forms__line");
    var nameEl = document.getElementById("form-name");
    var glossEl = document.getElementById("form-gloss");
    var meaningEl = document.getElementById("form-meaning");
    var linkEl = document.getElementById("form-link");
    var buttons = Array.prototype.slice.call(picker.querySelectorAll("button[data-form]"));

    var selectForm = function (key, animate) {
      var form = FORMS[key];
      var source = document.querySelector("#f-" + key + " path");
      if (!form || !source) return;

      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.form === key)); });
      var d = source.getAttribute("d");
      var rule = source.getAttribute("fill-rule") || "nonzero";
      fillPath.setAttribute("d", d);
      fillPath.setAttribute("fill-rule", rule);
      fillPath.setAttribute("fill", "url(#" + form.fill + ")");
      linePath.setAttribute("d", d);
      nameEl.textContent = form.name;
      glossEl.textContent = form.gloss;
      meaningEl.textContent = form.meaning;
      linkEl.textContent = form.link;

      if (!animate || reduceMotion) {
        art.classList.remove("is-drawing");
        art.classList.add("is-drawn");
        return;
      }
      // Trace the outline, then let the polished stone fill in behind it.
      var length = linePath.getTotalLength();
      art.classList.remove("is-drawn");
      art.classList.add("is-drawing");
      linePath.style.transition = "none";
      linePath.style.strokeDasharray = length + " " + length;
      linePath.style.strokeDashoffset = String(length);
      linePath.getBoundingClientRect();
      linePath.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.45,.05,.2,1)";
      linePath.style.strokeDashoffset = "0";
      clearTimeout(selectForm.timer);
      selectForm.timer = setTimeout(function () {
        art.classList.remove("is-drawing");
        art.classList.add("is-drawn");
      }, 1150);
    };

    picker.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-form]");
      if (button && button.getAttribute("aria-pressed") !== "true") selectForm(button.dataset.form, true);
    });
    picker.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      var index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      var next = buttons[(index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
      next.focus();
      selectForm(next.dataset.form, true);
    });
    selectForm("koru", false);
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
