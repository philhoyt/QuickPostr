/******/ (() => { // webpackBootstrap
/*!******************************************!*\
  !*** ./src/blocks/media-gallery/view.js ***!
  \******************************************/
/**
 * Media Gallery — front-end slider.
 *
 * Initialises each .qp-media-gallery element: builds dot navigation,
 * fills the pill counter, handles keyboard/touch navigation, and computes the
 * container height from the tallest image's natural dimensions.
 */
(function () {
  function initGallery(gallery) {
    const viewport = gallery.querySelector('.qp-media-gallery__viewport');
    const track = gallery.querySelector('.qp-media-gallery__track');
    const dotsContainer = gallery.querySelector('.qp-media-gallery__dots');
    const pill = gallery.querySelector('.qp-media-gallery__pill');
    if (!viewport || !track || !dotsContainer || !pill) {
      return;
    }
    const items = Array.from(track.querySelectorAll(':scope > figure'));
    const total = items.length;
    if (total <= 1) {
      dotsContainer.hidden = true;
      return;
    }
    let current = 0;
    let pillTimer = null;

    // Build dot buttons.
    items.forEach(function (_, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qp-media-gallery__dot' + (i === 0 ? ' qp-media-gallery__dot--active' : '');
      btn.setAttribute('aria-label', 'Image ' + (i + 1) + ' of ' + total);
      btn.addEventListener('click', function () {
        goTo(i);
      });
      dotsContainer.appendChild(btn);
    });
    pill.textContent = '1/' + total;

    // Height: set container height to match the tallest image.
    const imgs = Array.from(track.querySelectorAll('img'));
    function computeHeight() {
      const containerWidth = viewport.offsetWidth || 600;
      let maxHeight = 0;
      imgs.forEach(function (img) {
        if (img.naturalWidth > 0) {
          const h = img.naturalHeight / img.naturalWidth * containerWidth;
          if (h > maxHeight) {
            maxHeight = h;
          }
        }
      });
      if (maxHeight > 0) {
        gallery.style.setProperty('--qp-gallery-height', maxHeight + 'px');
      }
    }
    const unloaded = imgs.filter(function (img) {
      return !img.complete;
    });
    if (unloaded.length === 0) {
      computeHeight();
    } else {
      Promise.all(unloaded.map(function (img) {
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, {
            once: true
          });
          img.addEventListener('error', resolve, {
            once: true
          });
        });
      })).then(computeHeight);
    }

    // Recompute on window resize.
    window.addEventListener('resize', computeHeight);
    function goTo(index) {
      current = Math.max(0, Math.min(index, total - 1));
      track.style.transform = 'translateX(-' + current * 100 + '%)';
      const dots = dotsContainer.querySelectorAll('.qp-media-gallery__dot');
      dots.forEach(function (dot, i) {
        dot.classList.toggle('qp-media-gallery__dot--active', i === current);
      });
      pill.textContent = current + 1 + '/' + total;
      pill.classList.add('qp-media-gallery__pill--visible');
      clearTimeout(pillTimer);
      pillTimer = setTimeout(function () {
        pill.classList.remove('qp-media-gallery__pill--visible');
      }, 1500);
    }

    // Keyboard navigation.
    gallery.setAttribute('tabindex', '0');
    gallery.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
      }
    });

    // Swipe gesture navigation.
    let touchStartX = 0;
    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, {
      passive: true
    });
    viewport.addEventListener('touchend', function (e) {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) {
        goTo(delta > 0 ? current + 1 : current - 1);
      }
    }, {
      passive: true
    });
  }
  function init() {
    document.querySelectorAll('.qp-media-gallery').forEach(initGallery);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
/******/ })()
;
//# sourceMappingURL=view.js.map