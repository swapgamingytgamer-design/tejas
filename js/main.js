/* ============================================================
   TEJAS — main.js
   Navigation · reveal animations · active section · contact form
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("site-header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  var closeNav = function () {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      toggle.focus();
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    // Stagger siblings that share the same reveal group for a natural cascade
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        var target = child.matches(".reveal") ? child : child.querySelector(".reveal");
        if (target) target.style.setProperty("--reveal-delay", (i * 0.08).toFixed(2) + "s");
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Active section highlight ---------- */
  var sections = ["vision", "ecosystem", "products", "developers", "about", "contact"];
  var navLinks = {};
  sections.forEach(function (id) {
    var link = nav.querySelector('a[href="#' + id + '"]');
    if (link) navLinks[id] = link;
  });
  var clearActive = function () {
    Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove("is-active"); });
  };
  if ("IntersectionObserver" in window) {
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          clearActive();
          var link = navLinks[entry.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionIO.observe(el);
    });
  }

  /* ---------- Contact form (honest client) ----------
     Sends to the optional TEJAS backend. If no backend is running
     (e.g. a static deploy without the API), the user is told so
     plainly — the message is never silently faked as "sent".  */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var submit = document.getElementById("cf-submit");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      company: form.company.value // honeypot
    };

    var setStatus = function (text, kind) {
      status.textContent = text;
      status.classList.remove("is-ok", "is-error");
      if (kind) status.classList.add(kind);
    };

    setStatus("Sending\u2026", null);
    submit.disabled = true;

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (res.status === 201) {
          form.reset();
          setStatus("Message received. The TEJAS team will respond if a reply is needed.", "is-ok");
        } else if (res.status === 400) {
          return res.json().then(function (err) {
            setStatus(
              typeof err.detail === "string" ? err.detail : "Please check the form and try again.",
              "is-error"
            );
          });
        } else {
          setStatus("The message service is temporarily unavailable. Please try again later.", "is-error");
        }
      })
      .catch(function () {
        setStatus(
          "No message backend is connected here, so your message could not be delivered. " +
          "In local development, start it with: uvicorn backend.main:app --port 8000",
          "is-error"
        );
      })
      .finally(function () {
        submit.disabled = false;
      });
  });
})();
