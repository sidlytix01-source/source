/* =====================================================
   SIDLYTIX - CONTACT FORM
   Sends the enquiry to Google Apps Script (apps-script/Code.gs).
   Only shows "sent" when the script confirms { ok: true }.
   ===================================================== */
(() => {
  // Your Apps Script web app URL (Deploy > Manage deployments > Web app URL)
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwnplQI1giJLYGrYIaa64BJUBCWjMpUwnSKIFQ4YUg_aefIA9OYM5y5iDMe7m0uhEQIFw/exec";
  const MIN_FILL_MS = 3000; // must match MIN_FILL_MS in Code.gs
  const FALLBACK_EMAIL = "hello@sidlytix.com";

  const form = document.getElementById("contactForm");
  if (!form) return;

  const button = form.querySelector(".form-button");
  const statusEl = document.getElementById("formStatus");
  const buttonText = button.textContent;
  const loadedAt = Date.now();

  // Pre-select from URL: ?interest=email-summary and/or ?industry=healthcare
  const params = new URLSearchParams(location.search);
  [["interest", "#interest"], ["industry", "#industry"]].forEach(([param, sel]) => {
    const key = params.get(param);
    if (!key) return;
    const opt = form.querySelector(`${sel} option[data-key="${CSS.escape(key)}"]`);
    if (opt) opt.selected = true;
  });

  const showError = (msg) => {
    statusEl.classList.remove("is-ok");
    statusEl.innerHTML = "";
    statusEl.append(msg + " ");
    const a = document.createElement("a");
    a.href = `mailto:${FALLBACK_EMAIL}`;
    a.textContent = FALLBACK_EMAIL;
    statusEl.append(a);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const elapsed = Date.now() - loadedAt;
    // Real people need a few seconds; bots don't. Wait out the gap instead of failing a fast human.
    if (elapsed < MIN_FILL_MS) await new Promise((r) => setTimeout(r, MIN_FILL_MS - elapsed));

    button.textContent = "Sending...";
    button.disabled = true;

    const v = (n) => (form.elements[n] ? form.elements[n].value.trim() : "");
    const payload = {
      name: v("name"),
      email: v("email"),
      phone: v("phone"),
      country: v("country"),
      industry: v("industry"),
      service: v("service"), // "Interested in"
      message: v("message"),
      website: v("website"), // honeypot - checked by the script
      elapsed: Date.now() - loadedAt,
      page: location.pathname + location.search,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      // text/plain body = no CORS preflight, which Apps Script can't answer
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.ok !== true) throw new Error(out.error || "failed");

      form.reset();
      showSuccess();
    } catch (err) {
      showError(
        err && err.message === "invalid"
          ? "Please check your name and email address, or email us at"
          : "Sorry, your message didn't go through. Please try again or email us at",
      );
    } finally {
      clearTimeout(timer);
      button.textContent = buttonText;
      button.disabled = false;
    }
  });

  function showSuccess() {
    statusEl.classList.add("is-ok");
    statusEl.textContent = "Thanks, message received. We'll reply within 24 hours.";

    const popup = document.createElement("div");
    popup.className = "success-popup";
    popup.setAttribute("aria-hidden", "true"); // the status line above is what screen readers hear
    popup.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Thanks, message received.';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 4000);
  }
})();
