/******/ (() => { // webpackBootstrap
/*!***************************************!*\
  !*** ./src/blocks/share-post/view.js ***!
  \***************************************/
/**
 * Share Post — front-end view script.
 *
 * Reveals the share button only when the Web Share API is available, then
 * calls navigator.share() with the post title and URL on click.
 */
(function () {
  'use strict';

  if (!navigator.share) {
    return;
  }
  function init() {
    document.querySelectorAll('.qp-share-post').forEach(function (el) {
      const btn = el.querySelector('.qp-share-post__btn');
      const title = el.dataset.title || '';
      const url = el.dataset.url || window.location.href;
      if (!btn) {
        return;
      }
      btn.hidden = false;
      btn.addEventListener('click', function () {
        navigator.share({
          title,
          url
        }).catch(function () {
          // User cancelled or share failed — no action needed.
        });
      });
    });
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