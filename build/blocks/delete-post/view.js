/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!****************************************!*\
  !*** ./src/blocks/delete-post/view.js ***!
  \****************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Delete Post — front-end view script.
 *
 * Handles the inline confirmation UI and REST API delete call.
 */
(function () {
  const cfg = window.quickpostrDeletePost || {};
  function init() {
    document.querySelectorAll('.qp-delete-post').forEach(function (el) {
      const postId = el.dataset.postId;
      const btn = el.querySelector('.qp-delete-post__btn');
      const confirm = el.querySelector('.qp-delete-post__confirm');
      const yes = el.querySelector('.qp-delete-post__yes');
      const no = el.querySelector('.qp-delete-post__no');
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
        yes.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Deleting…', 'quickpostr');
        const url = (cfg.restUrl || '').replace(/\/$/, '') + '/wp/v2/posts/' + postId;
        fetch(url, {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': cfg.nonce || ''
          },
          credentials: 'same-origin'
        }).then(function (res) {
          if (res.ok) {
            const card = el.closest('article, li, .wp-block-post');
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
          yes.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Yes, delete', 'quickpostr');
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
})();

/******/ })()
;
//# sourceMappingURL=view.js.map