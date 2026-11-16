/* =====================================================
   SIDLYTIX - MAIN SCRIPT (v2)
   Safe to load on every page (all lookups are guarded).
   ===================================================== */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ===== SCROLL PROGRESS BAR =====
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

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
    hamburger.addEventListener("click", () => setMenu(!mobileNav.classList.contains("active")));
    $$("a", mobileNav).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100) setMenu(false);
    });
  }

  // ===== HEADER, ACTIVE NAV LINK, PROGRESS =====
  const header = $("#header");
  const navTargets = $$(".nav-menu .nav-link")
    .map((link) => {
      const href = link.getAttribute("href") || "";
      const section = href.length > 1 && href.startsWith("#") ? $(href) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 30);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    if (navTargets.length) {
      let current = null;
      navTargets.forEach((item) => {
        if (y >= item.section.offsetTop - 200) current = item;
      });
      navTargets.forEach((item) => item.link.classList.toggle("active", item === current));
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
  window.addEventListener("resize", onScroll, { passive: true });
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

  // ===== SCROLL REVEAL (staggered) =====
  const revealEls = $$(
    ".svc-row, .ind-tile, .portfolio-card, .feature-card, .step-card, .faq-item, .service-card, " +
      ".principles li, .skill, .build-col, .ind-grid, .cta-wide, .timeline",
  );

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const index = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.transitionDelay = `${(index % 3) * 80}ms`;
          el.classList.add("visible");
          observer.unobserve(el);
          setTimeout(() => (el.style.transitionDelay = ""), 1200);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealEls.forEach((el) => {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
  }

  // ===== COUNT-UP NUMBERS + LIVE DASHBOARDS =====
  const formatNum = (n, dec) =>
    n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  function runCount(el) {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";

    if (prefersReducedMotion) {
      el.textContent = pre + formatNum(target, dec) + suf;
      return;
    }

    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = pre + formatNum(target * eased, dec) + suf;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function activate(el) {
    if (el.classList.contains("dash")) {
      el.classList.add("in-view");
      $$("[data-count]", el).forEach(runCount);
    } else {
      runCount(el);
    }
  }

  const animTargets = [...$$(".dash"), ...$$("[data-count]").filter((el) => !el.closest(".dash"))];

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => activate(entry.target), 150);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 },
    );
    animTargets.forEach((el) => countObserver.observe(el));
  } else {
    animTargets.forEach(activate);
  }

  // ===== HOME: industry tiles tint their section on hover =====
  const tileSection = $(".industries-section");
  if (tileSection) {
    const paint = (color, rgb) => {
      tileSection.style.setProperty("--ind", color);
      tileSection.style.setProperty("--ind-rgb", rgb);
    };
    $$(".ind-tile", tileSection).forEach((tile) => {
      const c = tile.style.getPropertyValue("--c").trim();
      const rgb = tile.style.getPropertyValue("--c-rgb").trim();
      const on = () => paint(c, rgb);
      const off = () => paint("#5cc8e0", "92, 200, 224");
      tile.addEventListener("mouseenter", on);
      tile.addEventListener("focus", on);
      tile.addEventListener("mouseleave", off);
      tile.addEventListener("blur", off);
    });
  }

  // ===== INDUSTRIES PAGE: theme follows hover + scroll =====
  const sections = $$(".ind-section");
  const indexLinks = $$(".ind-index-list a[data-ind]");

  if (sections.length && indexLinks.length) {
    const body = document.body;
    const list = $(".ind-index-list");
    const linkFor = (id) => indexLinks.find((a) => a.dataset.ind === id);

    let current = sections[0];
    let hovering = false;

    // el = any element carrying data-color + data-rgb (index link or section)
    const setTheme = (el) => {
      if (!el || !el.dataset.color) return;
      body.style.setProperty("--ind", el.dataset.color);
      body.style.setProperty("--ind-rgb", el.dataset.rgb || "92, 200, 224");
    };

    // Keep the active tab visible in the horizontal (mobile) index
    function revealTab(link) {
      if (!list || list.scrollWidth <= list.clientWidth) return;
      const left = link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2;
      list.scrollTo({ left, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    function setActive(section) {
      if (!section) return;
      current = section;
      indexLinks.forEach((a) => {
        const on = a.dataset.ind === section.id;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (!hovering) setTheme(section);
      const link = linkFor(section.id);
      if (link) revealTab(link.parentElement);
    }

    // Scroll: whichever section crosses the middle band of the screen is active
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target);
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
      );
      sections.forEach((s) => io.observe(s));
    }

    // Hover / keyboard focus on the index previews that industry's colour
    indexLinks.forEach((a) => {
      const preview = () => {
        hovering = true;
        setTheme(a);
      };
      a.addEventListener("focus", preview);
      if (canHover) a.addEventListener("mouseenter", preview);
    });

    const release = () => {
      hovering = false;
      setTheme(current);
    };
    if (list) {
      list.addEventListener("mouseleave", release);
      list.addEventListener("focusout", (e) => {
        if (!list.contains(e.relatedTarget)) release();
      });
    }

    // Hovering a section itself also takes on its colour (desktop)
    if (canHover) {
      sections.forEach((s) => {
        s.addEventListener("mouseenter", () => {
          if (!hovering) setTheme(s);
        });
        s.addEventListener("mouseleave", () => {
          if (!hovering) setTheme(current);
        });
      });
    }

    // Initial state (respects a #hash in the URL)
    const fromHash = location.hash && $(location.hash);
    setActive(fromHash && fromHash.classList.contains("ind-section") ? fromHash : sections[0]);
  }

  // ===== SUBTLE TILT (only on elements marked data-tilt) =====
  if (canHover && !prefersReducedMotion) {
    $$("[data-tilt]").forEach((card) => {
      let frame = null;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
        });
      });
      card.addEventListener("mouseleave", () => {
        if (frame) cancelAnimationFrame(frame);
        card.style.transform = "";
      });
    });
  }
})();
