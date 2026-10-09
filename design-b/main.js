/* Concept B page interactions: header state, bag notice, sign-up.
   The four hero stones are plain links to their chapters. */
(function () {
  "use strict";

  /* Header turns solid once the hero has scrolled away. */
  var top = document.querySelector("[data-top]");
  var hero = document.querySelector(".hero");
  if (top && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      top.classList.toggle("is-solid", !entries[0].isIntersecting);
    }, { rootMargin: "-72px 0px 0px 0px" }).observe(hero);
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
