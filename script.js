/* =====================================================
   SIDLYTIX - MAIN SCRIPT
   Safe to load on every page (all lookups are guarded).
   The contact form handler lives inline in index.html.
   ===================================================== */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ===== MOBILE NAVIGATION =====
  const hamburger = $("#hamburger");
  const mobileNav = $("#mobileNav");

  function setMenu(open) {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.toggle("active", open);
    mobileNav.classList.toggle("active", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () =>
      setMenu(!mobileNav.classList.contains("active")),
    );
    $$(".mobile-nav .nav-link").forEach((link) =>
      link.addEventListener("click", () => setMenu(false)),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // ===== HEADER SCROLL EFFECT + ACTIVE NAV LINK =====
  const header = $("#header");

  // Only in-page links that point at a real section (e.g. "#services")
  const navTargets = $$(".nav-menu .nav-link")
    .map((link) => {
      const href = link.getAttribute("href") || "";
      const section = href.length > 1 && href.startsWith("#") ? $(href) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  let ticking = false;

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 50);

    if (navTargets.length) {
      let current = navTargets[0];
      navTargets.forEach((item) => {
        if (window.scrollY >= item.section.offsetTop - 200) current = item;
      });
      navTargets.forEach((item) =>
        item.link.classList.toggle("active", item === current),
      );
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true },
  );
  onScroll();

  // ===== FAQ ACCORDION =====
  const faqItems = $$(".faq-item");

  faqItems.forEach((item) => {
    const question = $(".faq-question", item);
    if (!question) return;

    question.addEventListener("click", () => {
      const willOpen = !item.classList.contains("active");

      faqItems.forEach((other) => {
        other.classList.remove("active");
        const btn = $(".faq-question", other);
        if (btn) btn.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        item.classList.add("active");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  // ===== SCROLL REVEAL =====
  // The .reveal class is added here, so without JS the content stays visible.
  const revealEls = $$(
    ".service-card, .portfolio-card, .feature-card, .faq-item, .step-card",
  );

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    revealEls.forEach((el) => {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
  }

  // ===== 3D TILT FOR SERVICE CARDS (mouse devices only) =====
  const canHover = window.matchMedia("(hover: hover)").matches;

  if (canHover && !prefersReducedMotion) {
    $$(".service-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = (y - rect.height / 2) / 20;
        const rotateY = (rect.width / 2 - x) / 20;

        card.classList.add("tilting");
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("tilting");
        card.style.transform = ""; // hand control back to CSS
      });
    });
  }
})();
