(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════
     CONFIGURATION — UPDATE THIS VALUE
     ═══════════════════════════════════════════════════════════ */
  var CONFIG = {
    // Your deployed Google Apps Script Web App URL
    // It will look like: https://script.google.com/macros/s/ABCDEF.../exec
    SHEET_JSON_URL: "https://script.google.com/macros/s/AKfycbxGYt_KM0dTW-Jex-Y6C-krzSyvANQiaM7jCYWAoVPZ9A9qGwv3kw8Xqd-C9KH2DvAMgw/exec",

    // Auto-rotation interval in milliseconds (5 seconds)
    AUTO_ROTATE_MS: 5000,

    // Pause auto-rotation when user hovers over carousel
    PAUSE_ON_HOVER: true
  };

  /* ═══════════════════════════════════════════════════════════ */

  function init() {
    var carousel   = document.getElementById("dcCarousel");
    var loader     = document.getElementById("dcLoader");
    var currentIdx = 0;
    var slideCount = 0;
    var autoTimer  = null;

    // Guard: if the carousel container doesn't exist, bail out
    if (!carousel) {
      console.error("[dc-carousel] #dcCarousel element not found on page.");
      return;
    }

  // ── Fetch Slide Data from Google Sheets ──────────────────
  function fetchSlideData() {
    fetch(CONFIG.SHEET_JSON_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (slides) {
        // Handle Apps Script error response
        if (slides.error) throw new Error(slides.error);

        // Filter out any entries missing an image
        slides = slides.filter(function (s) {
          return s.image && s.image.length > 0;
        });

        if (slides.length === 0) throw new Error("No slides found in spreadsheet.");
        buildCarousel(slides);
      })
      .catch(function (err) {
        showError(err.message || "Failed to load slide data.");
      });
  }

  // ── Build Carousel DOM ───────────────────────────────────
  function buildCarousel(slides) {
    slideCount = slides.length;
    if (loader) loader.style.display = "none";

    // Track
    var track = document.createElement("div");
    track.className = "dc-carousel__track";
    track.id = "dcTrack";

    slides.forEach(function (s) {
      var slide = document.createElement("div");
      slide.className = "dc-carousel__slide";

      var anchor = document.createElement("a");
      anchor.href = s.link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      var img = document.createElement("img");
      img.src = s.image;
      img.alt = s.alt;
      img.loading = "lazy";

      anchor.appendChild(img);
      slide.appendChild(anchor);
      track.appendChild(slide);
    });

    carousel.appendChild(track);

    // Prev Arrow
    var prevBtn = document.createElement("button");
    prevBtn.className = "dc-carousel__arrow dc-carousel__arrow--prev";
    prevBtn.setAttribute("aria-label", "Previous slide");
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    prevBtn.addEventListener("click", function () { goTo(currentIdx - 1); resetAuto(); });
    carousel.appendChild(prevBtn);

    // Next Arrow
    var nextBtn = document.createElement("button");
    nextBtn.className = "dc-carousel__arrow dc-carousel__arrow--next";
    nextBtn.setAttribute("aria-label", "Next slide");
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.addEventListener("click", function () { goTo(currentIdx + 1); resetAuto(); });
    carousel.appendChild(nextBtn);

    // Dots
    if (slideCount > 1) {
      var dotsWrap = document.createElement("div");
      dotsWrap.className = "dc-carousel__dots";
      dotsWrap.id = "dcDots";

      for (var i = 0; i < slideCount; i++) {
        var dot = document.createElement("button");
        dot.className = "dc-carousel__dot" + (i === 0 ? " dc-carousel__dot--active" : "");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.dataset.index = i;
        dot.addEventListener("click", function () {
          goTo(parseInt(this.dataset.index, 10));
          resetAuto();
        });
        dotsWrap.appendChild(dot);
      }
      carousel.appendChild(dotsWrap);
    }

    // Hover pause
    if (CONFIG.PAUSE_ON_HOVER) {
      carousel.addEventListener("mouseenter", function () { clearInterval(autoTimer); });
      carousel.addEventListener("mouseleave", function () { startAuto(); });
    }

    // Touch / swipe support
    addSwipeSupport(track);

    // Start auto-rotation
    startAuto();
  }

  // ── Slide Navigation ─────────────────────────────────────
  function goTo(idx) {
    if (slideCount === 0) return;

    // Wrap around
    if (idx < 0) idx = slideCount - 1;
    if (idx >= slideCount) idx = 0;

    currentIdx = idx;

    var track = document.getElementById("dcTrack");
    if (track) {
      track.style.transform = "translateX(-" + (currentIdx * 100) + "%)";
    }

    // Update dots
    var dots = document.querySelectorAll("#dcDots .dc-carousel__dot");
    for (var i = 0; i < dots.length; i++) {
      if (i === currentIdx) {
        dots[i].classList.add("dc-carousel__dot--active");
      } else {
        dots[i].classList.remove("dc-carousel__dot--active");
      }
    }
  }

  // ── Auto-Rotation ────────────────────────────────────────
  function startAuto() {
    clearInterval(autoTimer);
    if (slideCount > 1) {
      autoTimer = setInterval(function () {
        goTo(currentIdx + 1);
      }, CONFIG.AUTO_ROTATE_MS);
    }
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // ── Touch / Swipe ────────────────────────────────────────
  function addSwipeSupport(track) {
    var startX = 0;
    var deltaX = 0;
    var swiping = false;

    track.addEventListener("touchstart", function (e) {
      startX  = e.touches[0].clientX;
      swiping = true;
    }, { passive: true });

    track.addEventListener("touchmove", function (e) {
      if (!swiping) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener("touchend", function () {
      if (!swiping) return;
      swiping = false;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) goTo(currentIdx + 1);
        else            goTo(currentIdx - 1);
        resetAuto();
      }
      deltaX = 0;
    });
  }

  // ── Error Display ────────────────────────────────────────
  function showError(msg) {
    if (loader) loader.style.display = "none";
    var errDiv = document.createElement("div");
    errDiv.className = "dc-carousel__error";
    errDiv.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      "<span>Carousel error: " + msg + "</span>";
    carousel.appendChild(errDiv);
  }

  // ── Init ─────────────────────────────────────────────────
  fetchSlideData();

  } // end init()

  // Run init when DOM is ready — safe regardless of script load order
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM already parsed — run immediately
    init();
  }

})();