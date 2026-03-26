/******/ (() => { // webpackBootstrap
/*!****************************************!*\
  !*** ./src/blocks/delete-post/view.js ***!
  \****************************************/
/**
 * Delete Post — front-end view script.
 *
 * Handles the inline confirmation UI and REST API delete call.
 * No build step — plain ES5-compatible JavaScript.
 */
(function () {
  'use strict';

  var cfg = window.quickpostrDeletePost || {};
  function init() {
    document.querySelectorAll('.qp-delete-post').forEach(function (el) {
      var postId = el.dataset.postId;
      var btn = el.querySelector('.qp-delete-post__btn');
      var confirm = el.querySelector('.qp-delete-post__confirm');
      var yes = el.querySelector('.qp-delete-post__yes');
      var no = el.querySelector('.qp-delete-post__no');
      if (!btn || !confirm || !yes || !no) {
        return;
      }
      btn.addEventListener('click', function () {
        btn.hidden = true;
        confirm.hidden = false;
      });
      no.addEventListener('click', function () {
        btn.hidden = false;
        confirm.hidden = true;
      });
      yes.addEventListener('click', function () {
        yes.disabled = true;
        yes.textContent = 'Deleting\u2026';
        var url = (cfg.restUrl || '').replace(/\/$/, '') + '/wp/v2/posts/' + postId;
        fetch(url, {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': cfg.nonce || ''
          },
          credentials: 'same-origin'
        }).then(function (res) {
          if (res.ok) {
            var card = el.closest('article, li, .wp-block-post');
            if (card) {
              card.style.transition = 'opacity 200ms ease';
              card.style.opacity = '0';
              setTimeout(function () {
                card.remove();
              }, 210);
            }
          } else {
            resetUI();
          }
        }).catch(function () {
          resetUI();
        });
        function resetUI() {
          yes.disabled = false;
          yes.textContent = 'Yes, delete';
          confirm.hidden = true;
          btn.hidden = false;
        }
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