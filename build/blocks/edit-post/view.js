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
/*!**************************************!*\
  !*** ./src/blocks/edit-post/view.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Edit Post block — view script.
 *
 * On click: fetches the post via REST, then dispatches a cancelable
 * 'quickpostr:edit-post' custom event on document. If the Composer block is
 * on the page it listens for this event, calls e.preventDefault() to signal
 * it handled it, and pre-fills itself. If no Composer is present (or it hasn't
 * loaded yet), the event goes unhandled and we fall back to navigating to
 * ?qp-edit={id} on the home URL.
 *
 * @package
 */
(function () {
  const cfg = window.quickpostrEditPost ?? {};
  document.querySelectorAll('.qp-edit-post').forEach(function (wrapper) {
    const btn = wrapper.querySelector('.qp-edit-post__btn');
    const postId = parseInt(wrapper.dataset.postId, 10);
    if (!btn || !postId) {
      return;
    }
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Loading…', 'quickpostr');
      const url = cfg.restUrl + 'wp/v2/posts/' + postId + '?context=edit&_fields=id,title,content,format,status,featured_media,tags,categories';
      fetch(url, {
        headers: {
          'X-WP-Nonce': cfg.nonce
        }
      }).then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to fetch post.');
        }
        return res.json();
      }).then(function (post) {
        const event = new CustomEvent('quickpostr:edit-post', {
          bubbles: true,
          cancelable: true,
          detail: {
            post
          }
        });
        document.dispatchEvent(event);
        if (!event.defaultPrevented) {
          // Composer not on this page — navigate to it.
          window.location.href = (cfg.homeUrl || '/') + '?qp-edit=' + postId;
        } else {
          // Composer handled it — scroll to top of page.
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          btn.disabled = false;
          btn.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Edit', 'quickpostr');
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Edit', 'quickpostr');
      });
    });
  });
})();
})();

/******/ })()
;
//# sourceMappingURL=view.js.map