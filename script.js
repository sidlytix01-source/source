// ===== MOBILE NAVIGATION =====
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
const mobileNavLinks = document.querySelectorAll(".mobile-nav .nav-link");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  mobileNav.classList.toggle("active");
  document.body.style.overflow = mobileNav.classList.contains("active")
    ? "hidden"
    : "";
});

mobileNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    mobileNav.classList.remove("active");
    document.body.style.overflow = "";
  });
});

// Close mobile nav on escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hamburger.classList.remove("active");
    mobileNav.classList.remove("active");
    document.body.style.overflow = "";
  }
});

// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-menu .nav-link");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});

// ===== FAQ ACCORDION =====
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");

  question.addEventListener("click", () => {
    // Close other items
    faqItems.forEach((otherItem) => {
      if (otherItem !== item && otherItem.classList.contains("active")) {
        otherItem.classList.remove("active");
      }
    });

    // Toggle current
    item.classList.toggle("active");
  });
});

// ===== FORM SUBMISSION =====
const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const service = document.getElementById("service").value;
  const message = document.getElementById("message").value;

  // Here you would typically send the data to a server
  // For now, show a success message
  alert(
    `Thank you, ${name}! We'll contact you at ${email} regarding your ${service} project.`,
  );

  // Reset form
  contactForm.reset();
});

// ===== FADE IN ANIMATION ON SCROLL =====
const fadeElements = document.querySelectorAll(".fade-in");

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 },
);

fadeElements.forEach((el) => fadeObserver.observe(el));

// ===== STAT COUNTER ANIMATION =====
const statNumbers = document.querySelectorAll(".stat-number");

const animateCounter = (element) => {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000; // 2 seconds
  const startTime = performance.now();

  const updateCounter = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use ease-out-expo for natural deceleration
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * easeOut);

    element.textContent = current + (target === 98 ? "%" : "+");

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target + (target === 98 ? "%" : "+");
    }
  };

  requestAnimationFrame(updateCounter);
};

// Intersection Observer for stat counters
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
        entry.target.classList.add("counted");
        animateCounter(entry.target);
      }
    });
  },
  { threshold: 0.5 },
);

statNumbers.forEach((stat) => statObserver.observe(stat));

// ===== SCROLL ANIMATIONS =====
const scrollAnimatedElements = document.querySelectorAll(
  ".service-card, .portfolio-card, .feature-card, .testimonial-card, .faq-item, .step-card",
);

const scrollAnimationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  },
);

scrollAnimatedElements.forEach((el) => {
  scrollAnimationObserver.observe(el);
});

// ===== 3D TILT EFFECT FOR SERVICE CARDS =====
const serviceCards = document.querySelectorAll(".service-card");

serviceCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  });
});
