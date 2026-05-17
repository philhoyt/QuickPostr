/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/blocks/composer/Composer.jsx"
/*!******************************************!*\
  !*** ./src/blocks/composer/Composer.jsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Composer)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _TextComposer_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./TextComposer.jsx */ "./src/blocks/composer/TextComposer.jsx");
/* harmony import */ var _PhotoComposer_jsx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./PhotoComposer.jsx */ "./src/blocks/composer/PhotoComposer.jsx");
/* harmony import */ var _LinkComposer_jsx__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LinkComposer.jsx */ "./src/blocks/composer/LinkComposer.jsx");
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./api.js */ "./src/blocks/composer/api.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);







const config = window.quickpostrConfig ?? {};

/**
 * Front-end composer root.
 *
 * Renders the mode bar (Status / Photo) and the active composer.
 * On success, reloads the page so the theme's Query Loop reflects the new post.
 *
 * Edit mode: when ?qp-edit={id} is present in the URL, fetches the post,
 * pre-fills the correct composer, and submits as an update instead of a create.
 */
function Composer() {
  const initialMode = config.blockAttrs?.defaultMode ?? 'status';
  const [mode, setMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(initialMode);
  const [editPost, setEditPost] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [editLoading, setEditLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

  // Listen for 'quickpostr:edit-post' from the Edit Post block view script.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    function handleEditEvent(e) {
      e.preventDefault(); // Signal to view.js that we handled it.
      const post = e.detail?.post;
      if (!post) {
        return;
      }
      setEditPost(post);
      let newMode = 'status';
      if (post.format === 'image') {
        newMode = 'photo';
      } else if (post.format === 'link') {
        newMode = 'link';
      }
      setMode(newMode);
    }
    document.addEventListener('quickpostr:edit-post', handleEditEvent);
    return () => document.removeEventListener('quickpostr:edit-post', handleEditEvent);
  }, []);

  // Detect ?qp-edit param and load the post into the composer (fallback path).
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = parseInt(params.get('qp-edit'), 10);
    if (!editId) {
      return;
    }
    setEditLoading(true);
    (0,_api_js__WEBPACK_IMPORTED_MODULE_5__.getPost)(editId).then(post => {
      setEditPost(post);
      let editMode = 'status';
      if (post.format === 'image') {
        editMode = 'photo';
      } else if (post.format === 'link') {
        editMode = 'link';
      }
      setMode(editMode);
    }).catch(() => {}).finally(() => setEditLoading(false));
  }, []);
  const user = config.currentUser ?? {};
  const avatarUrl = user.avatarUrls?.['48'];
  const initials = (user.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  function handleSuccess() {
    // Remove qp-edit param before reloading so we return to normal compose mode.
    const url = new URL(window.location.href);
    url.searchParams.delete('qp-edit');
    window.history.replaceState({}, '', url);
    window.location.reload();
  }
  function handleCancelEdit() {
    const url = new URL(window.location.href);
    url.searchParams.delete('qp-edit');
    window.history.replaceState({}, '', url);
    setEditPost(null);
    setMode(initialMode);
  }
  if (editLoading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "qp-composer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("p", {
        className: "qp-composer__loading",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Loading…', 'quickpostr')
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: "qp-composer",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("header", {
      className: "qp-composer__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
        className: "qp-composer__identity",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
          className: "qp-composer__avatar",
          "aria-hidden": "true",
          children: avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("img", {
            src: avatarUrl,
            alt: "",
            width: "32",
            height: "32"
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
            children: initials
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
          className: "qp-composer__user-name",
          children: user.name
        })]
      }), editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("button", {
        type: "button",
        className: "qp-composer__cancel-edit",
        onClick: handleCancelEdit,
        children: ["\u2715 ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Cancel edit', 'quickpostr')]
      })]
    }), !editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "qp-composer__mode-bar",
      role: "tablist",
      "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Post type', 'quickpostr'),
      children: ['status', 'photo', 'link'].map(m => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
        role: "tab",
        "aria-selected": mode === m,
        className: `qp-composer__mode-btn${mode === m ? ' qp-composer__mode-btn--active' : ''}`,
        onClick: () => setMode(m),
        type: "button",
        children: {
          status: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Status', 'quickpostr'),
          photo: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Photo', 'quickpostr'),
          link: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Link', 'quickpostr')
        }[m]
      }, m))
    }), editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "qp-composer__edit-bar",
      role: "status",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Editing post', 'quickpostr')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "qp-composer__body",
      children: [mode === 'status' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_TextComposer_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], {
        onSuccess: handleSuccess,
        editPost: editPost ?? undefined
      }), mode === 'photo' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_PhotoComposer_jsx__WEBPACK_IMPORTED_MODULE_3__["default"], {
        onSuccess: handleSuccess,
        editPost: editPost ?? undefined
      }), mode === 'link' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_LinkComposer_jsx__WEBPACK_IMPORTED_MODULE_4__["default"], {
        onSuccess: handleSuccess,
        editPost: editPost ?? undefined
      })]
    })]
  });
}

/***/ },

/***/ "./src/blocks/composer/LinkComposer.jsx"
/*!**********************************************!*\
  !*** ./src/blocks/composer/LinkComposer.jsx ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LinkComposer)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api.js */ "./src/blocks/composer/api.js");
/* harmony import */ var _TagInput_jsx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./TagInput.jsx */ "./src/blocks/composer/TagInput.jsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const config = window.quickpostrConfig ?? {};

/**
 * Serialize a Better Bookmarks link-card block.
 * Produces a self-closing dynamic block comment that render.php handles.
 *
 * @param {Object} attrs — {url, title, description, image, domain}
 * @return {string} Serialized block comment string.
 */
function serializeLinkCard(attrs) {
  return '<!-- wp:better-bookmarks/link-card ' + JSON.stringify(attrs) + ' /-->';
}

/**
 * Extract URL and OG attributes from stored post content.
 *
 * Handles two formats:
 *   1. BB block:  <!-- wp:better-bookmarks/link-card {...} /-->
 *   2. Plain link: <p><a href="url">...</a></p>
 *
 * Returns an attrs object suitable for pre-filling the composer,
 * or null if nothing recognisable is found.
 *
 * @param {string} raw
 * @return {{url: string, title?: string, description?: string, image?: string, domain?: string}|null} Parsed attrs or null.
 */
function parsePostContent(raw) {
  // BB block comment
  const bbMatch = raw.match(/<!-- wp:better-bookmarks\/link-card ({.*?}) \/-->/);
  if (bbMatch) {
    try {
      return JSON.parse(bbMatch[1]);
    } catch {
      // fall through
    }
  }

  // Plain <a> fallback
  const aMatch = raw.match(/<a\s[^>]*href="([^"]+)"/);
  if (aMatch) {
    return {
      url: aMatch[1]
    };
  }
  return null;
}

/**
 * Link / bookmark composer.
 *
 * If Better Bookmarks is installed, fetches OG preview data and serializes a
 * better-bookmarks/link-card block as post content. Falls back to a plain
 * <a> paragraph if Better Bookmarks is unavailable or preview fetch fails.
 *
 * Props:
 *   onSuccess (wpPost) => void
 *   editPost  object|undefined — WP post object when in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
function LinkComposer({
  onSuccess,
  editPost
}) {
  const [url, setUrl] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [preview, setPreview] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [fetching, setFetching] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [fetchError, setFetchError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [submitting, setSubmitting] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [flash, setFlash] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [selectedTags, setSelectedTags] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [selectedCategories, setSelectedCategories] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
  const bbAvailable = config.betterBookmarks ?? false;
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Pre-populate from editPost.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!editPost) {
      return;
    }
    const raw = editPost.content?.raw ?? '';
    const parsed = parsePostContent(raw);
    if (parsed?.url) {
      setUrl(parsed.url);
      // Use the stored attrs directly as preview — no re-fetch needed.
      setPreview(parsed);
    }
    if (editPost.tags?.length) {
      setSelectedTags(editPost.tags);
    }
    if (editPost.categories?.length) {
      setSelectedCategories(editPost.categories);
    }
  }, [editPost]);
  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed || fetching) {
      return;
    }
    setFetching(true);
    setFetchError(null);
    setPreview(null);
    try {
      const data = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.fetchLinkPreview)(trimmed);
      setPreview(data);
    } catch {
      setFetchError((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Could not fetch preview. Check the URL and try again.', 'quickpostr'));
    } finally {
      setFetching(false);
    }
  }
  function handleUrlKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (bbAvailable) {
        handleFetch();
      }
    }
  }
  function handleUrlChange(e) {
    setUrl(e.target.value);
    setPreview(null);
    setFetchError(null);
  }
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    const trimmed = url.trim();
    if (!trimmed || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let content;
      if (bbAvailable && preview) {
        content = serializeLinkCard(preview);
      } else {
        const label = preview?.title || trimmed;
        content = `<p><a href="${trimmed}">${label}</a></p>`;
      }
      const fields = {
        content,
        format: 'link',
        tags: selectedTags,
        categories: selectedCategories
      };
      const wpPost = editPost ? await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.updatePost)(editPost.id, fields) : await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.createPost)({
        ...fields,
        title: '',
        status: defaultStatus,
        meta: {
          _quickpostr_post: '1'
        }
      });
      onSuccess?.(wpPost);
      if (!editPost) {
        setUrl('');
        setPreview(null);
        setSelectedTags([]);
        setSelectedCategories(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
        setFlash(true);
        setTimeout(() => setFlash(false), 2500);
      }
    } catch (err) {
      setError(err.message ?? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to publish. Please try again.', 'quickpostr'));
    } finally {
      setSubmitting(false);
    }
  }, [url, preview, selectedTags, selectedCategories, submitting, defaultStatus, onSuccess, bbAvailable, editPost]);
  const canSubmit = url.trim() && !submitting;
  let submitLabel;
  if (editPost) {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Update', 'quickpostr');
  } else if (defaultStatus === 'draft') {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Save Draft', 'quickpostr');
  } else {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Post', 'quickpostr');
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "qp-link-composer",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "qp-link-composer__url-row",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("input", {
        type: "url",
        className: "qp-link-composer__url-input",
        placeholder: bbAvailable ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Paste a URL and press Enter…', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Paste a URL…', 'quickpostr'),
        value: url,
        onChange: handleUrlChange,
        onKeyDown: handleUrlKeyDown,
        disabled: submitting,
        "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('URL', 'quickpostr')
      }), bbAvailable && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
        type: "button",
        className: "qp-link-composer__fetch-btn",
        onClick: handleFetch,
        disabled: !url.trim() || fetching,
        children: fetching ? '…' : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Preview', 'quickpostr')
      })]
    }), fetchError && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "qp-composer-error",
      role: "alert",
      children: fetchError
    }), preview && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "qp-link-composer__preview",
      children: [preview.image && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
        className: "qp-link-composer__preview-image",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("img", {
          src: preview.image,
          alt: "",
          loading: "lazy"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "qp-link-composer__preview-body",
        children: [preview.domain && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
          className: "qp-link-composer__preview-domain",
          children: preview.domain
        }), preview.title && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("strong", {
          className: "qp-link-composer__preview-title",
          children: preview.title
        }), preview.description && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
          className: "qp-link-composer__preview-description",
          children: preview.description
        })]
      })]
    }), !bbAvailable && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "qp-link-composer__no-bb",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: plugin name */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Install %s to include a rich link card in the post.', 'quickpostr'), 'Better Bookmarks')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_TagInput_jsx__WEBPACK_IMPORTED_MODULE_3__["default"], {
      selectedTags: selectedTags,
      selectedCategories: selectedCategories,
      onTagsChange: setSelectedTags,
      onCategoriesChange: setSelectedCategories
    }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "qp-composer-error",
      role: "alert",
      children: error
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("footer", {
      className: "qp-link-composer__footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
        className: "qp-composer-submit",
        type: "button",
        onClick: handleSubmit,
        disabled: !canSubmit,
        children: submitting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Saving…', 'quickpostr') : submitLabel
      })
    }), flash && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "qp-composer-flash",
      role: "status",
      "aria-live": "assertive",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Posted!', 'quickpostr')
    })]
  });
}

/***/ },

/***/ "./src/blocks/composer/PhotoComposer.jsx"
/*!***********************************************!*\
  !*** ./src/blocks/composer/PhotoComposer.jsx ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PhotoComposer)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api.js */ "./src/blocks/composer/api.js");
/* harmony import */ var _TagInput_jsx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./TagInput.jsx */ "./src/blocks/composer/TagInput.jsx");
/* harmony import */ var _useAutoTitle_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./useAutoTitle.js */ "./src/blocks/composer/useAutoTitle.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);






const config = window.quickpostrConfig ?? {};
const MAX_BYTES = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

/**
 * Photo post composer.
 *
 * Flow: pick/drop image → optional caption → upload media → create post.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
function PhotoComposer({
  onSuccess,
  editPost
}) {
  const [file, setFile] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [preview, setPreview] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [libraryMediaId, setLibraryMediaId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [caption, setCaption] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [dragging, setDragging] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [selectedTags, setSelectedTags] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [selectedCategories, setSelectedCategories] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
  const [submitting, setSubmitting] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [flash, setFlash] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const fileInputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Pre-fill caption, terms, and load existing photo from editPost.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!editPost) {
      return;
    }
    setCaption(editPost.content?.raw ?? '');
    setSelectedTags(editPost.tags ?? []);
    let defaultCats;
    if (editPost.categories?.length) {
      defaultCats = editPost.categories;
    } else if (config.settings?.defaultCategory) {
      defaultCats = [config.settings.defaultCategory];
    } else {
      defaultCats = [];
    }
    setSelectedCategories(defaultCats);
    if (editPost.featured_media) {
      (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.getMediaUrl)(editPost.featured_media).then(url => setExistingPhotoUrl(url)).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function pickFile(f) {
    if (!f) {
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Please select an image file.', 'quickpostr'));
      return;
    }
    if (f.size > MAX_BYTES) {
      const mb = Math.round(MAX_BYTES / 1024 / 1024);
      setError((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %d: maximum file size in MB */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('File too large — maximum size is %d MB.', 'quickpostr'), mb));
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  function handleInputChange(e) {
    pickFile(e.target.files?.[0] ?? null);
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }
  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave() {
    setDragging(false);
  }
  function clearFile() {
    if (file && preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setExistingPhotoUrl(null);
    setLibraryMediaId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
  function openMediaLibrary() {
    const frame = window.wp?.media({
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Select a Photo', 'quickpostr'),
      button: {
        text: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Use this photo', 'quickpostr')
      },
      multiple: false,
      library: {
        type: 'image'
      }
    });
    if (!frame) {
      return;
    }
    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON();
      setError(null);
      setFile(null);
      setLibraryMediaId(attachment.id);
      setPreview(attachment.sizes?.large?.url ?? attachment.url);
    });
    frame.open();
  }
  async function handleSubmit() {
    // In edit mode without a new file or library pick, we can still update the caption.
    if (!editPost && !file && !libraryMediaId) {
      return;
    }
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let wpPost;
      if (editPost && !file && !libraryMediaId) {
        // Edit mode: update caption/tags only, keep existing featured media.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.updatePost)(editPost.id, {
          content: caption,
          status: defaultStatus,
          tags: selectedTags,
          categories: selectedCategories
        });
        onSuccess?.(wpPost, '');
      } else {
        // Resolve the media ID — either from library pick or a fresh upload.
        let mediaId;
        let mediaUrl;
        if (libraryMediaId) {
          mediaId = libraryMediaId;
          mediaUrl = preview;
        } else {
          const media = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.uploadMedia)(file);
          mediaId = media.id;
          mediaUrl = media.source_url;
        }
        if (editPost) {
          wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.updatePost)(editPost.id, {
            content: caption,
            status: defaultStatus,
            featured_media: mediaId,
            tags: selectedTags,
            categories: selectedCategories
          });
        } else {
          wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.createPost)({
            title: (0,_useAutoTitle_js__WEBPACK_IMPORTED_MODULE_4__.generateTitle)('photo', '', caption),
            content: caption,
            status: defaultStatus,
            format: 'image',
            featured_media: mediaId,
            tags: selectedTags,
            categories: selectedCategories,
            meta: {
              _quickpostr_post: '1'
            }
          });
        }
        onSuccess?.(wpPost, mediaUrl);
      }

      // Reset form.
      setFile(null);
      setPreview(null);
      setLibraryMediaId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCaption('');
      setSelectedTags([]);
      setSelectedCategories(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
    } catch (err) {
      setError(err.message ?? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to publish. Please try again.', 'quickpostr'));
    } finally {
      setSubmitting(false);
    }
  }
  function handleDropzoneKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }
  const dropzoneClass = ['qp-photo-dropzone', dragging ? 'qp-photo-dropzone--active' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
    className: "qp-photo-composer",
    children: [!file && !preview && !existingPhotoUrl && !(editPost && editPost.featured_media) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
      className: dropzoneClass,
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onClick: () => fileInputRef.current?.click(),
      onKeyDown: handleDropzoneKeyDown,
      role: "button",
      tabIndex: 0,
      "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Choose a photo to upload', 'quickpostr'),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("svg", {
        className: "qp-photo-dropzone__icon",
        "aria-hidden": "true",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("rect", {
          x: "3",
          y: "3",
          width: "18",
          height: "18",
          rx: "3",
          ry: "3"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("circle", {
          cx: "8.5",
          cy: "8.5",
          r: "1.5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("polyline", {
          points: "21 15 16 10 5 21"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("span", {
        className: "qp-photo-dropzone__label",
        children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Drop a photo here,', 'quickpostr'), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
          className: "qp-photo-dropzone__browse",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('browse', 'quickpostr')
        }), window.wp?.media && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
          children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)(', or', 'quickpostr'), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("button", {
            type: "button",
            className: "qp-photo-dropzone__library",
            onClick: e => {
              e.stopPropagation();
              openMediaLibrary();
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('choose from library', 'quickpostr')
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("input", {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        className: "qp-photo-dropzone__input",
        onChange: handleInputChange,
        "aria-hidden": "true",
        tabIndex: -1
      })]
    }), (file || preview || existingPhotoUrl) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
      className: "qp-photo-preview",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("img", {
        src: preview ?? existingPhotoUrl,
        alt: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Preview', 'quickpostr'),
        className: "qp-photo-preview__img"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("button", {
        type: "button",
        className: "qp-photo-preview__remove",
        onClick: clearFile,
        "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Remove photo', 'quickpostr'),
        disabled: submitting,
        children: "\u2715"
      })]
    }), (file || libraryMediaId || editPost) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("textarea", {
        className: "qp-photo-caption",
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add a caption… (optional)', 'quickpostr'),
        value: caption,
        onChange: e => setCaption(e.target.value),
        disabled: submitting,
        rows: 3,
        "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Photo caption', 'quickpostr')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_TagInput_jsx__WEBPACK_IMPORTED_MODULE_3__["default"], {
        selectedTags: selectedTags,
        selectedCategories: selectedCategories,
        onTagsChange: setSelectedTags,
        onCategoriesChange: setSelectedCategories
      })]
    }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("p", {
      className: "qp-composer-error",
      role: "alert",
      children: error
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("footer", {
      className: "qp-photo-composer__footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("button", {
        className: "qp-composer-submit",
        onClick: handleSubmit,
        disabled: !editPost && !file && !libraryMediaId || submitting,
        "aria-label": submitting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Publishing…', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Submit', 'quickpostr'),
        type: "button",
        children: (() => {
          if (submitting) {
            return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Publishing…', 'quickpostr');
          }
          if (editPost) {
            return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Update', 'quickpostr');
          }
          return defaultStatus === 'draft' ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Save Draft', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Post', 'quickpostr');
        })()
      })
    }), flash && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
      className: "qp-composer-flash",
      role: "status",
      "aria-live": "assertive",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Posted!', 'quickpostr')
    })]
  });
}

/***/ },

/***/ "./src/blocks/composer/SlugPreview.jsx"
/*!*********************************************!*\
  !*** ./src/blocks/composer/SlugPreview.jsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SlugPreview)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


const config = window.quickpostrConfig ?? {};

/**
 * Displays the auto-generated title preview below the composer.
 * Hidden when showSlugPreview is false in block attributes or settings.
 *
 * Future: allow user to override the title for "micro long-form" posts.
 *
 * Props:
 *   title {string} — generated title to display
 * @param {Object} root0
 * @param {string} root0.title
 */
function SlugPreview({
  title
}) {
  const showFromAttrs = config.blockAttrs?.showSlugPreview;
  const showFromSettings = config.settings?.showSlugPreview;
  const show = showFromAttrs !== undefined ? showFromAttrs : showFromSettings;
  if (!show || !title) {
    return null;
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("p", {
    className: "qp-slug-preview",
    "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Auto-generated title preview', 'quickpostr'),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "qp-slug-preview__label",
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Title', 'quickpostr')
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "qp-slug-preview__value",
      children: title
    })]
  });
}

/***/ },

/***/ "./src/blocks/composer/TagInput.jsx"
/*!******************************************!*\
  !*** ./src/blocks/composer/TagInput.jsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TagInput)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api.js */ "./src/blocks/composer/api.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




/**
 * Tag + category input with typeahead and inline creation.
 *
 * Props:
 *   selectedTags       {number[]}  — array of tag IDs
 *   selectedCategories {number[]}  — array of category IDs
 *   onTagsChange       (ids) => void
 *   onCategoriesChange (ids) => void
 * @param {Object}   root0
 * @param {number[]} root0.selectedTags
 * @param {number[]} root0.selectedCategories
 * @param {Function} root0.onTagsChange
 * @param {Function} root0.onCategoriesChange
 */

function TagInput({
  selectedTags,
  selectedCategories,
  onTagsChange,
  onCategoriesChange
}) {
  // Tags state
  const [tagInput, setTagInput] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [tagSuggestions, setTagSuggestions] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [tagNames, setTagNames] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({}); // id → name
  const [tagOpen, setTagOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [creatingTag, setCreatingTag] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

  // Categories state
  const [catInput, setCatInput] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [catSuggestions, setCatSuggestions] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [catNames, setCatNames] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({}); // id → name
  const [catOpen, setCatOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [creatingCat, setCreatingCat] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const tagTimer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const catTimer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const wrapperRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const tagInputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const catInputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Resolve names for any pre-selected tags (e.g. when editing a post).
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    selectedTags.forEach(id => {
      if (!tagNames[id]) {
        (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.getTag)(id).then(tag => setTagNames(prev => ({
          ...prev,
          [tag.id]: tag.name
        }))).catch(() => {});
      }
    });
  }, [selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve names for any pre-selected categories (e.g. default category or editing a post).
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    selectedCategories.forEach(id => {
      if (!catNames[id]) {
        (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.getCategory)(id).then(cat => setCatNames(prev => ({
          ...prev,
          [cat.id]: cat.name
        }))).catch(() => {});
      }
    });
  }, [selectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on outside click.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setTagOpen(false);
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const handleTagInput = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    const value = e.target.value;
    setTagInput(value);
    clearTimeout(tagTimer.current);
    if (value.trim().length < 2) {
      setTagSuggestions([]);
      setTagOpen(false);
      return;
    }
    setTagOpen(true);
    tagTimer.current = setTimeout(async () => {
      try {
        const results = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.searchTags)(value.trim());
        setTagSuggestions(results);
      } catch (_) {}
    }, 250);
  }, []);
  function addTag(tag) {
    if (!selectedTags.includes(tag.id)) {
      setTagNames(prev => ({
        ...prev,
        [tag.id]: tag.name
      }));
      onTagsChange([...selectedTags, tag.id]);
    }
    setTagInput('');
    setTagSuggestions([]);
    setTagOpen(false);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }
  async function handleCreateTag(name) {
    if (creatingTag) {
      return;
    }
    setCreatingTag(true);
    try {
      const tag = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.createTag)(name);
      addTag(tag);
    } catch (_) {} finally {
      setCreatingTag(false);
    }
  }
  function handleTagKeyDown(e) {
    if (e.key !== 'Enter') {
      return;
    }
    const trimmed = tagInput.trim();
    if (!trimmed) {
      return;
    }
    e.preventDefault();
    const exact = tagSuggestions.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      addTag(exact);
    } else if (trimmed.length >= 2) {
      handleCreateTag(trimmed);
    }
  }
  function removeTag(id) {
    onTagsChange(selectedTags.filter(t => t !== id));
  }

  // ── Categories ────────────────────────────────────────────────────────────

  const handleCatInput = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    const value = e.target.value;
    setCatInput(value);
    clearTimeout(catTimer.current);
    if (value.trim().length < 2) {
      setCatSuggestions([]);
      setCatOpen(false);
      return;
    }
    setCatOpen(true);
    catTimer.current = setTimeout(async () => {
      try {
        const results = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.searchCategories)(value.trim());
        setCatSuggestions(results);
      } catch (_) {}
    }, 250);
  }, []);
  function addCategory(cat) {
    if (!selectedCategories.includes(cat.id)) {
      setCatNames(prev => ({
        ...prev,
        [cat.id]: cat.name
      }));
      onCategoriesChange([...selectedCategories, cat.id]);
    }
    setCatInput('');
    setCatSuggestions([]);
    setCatOpen(false);
    setTimeout(() => catInputRef.current?.focus(), 0);
  }
  async function handleCreateCategory(name) {
    if (creatingCat) {
      return;
    }
    setCreatingCat(true);
    try {
      const cat = await (0,_api_js__WEBPACK_IMPORTED_MODULE_2__.createCategory)(name);
      addCategory(cat);
    } catch (_) {} finally {
      setCreatingCat(false);
    }
  }
  function handleCatKeyDown(e) {
    if (e.key !== 'Enter') {
      return;
    }
    const trimmed = catInput.trim();
    if (!trimmed) {
      return;
    }
    e.preventDefault();
    const exact = catSuggestions.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      addCategory(exact);
    } else if (trimmed.length >= 2) {
      handleCreateCategory(trimmed);
    }
  }
  function removeCategory(id) {
    onCategoriesChange(selectedCategories.filter(c => c !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "qp-tag-input",
    ref: wrapperRef,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "qp-tag-input__tags",
      children: [selectedTags.map(id => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
        className: "qp-tag-input__tag",
        children: [tagNames[id] ?? `#${id}`, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          type: "button",
          className: "qp-tag-input__tag-remove",
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: tag name */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Remove tag %s', 'quickpostr'), tagNames[id] ?? id),
          onClick: () => removeTag(id),
          children: "\xD7"
        })]
      }, id)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "qp-tag-input__search-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
          ref: tagInputRef,
          type: "text",
          className: "qp-tag-input__search",
          value: tagInput,
          onChange: handleTagInput,
          onKeyDown: handleTagKeyDown,
          placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add tags…', 'quickpostr'),
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Search tags', 'quickpostr'),
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-expanded": tagOpen,
          disabled: creatingTag
        }), tagOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("ul", {
          className: "qp-tag-input__suggestions",
          role: "listbox",
          children: [tagSuggestions.filter(tag => !selectedTags.includes(tag.id)).map(tag => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
            role: "option",
            "aria-selected": false,
            className: "qp-tag-input__suggestion",
            onMouseDown: () => addTag(tag),
            children: tag.name
          }, tag.id)), (() => {
            const lc = tagInput.trim().toLowerCase();
            const exact = tagSuggestions.find(t => t.name.toLowerCase() === lc);
            const already = exact ? selectedTags.includes(exact.id) : Object.entries(tagNames).some(([, n]) => n.toLowerCase() === lc);
            if (already) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
                role: "option",
                "aria-selected": false,
                className: "qp-tag-input__suggestion qp-tag-input__suggestion--already",
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Already added', 'quickpostr')
              });
            }
            if (!exact) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
                role: "option",
                "aria-selected": false,
                className: "qp-tag-input__suggestion qp-tag-input__suggestion--create",
                onMouseDown: () => handleCreateTag(tagInput.trim()),
                children: creatingTag ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Creating…', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: tag name */
                (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Create "%s"', 'quickpostr'), tagInput.trim())
              });
            }
            return null;
          })()]
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "qp-tag-input__tags",
      children: [selectedCategories.map(id => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
        className: "qp-tag-input__tag qp-tag-input__tag--cat",
        children: [catNames[id] ?? `#${id}`, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          type: "button",
          className: "qp-tag-input__tag-remove",
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: category name */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Remove category %s', 'quickpostr'), catNames[id] ?? id),
          onClick: () => removeCategory(id),
          children: "\xD7"
        })]
      }, id)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "qp-tag-input__search-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
          ref: catInputRef,
          type: "text",
          className: "qp-tag-input__search",
          value: catInput,
          onChange: handleCatInput,
          onKeyDown: handleCatKeyDown,
          placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add categories…', 'quickpostr'),
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Search categories', 'quickpostr'),
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-expanded": catOpen,
          disabled: creatingCat
        }), catOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("ul", {
          className: "qp-tag-input__suggestions",
          role: "listbox",
          children: [catSuggestions.filter(cat => !selectedCategories.includes(cat.id)).map(cat => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
            role: "option",
            "aria-selected": false,
            className: "qp-tag-input__suggestion",
            onMouseDown: () => addCategory(cat),
            children: cat.name
          }, cat.id)), (() => {
            const lc = catInput.trim().toLowerCase();
            const exact = catSuggestions.find(c => c.name.toLowerCase() === lc);
            const already = exact ? selectedCategories.includes(exact.id) : Object.entries(catNames).some(([, n]) => n.toLowerCase() === lc);
            if (already) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
                role: "option",
                "aria-selected": false,
                className: "qp-tag-input__suggestion qp-tag-input__suggestion--already",
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Already added', 'quickpostr')
              });
            }
            if (!exact) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
                role: "option",
                "aria-selected": false,
                className: "qp-tag-input__suggestion qp-tag-input__suggestion--create",
                onMouseDown: () => handleCreateCategory(catInput.trim()),
                children: creatingCat ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Creating…', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: category name */
                (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Create "%s"', 'quickpostr'), catInput.trim())
              });
            }
            return null;
          })()]
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/blocks/composer/TextComposer.jsx"
/*!**********************************************!*\
  !*** ./src/blocks/composer/TextComposer.jsx ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TextComposer)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/rich-text */ "@wordpress/rich-text");
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _useAutoTitle_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./useAutoTitle.js */ "./src/blocks/composer/useAutoTitle.js");
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./api.js */ "./src/blocks/composer/api.js");
/* harmony import */ var _SlugPreview_jsx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./SlugPreview.jsx */ "./src/blocks/composer/SlugPreview.jsx");
/* harmony import */ var _TagInput_jsx__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./TagInput.jsx */ "./src/blocks/composer/TagInput.jsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);








const config = window.quickpostrConfig ?? {};

/** Debounce delay (ms) for draft auto-save. */
const DRAFT_SAVE_DELAY = 800;

/**
 * Minimal rich-text toolbar button.
 * @param {Object}   root0
 * @param {string}   root0.label
 * @param {Function} root0.onMouseDown
 * @param {*}        root0.children
 */
function ToolbarButton({
  label,
  onMouseDown,
  children
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("button", {
    type: "button",
    className: "qp-rich-editor__toolbar-btn",
    "aria-label": label,
    onMouseDown: e => {
      // Prevent blur on the contenteditable before command runs.
      e.preventDefault();
      onMouseDown();
    },
    children: children
  });
}

/**
 * Lightweight contenteditable rich text editor.
 * Uses @wordpress/rich-text for HTML normalization on read.
 * Uses document.execCommand for format toggling (broad browser support).
 *
 * Props:
 *   placeholder {string}
 *   disabled    {boolean}
 *   editorRef   {React.RefObject} — forwarded ref to the contenteditable div
 *   onChange    (html: string) => void
 * @param {Object}          root0
 * @param {string}          root0.placeholder
 * @param {boolean}         root0.disabled
 * @param {React.RefObject} root0.editorRef
 * @param {Function}        root0.onChange
 */
function RichEditor({
  placeholder,
  disabled,
  editorRef,
  onChange
}) {
  const [isEmpty, setIsEmpty] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  function handleInput() {
    const el = editorRef.current;
    if (!el) {
      return;
    }
    const empty = el.innerText.trim() === '';
    setIsEmpty(empty);
    // Read normalized HTML via @wordpress/rich-text.
    const rawHtml = empty ? '' : el.innerHTML;
    const value = (0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_2__.create)({
      html: rawHtml
    });
    onChange((0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_2__.toHTMLString)({
      value
    }));
  }
  function handleKeyDown(e) {
    // Prevent Enter from creating <div> wrappers in some browsers.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  }
  function execFormat(command) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleInput();
  }
  function handleLink() {
    // eslint-disable-next-line no-alert
    const url = window.prompt((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Enter URL:', 'quickpostr'));
    if (url) {
      editorRef.current?.focus();
      document.execCommand('createLink', false, url);
      handleInput();
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
    className: "qp-rich-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "qp-rich-editor__toolbar",
      role: "toolbar",
      "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Formatting', 'quickpostr'),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ToolbarButton, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Bold', 'quickpostr'),
        onMouseDown: () => execFormat('bold'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
          children: "B"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ToolbarButton, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Italic', 'quickpostr'),
        onMouseDown: () => execFormat('italic'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("em", {
          children: "I"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(ToolbarButton, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Link', 'quickpostr'),
        onMouseDown: handleLink,
        children: "\uD83D\uDD17"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
      ref: editorRef,
      contentEditable: !disabled,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      className: "qp-rich-editor__content",
      "data-placeholder": isEmpty ? placeholder : undefined,
      role: "textbox",
      tabIndex: 0,
      "aria-multiline": "true",
      "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Post content', 'quickpostr'),
      "aria-placeholder": placeholder
    })]
  });
}

/**
 * Status / text post composer.
 *
 * Props:
 *   onSuccess (wpPost) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
function TextComposer({
  onSuccess,
  editPost
}) {
  const editorRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const draftTimer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const wasEditingRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const [html, setHtml] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [selectedTags, setSelectedTags] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [selectedCategories, setSelectedCategories] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
  const [submitting, setSubmitting] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [flash, setFlash] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [draftId, setDraftId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [draftBanner, setDraftBanner] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [draftPost, setDraftPost] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const placeholder = config.blockAttrs?.placeholderText ?? "What's on your mind?";
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Plain-text content for title preview and character count.
  const plainText = editorRef.current?.innerText?.trim() ?? '';
  const title = (0,_useAutoTitle_js__WEBPACK_IMPORTED_MODULE_3__.generateTitle)('text', plainText, '');

  // On mount: check for an existing draft.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (editPost) {
      return; // handled by the editPost effect below
    }
    (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.getDraft)().then(draft => {
      if (draft && draft.format !== 'image') {
        setDraftPost(draft);
        setDraftBanner(true);
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill or clear the editor when editPost changes.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!editPost) {
      // Cancel edit — reset only if we were previously editing.
      if (wasEditingRef.current) {
        wasEditingRef.current = false;
        setDraftId(null);
        setHtml('');
        setSelectedTags([]);
        setSelectedCategories(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
          editorRef.current.dispatchEvent(new Event('input', {
            bubbles: true
          }));
        }
      }
      return;
    }
    wasEditingRef.current = true;
    const raw = editPost.content?.raw ?? '';
    setDraftId(editPost.id);
    setHtml(raw);
    setSelectedTags(editPost.tags ?? []);
    let defaultCats;
    if (editPost.categories?.length) {
      defaultCats = editPost.categories;
    } else if (config.settings?.defaultCategory) {
      defaultCats = [config.settings.defaultCategory];
    } else {
      defaultCats = [];
    }
    setSelectedCategories(defaultCats);
    if (editorRef.current) {
      editorRef.current.innerHTML = raw;
      // Trigger RichEditor's handleInput so isEmpty state clears the placeholder.
      editorRef.current.dispatchEvent(new Event('input', {
        bubbles: true
      }));
    }
  }, [editPost]);

  /**
   * Schedule a debounced draft save whenever content changes.
   * @param {string} content
   */
  function scheduleDraftSave(content) {
    if (editPost) {
      return;
    } // Edit mode: no auto-save as draft.
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      if (!content) {
        return;
      }
      try {
        if (draftId) {
          await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.updatePost)(draftId, {
            content,
            status: 'draft'
          });
        } else {
          const newDraft = await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.createPost)({
            title: '',
            content,
            status: 'draft',
            format: 'status',
            meta: {
              _quickpostr_post: '1'
            }
          });
          setDraftId(newDraft.id);
        }
      } catch (_) {
        // Silent: draft save failures don't interrupt the user.
      }
    }, DRAFT_SAVE_DELAY);
  }
  function handleHtmlChange(newHtml) {
    setHtml(newHtml);
    scheduleDraftSave(newHtml);
  }
  function resumeDraft() {
    const raw = draftPost?.content?.raw ?? '';
    setDraftId(draftPost.id);
    setHtml(raw);
    if (editorRef.current) {
      editorRef.current.innerHTML = raw;
    }
    setDraftBanner(false);
    setDraftPost(null);
    editorRef.current?.focus();
  }
  async function handleDiscardDraft() {
    setDraftBanner(false);
    if (draftPost?.id) {
      try {
        await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.discardDraft)(draftPost.id);
      } catch (_) {}
    }
    setDraftPost(null);
  }
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    const plain = editorRef.current?.innerText?.trim() ?? '';
    if (!plain || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let wpPost;
      if (editPost) {
        // Edit mode: update the existing post.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.updatePost)(editPost.id, {
          content: html,
          status: defaultStatus,
          tags: selectedTags,
          categories: selectedCategories
        });
      } else if (draftId) {
        // Publish the auto-saved draft.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.updatePost)(draftId, {
          title: '',
          content: html,
          status: defaultStatus,
          format: 'status',
          tags: selectedTags,
          categories: selectedCategories
        });
      } else {
        // No draft: create a new post.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_4__.createPost)({
          title: '',
          content: html,
          status: defaultStatus,
          format: 'status',
          tags: selectedTags,
          categories: selectedCategories,
          meta: {
            _quickpostr_post: '1'
          }
        });
      }
      onSuccess?.(wpPost);

      // Reset.
      clearTimeout(draftTimer.current);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setHtml('');
      setDraftId(null);
      setSelectedTags([]);
      setSelectedCategories(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
    } catch (err) {
      setError(err.message ?? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to publish. Please try again.', 'quickpostr'));
    } finally {
      setSubmitting(false);
    }
  }, [html, selectedTags, selectedCategories, submitting, defaultStatus, onSuccess, editPost, draftId]);
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  }
  const hasContent = (editorRef.current?.innerText?.trim() ?? '').length > 0;
  let submitLabel;
  if (editPost) {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Update', 'quickpostr');
  } else if (defaultStatus === 'draft') {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Save Draft', 'quickpostr');
  } else {
    submitLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Post', 'quickpostr');
  }
  return (
    /*#__PURE__*/
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "qp-text-composer",
      onKeyDown: handleKeyDown,
      children: [draftBanner && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
        className: "qp-draft-banner",
        role: "status",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("span", {
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Resume your saved draft?', 'quickpostr')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
          className: "qp-draft-banner__actions",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("button", {
            type: "button",
            className: "qp-draft-banner__resume",
            onClick: resumeDraft,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Resume', 'quickpostr')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("button", {
            type: "button",
            className: "qp-draft-banner__discard",
            onClick: handleDiscardDraft,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Discard', 'quickpostr')
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(RichEditor, {
        placeholder: placeholder,
        disabled: submitting,
        editorRef: editorRef,
        onChange: handleHtmlChange
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_SlugPreview_jsx__WEBPACK_IMPORTED_MODULE_5__["default"], {
        title: title
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_TagInput_jsx__WEBPACK_IMPORTED_MODULE_6__["default"], {
        selectedTags: selectedTags,
        selectedCategories: selectedCategories,
        onTagsChange: setSelectedTags,
        onCategoriesChange: setSelectedCategories
      }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        className: "qp-composer-error",
        role: "alert",
        children: error
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("footer", {
        className: "qp-text-composer__footer",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("span", {
          className: "qp-text-composer__char-count",
          "aria-live": "polite",
          children: editorRef.current?.innerText?.length ?? 0
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("button", {
          className: "qp-composer-submit",
          onClick: handleSubmit,
          disabled: !hasContent || submitting,
          "aria-label": submitting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Publishing…', 'quickpostr') : submitLabel,
          type: "button",
          children: submitting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Publishing…', 'quickpostr') : submitLabel
        })]
      }), flash && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        className: "qp-composer-flash",
        role: "status",
        "aria-live": "assertive",
        children: editPost ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Updated!', 'quickpostr') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Posted!', 'quickpostr')
      })]
    })
  );
}

/***/ },

/***/ "./src/blocks/composer/api.js"
/*!************************************!*\
  !*** ./src/blocks/composer/api.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCategory: () => (/* binding */ createCategory),
/* harmony export */   createPost: () => (/* binding */ createPost),
/* harmony export */   createTag: () => (/* binding */ createTag),
/* harmony export */   discardDraft: () => (/* binding */ discardDraft),
/* harmony export */   fetchLinkPreview: () => (/* binding */ fetchLinkPreview),
/* harmony export */   getCategory: () => (/* binding */ getCategory),
/* harmony export */   getDraft: () => (/* binding */ getDraft),
/* harmony export */   getMediaUrl: () => (/* binding */ getMediaUrl),
/* harmony export */   getPost: () => (/* binding */ getPost),
/* harmony export */   getTag: () => (/* binding */ getTag),
/* harmony export */   searchCategories: () => (/* binding */ searchCategories),
/* harmony export */   searchTags: () => (/* binding */ searchTags),
/* harmony export */   updatePost: () => (/* binding */ updatePost),
/* harmony export */   uploadMedia: () => (/* binding */ uploadMedia)
/* harmony export */ });
/**
 * WordPress REST API wrapper.
 *
 * All requests are authenticated via the WP nonce injected by render.php.
 * No Application Passwords — the user is already logged in.
 */

const config = window.quickpostrConfig ?? {};

/**
 * @param {string}      method
 * @param {string}      path   — relative to restUrl, e.g. '/wp/v2/posts'
 * @param {object|null} body
 * @return {Promise<any>} Parsed JSON response.
 */
async function request(method, path, body = null) {
  const url = (config.restUrl ?? '').replace(/\/$/, '') + path;
  const headers = {
    'X-WP-Nonce': config.nonce ?? ''
  };
  const init = {
    method,
    headers,
    credentials: 'include'
  };
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

/**
 * Create a new post.
 *
 * @param {Object} fields — post fields matching the WP REST posts schema.
 * @return {Promise<object>} The created post object.
 */
function createPost(fields) {
  return request('POST', '/wp/v2/posts', fields);
}

/**
 * Upload a media file.
 *
 * @param {File} file
 * @return {Promise<object>} The created media object (includes source_url).
 */
async function uploadMedia(file) {
  const url = (config.restUrl ?? '').replace(/\/$/, '') + '/wp/v2/media';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-WP-Nonce': config.nonce ?? '',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
      'Content-Type': file.type
    },
    credentials: 'include',
    body: file
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

/**
 * Search tags by name.
 *
 * @param {string} search
 * @return {Promise<Array>} Matching tags.
 */
function searchTags(search) {
  const qs = new URLSearchParams({
    search,
    per_page: '10',
    _fields: 'id,name'
  });
  return request('GET', `/wp/v2/tags?${qs}`);
}

/**
 * Create a new tag.
 *
 * @param {string} name
 * @return {Promise<{id: number, name: string}>} Created tag.
 */
function createTag(name) {
  return request('POST', '/wp/v2/tags', {
    name
  });
}

/**
 * Search categories by name.
 *
 *
 * @param {string} search
 * @return {Promise<Array>} Matching categories.
 */
function searchCategories(search) {
  const qs = new URLSearchParams({
    search,
    per_page: '10',
    _fields: 'id,name'
  });
  return request('GET', `/wp/v2/categories?${qs}`);
}

/**
 * Create a new category.
 *
 * @param {string} name
 * @return {Promise<{id: number, name: string}>} Created category.
 */
function createCategory(name) {
  return request('POST', '/wp/v2/categories', {
    name
  });
}

/**
 * Fetch a single category by ID.
 *
 * @param {number} id
 * @return {Promise<{id: number, name: string}>} Category object.
 */
function getCategory(id) {
  return request('GET', `/wp/v2/categories/${id}?_fields=id,name`);
}

/**
 * Fetch a single post in edit context (raw content).
 *
 * @param {number} id
 * @return {Promise<object>} Post object in edit context.
 */
function getPost(id) {
  const qs = new URLSearchParams({
    context: 'edit',
    _fields: 'id,title,content,format,status,featured_media,tags,categories'
  });
  return request('GET', `/wp/v2/posts/${id}?${qs}`);
}

/**
 * Fetch a single tag by ID.
 *
 * @param {number} id
 * @return {Promise<{id: number, name: string}>} Tag object.
 */
function getTag(id) {
  return request('GET', `/wp/v2/tags/${id}?_fields=id,name`);
}

/**
 * Fetch the source URL for a media item.
 *
 * @param {number} id
 * @return {Promise<string>} Source URL of the media item.
 */
async function getMediaUrl(id) {
  const data = await request('GET', `/wp/v2/media/${id}?_fields=source_url`);
  return data.source_url ?? '';
}

/**
 * Update an existing post.
 *
 * @param {number} id
 * @param {Object} fields
 * @return {Promise<object>} Updated post object.
 */
function updatePost(id, fields) {
  return request('PUT', `/wp/v2/posts/${id}`, fields);
}

/**
 * Return the current user's latest QuickPostr draft, or null if none.
 *
 * @return {Promise<object|null>} Draft post or null.
 */
function getDraft() {
  return request('GET', '/quickpostr/v1/draft');
}

/**
 * Permanently delete a draft post (move to trash).
 *
 * @param {number} id
 * @return {Promise<object>} Trashed post object.
 */
function discardDraft(id) {
  return request('DELETE', `/wp/v2/posts/${id}`);
}

/**
 * Fetch Open Graph preview data via the Better Bookmarks REST endpoint.
 * Requires Better Bookmarks to be installed and active.
 *
 * @param {string} url
 * @return {Promise<{url, title, description, image, domain}>} Open Graph preview data.
 */
function fetchLinkPreview(url) {
  const qs = new URLSearchParams({
    url
  });
  return request('GET', `/better-bookmarks/v1/preview?${qs}`);
}

/***/ },

/***/ "./src/blocks/composer/useAutoTitle.js"
/*!*********************************************!*\
  !*** ./src/blocks/composer/useAutoTitle.js ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateTitle: () => (/* binding */ generateTitle)
/* harmony export */ });
/**
 * Auto-title generation — client-side preview only.
 *
 * The authoritative title is generated server-side in PHP via
 * QuickPostr::generate_title() in rest_after_insert_post. This function is
 * used only for the live SlugPreview display in the composer.
 *
 * @param {'text'|'photo'} mode
 * @param {string}         text    — post content (plain text)
 * @param {string}         caption — photo caption (plain text)
 * @return {string} Generated post title.
 */
function generateTitle(mode, text, caption) {
  const now = new Date();
  const month = now.toLocaleString('en-US', {
    month: 'short'
  });
  const day = now.getDate();
  const year = now.getFullYear();
  const dateStr = `${month} ${day}, ${year}`;
  const source = mode === 'photo' ? caption.trim() : text.trim();
  if (!source) {
    return mode === 'photo' ? `Photo — ${dateStr}` : `Status — ${dateStr}`;
  }
  if (source.length <= 55) {
    return source;
  }
  const truncated = source.slice(0, 55);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/rich-text"
/*!**********************************!*\
  !*** external ["wp","richText"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["richText"];

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
/*!*************************************!*\
  !*** ./src/blocks/composer/view.js ***!
  \*************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Composer_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Composer.jsx */ "./src/blocks/composer/Composer.jsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Front-end entry point.
 *
 * Mounts the React Composer into the block's wrapper div.
 * React and @wordpress/rich-text are bundled here — they are not
 * available as WordPress globals on the front end.
 */



const el = document.getElementById('quickpostr-composer');
if (el) {
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot)(el).render(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_Composer_jsx__WEBPACK_IMPORTED_MODULE_1__["default"], {}));
}
})();

/******/ })()
;
//# sourceMappingURL=view.js.map