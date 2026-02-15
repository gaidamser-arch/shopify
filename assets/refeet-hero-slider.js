(function () {
  const SLIDER_SELECTOR = ".refeet-hero-slider";
  const FALLBACK_AUTOPLAY_MS = 8000;
  const MIN_AUTOPLAY_MS = 3000;
  const initialized = new WeakSet();

  function parseAutoplayDuration(root) {
    const rawValue = Number.parseInt(root.dataset.autoplayMs, 10);
    if (Number.isNaN(rawValue)) {
      return FALLBACK_AUTOPLAY_MS;
    }

    return Math.max(rawValue, MIN_AUTOPLAY_MS);
  }

  function initSlider(root) {
    if (!root || initialized.has(root)) {
      return;
    }

    const slides = Array.from(root.querySelectorAll("[data-slide-index]"));
    const controls = Array.from(root.querySelectorAll("[data-slide-control]"));

    if (!slides.length || slides.length !== controls.length) {
      return;
    }

    initialized.add(root);

    const autoplayDuration = parseAutoplayDuration(root);
    const videos = slides.map((slide) => slide.querySelector("video"));
    let activeIndex = 0;
    let autoplayTimer = null;

    root.style.setProperty("--refeet-progress-duration", autoplayDuration + "ms");

    function syncVideos(nextIndex) {
      videos.forEach((video, videoIndex) => {
        if (!video) {
          return;
        }

        if (videoIndex === nextIndex) {
          const playResult = video.play();
          if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {});
          }
        } else {
          video.pause();
          try {
            video.currentTime = 0;
          } catch (error) {
            // Ignore blocked currentTime mutations.
          }
        }
      });
    }

    function setActiveSlide(nextIndex) {
      const normalizedIndex = (nextIndex + slides.length) % slides.length;
      activeIndex = normalizedIndex;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === normalizedIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      controls.forEach((control, controlIndex) => {
        const isActive = controlIndex === normalizedIndex;
        control.classList.toggle("is-active", isActive);
        control.setAttribute("aria-current", String(isActive));
      });

      syncVideos(normalizedIndex);
    }

    function stopAutoplay() {
      if (!autoplayTimer) {
        return;
      }

      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = window.setInterval(function () {
        setActiveSlide(activeIndex + 1);
      }, autoplayDuration);
    }

    controls.forEach((control, controlIndex) => {
      control.addEventListener("click", function () {
        setActiveSlide(controlIndex);
        startAutoplay();
      });
    });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    setActiveSlide(0);
    startAutoplay();
  }

  function initAllSliders(scope) {
    const root = scope || document;
    root.querySelectorAll(SLIDER_SELECTOR).forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAllSliders(document);
    });
  } else {
    initAllSliders(document);
  }

  document.addEventListener("shopify:section:load", function (event) {
    initAllSliders(event.target);
  });
})();
