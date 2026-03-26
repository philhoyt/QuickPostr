/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./blocks/composer/src/Composer.jsx"
/*!******************************************!*\
  !*** ./blocks/composer/src/Composer.jsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Composer)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _TextComposer_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TextComposer.jsx */ "./blocks/composer/src/TextComposer.jsx");
/* harmony import */ var _PhotoComposer_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./PhotoComposer.jsx */ "./blocks/composer/src/PhotoComposer.jsx");
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./api.js */ "./blocks/composer/src/api.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





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
  const [mode, setMode] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(initialMode);
  const [editPost, setEditPost] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [editLoading, setEditLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

  // Detect ?qp-edit param and load the post into the composer.
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = parseInt(params.get('qp-edit'), 10);
    if (!editId) {
      return;
    }
    setEditLoading(true);
    (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.getPost)(editId).then(post => {
      setEditPost(post);
      setMode(post.format === 'image' ? 'photo' : 'status');
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "qp-composer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "qp-composer__loading",
        children: "Loading\u2026"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "qp-composer",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("header", {
      className: "qp-composer__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "qp-composer__identity",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
          className: "qp-composer__avatar",
          "aria-hidden": "true",
          children: avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("img", {
            src: avatarUrl,
            alt: "",
            width: "32",
            height: "32"
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
            children: initials
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
          className: "qp-composer__user-name",
          children: user.name
        })]
      }), editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
        type: "button",
        className: "qp-composer__cancel-edit",
        onClick: handleCancelEdit,
        children: "\u2715 Cancel edit"
      })]
    }), !editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "qp-composer__mode-bar",
      role: "tablist",
      "aria-label": "Post type",
      children: ['status', 'photo'].map(m => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
        role: "tab",
        "aria-selected": mode === m,
        className: `qp-composer__mode-btn${mode === m ? ' qp-composer__mode-btn--active' : ''}`,
        onClick: () => setMode(m),
        type: "button",
        children: m === 'status' ? 'Status' : 'Photo'
      }, m))
    }), editPost && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "qp-composer__edit-bar",
      role: "status",
      children: "Editing post"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "qp-composer__body",
      children: [mode === 'status' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_TextComposer_jsx__WEBPACK_IMPORTED_MODULE_1__["default"], {
        onSuccess: handleSuccess,
        editPost: editPost ?? undefined
      }), mode === 'photo' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_PhotoComposer_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], {
        onSuccess: handleSuccess,
        editPost: editPost ?? undefined
      })]
    })]
  });
}

/***/ },

/***/ "./blocks/composer/src/PhotoComposer.jsx"
/*!***********************************************!*\
  !*** ./blocks/composer/src/PhotoComposer.jsx ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PhotoComposer)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api.js */ "./blocks/composer/src/api.js");
/* harmony import */ var _TagInput_jsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./TagInput.jsx */ "./blocks/composer/src/TagInput.jsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




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
 */
function PhotoComposer({
  onSuccess,
  editPost
}) {
  const [file, setFile] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [preview, setPreview] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [caption, setCaption] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [dragging, setDragging] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [selectedTags, setSelectedTags] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [selectedCategories, setSelectedCategories] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
  const [submitting, setSubmitting] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [flash, setFlash] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const fileInputRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Pre-fill caption from editPost.
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (editPost) {
      setCaption(editPost.content?.raw ?? '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > MAX_BYTES) {
      const mb = Math.round(MAX_BYTES / 1024 / 1024);
      setError(`File too large — maximum size is ${mb} MB.`);
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
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
  async function handleSubmit() {
    // In edit mode without a new file, we can still update the caption.
    if (!editPost && !file) return;
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Capture preview URL before async state changes.
    const previewUrl = preview;
    try {
      let wpPost;
      if (editPost && !file) {
        // Edit mode: update caption only, keep existing featured media.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.updatePost)(editPost.id, {
          content: caption,
          status: defaultStatus,
          tags: selectedTags,
          categories: selectedCategories
        });
        onSuccess?.(wpPost, '');
      } else {
        // New file: upload media then create/update post.
        const media = await (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.uploadMedia)(file);
        if (editPost) {
          wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.updatePost)(editPost.id, {
            content: caption,
            status: defaultStatus,
            featured_media: media.id,
            tags: selectedTags,
            categories: selectedCategories
          });
        } else {
          wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.createPost)({
            title: '',
            content: caption,
            status: defaultStatus,
            format: 'image',
            featured_media: media.id,
            tags: selectedTags,
            categories: selectedCategories,
            meta: {
              _quickpostr_post: '1'
            }
          });
        }
        onSuccess?.(wpPost, media.source_url);
      }

      // Reset form.
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setCaption('');
      setSelectedTags([]);
      setSelectedCategories(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
    } catch (err) {
      setError(err.message ?? 'Failed to publish. Please try again.');
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "qp-photo-composer",
    children: [!file && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: dropzoneClass,
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onClick: () => fileInputRef.current?.click(),
      onKeyDown: handleDropzoneKeyDown,
      role: "button",
      tabIndex: 0,
      "aria-label": "Choose a photo to upload",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("svg", {
        className: "qp-photo-dropzone__icon",
        "aria-hidden": "true",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("rect", {
          x: "3",
          y: "3",
          width: "18",
          height: "18",
          rx: "3",
          ry: "3"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("circle", {
          cx: "8.5",
          cy: "8.5",
          r: "1.5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("polyline", {
          points: "21 15 16 10 5 21"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
        className: "qp-photo-dropzone__label",
        children: ["Drop a photo here or ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
          className: "qp-photo-dropzone__browse",
          children: "browse"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        className: "qp-photo-dropzone__input",
        onChange: handleInputChange,
        "aria-hidden": "true",
        tabIndex: -1
      })]
    }), file && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "qp-photo-preview",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("img", {
        src: preview,
        alt: "Selected photo preview",
        className: "qp-photo-preview__img"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
        type: "button",
        className: "qp-photo-preview__remove",
        onClick: clearFile,
        "aria-label": "Remove photo",
        disabled: submitting,
        children: "\u2715"
      })]
    }), file && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("textarea", {
        className: "qp-photo-caption",
        placeholder: "Add a caption\u2026 (optional)",
        value: caption,
        onChange: e => setCaption(e.target.value),
        disabled: submitting,
        rows: 3,
        "aria-label": "Photo caption"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_TagInput_jsx__WEBPACK_IMPORTED_MODULE_2__["default"], {
        selectedTags: selectedTags,
        selectedCategories: selectedCategories,
        onTagsChange: setSelectedTags,
        onCategoriesChange: setSelectedCategories
      })]
    }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
      className: "qp-composer-error",
      role: "alert",
      children: error
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("footer", {
      className: "qp-photo-composer__footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
        className: "qp-composer-submit",
        onClick: handleSubmit,
        disabled: !editPost && !file || submitting,
        "aria-label": submitting ? 'Publishing…' : editPost ? 'Update' : 'Publish photo',
        type: "button",
        children: submitting ? 'Publishing…' : editPost ? 'Update' : defaultStatus === 'draft' ? 'Save Draft' : 'Post'
      })
    }), flash && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      className: "qp-composer-flash",
      role: "status",
      "aria-live": "assertive",
      children: "Posted!"
    })]
  });
}

/***/ },

/***/ "./blocks/composer/src/SlugPreview.jsx"
/*!*********************************************!*\
  !*** ./blocks/composer/src/SlugPreview.jsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SlugPreview)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
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
 */
function SlugPreview({
  title
}) {
  const showFromAttrs = config.blockAttrs?.showSlugPreview;
  const showFromSettings = config.settings?.showSlugPreview;
  const show = showFromAttrs !== undefined ? showFromAttrs : showFromSettings;
  if (!show || !title) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("p", {
    className: "qp-slug-preview",
    "aria-label": "Auto-generated title preview",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "qp-slug-preview__label",
      children: "Title"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "qp-slug-preview__value",
      children: title
    })]
  });
}

/***/ },

/***/ "./blocks/composer/src/TagInput.jsx"
/*!******************************************!*\
  !*** ./blocks/composer/src/TagInput.jsx ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TagInput)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api.js */ "./blocks/composer/src/api.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



const config = window.quickpostrConfig ?? {};

/**
 * Tag + category input with typeahead.
 *
 * Props:
 *   selectedTags       {number[]}  — array of tag IDs
 *   selectedCategories {number[]}  — array of category IDs
 *   onTagsChange       (ids) => void
 *   onCategoriesChange (ids) => void
 */
function TagInput({
  selectedTags,
  selectedCategories,
  onTagsChange,
  onCategoriesChange
}) {
  const [tagInput, setTagInput] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [tagSuggestions, setTagSuggestions] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [tagNames, setTagNames] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}); // id → name
  const [categories, setCategories] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [open, setOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const searchTimer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const wrapperRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Load all categories once.
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.getCategories)().then(setCategories).catch(() => {});
  }, []);

  // Close suggestions on outside click.
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced tag search.
  const handleTagInput = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    const value = e.target.value;
    setTagInput(value);
    clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      setTagSuggestions([]);
      setOpen(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await (0,_api_js__WEBPACK_IMPORTED_MODULE_1__.searchTags)(value.trim());
        setTagSuggestions(results);
        setOpen(results.length > 0);
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
    setOpen(false);
  }
  function removeTag(id) {
    onTagsChange(selectedTags.filter(t => t !== id));
  }
  function toggleCategory(id) {
    onCategoriesChange(selectedCategories.includes(id) ? selectedCategories.filter(c => c !== id) : [...selectedCategories, id]);
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "qp-tag-input",
    ref: wrapperRef,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "qp-tag-input__tags",
      children: [selectedTags.map(id => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
        className: "qp-tag-input__tag",
        children: [tagNames[id] ?? `#${id}`, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          type: "button",
          className: "qp-tag-input__tag-remove",
          "aria-label": `Remove tag ${tagNames[id] ?? id}`,
          onClick: () => removeTag(id),
          children: "\xD7"
        })]
      }, id)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "qp-tag-input__search-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
          type: "text",
          className: "qp-tag-input__search",
          value: tagInput,
          onChange: handleTagInput,
          placeholder: "Add tags\u2026",
          "aria-label": "Search tags",
          "aria-autocomplete": "list",
          "aria-expanded": open
        }), open && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("ul", {
          className: "qp-tag-input__suggestions",
          role: "listbox",
          children: tagSuggestions.map(tag => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("li", {
            role: "option",
            "aria-selected": selectedTags.includes(tag.id),
            className: "qp-tag-input__suggestion",
            onMouseDown: () => addTag(tag),
            children: tag.name
          }, tag.id))
        })]
      })]
    }), categories.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "qp-tag-input__categories",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
        className: "qp-tag-input__cat-label",
        children: "Categories"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
        className: "qp-tag-input__cat-list",
        children: categories.map(cat => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("label", {
          className: "qp-tag-input__cat-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
            type: "checkbox",
            checked: selectedCategories.includes(cat.id),
            onChange: () => toggleCategory(cat.id)
          }), cat.name]
        }, cat.id))
      })]
    })]
  });
}

/***/ },

/***/ "./blocks/composer/src/TextComposer.jsx"
/*!**********************************************!*\
  !*** ./blocks/composer/src/TextComposer.jsx ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TextComposer)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/rich-text */ "@wordpress/rich-text");
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _useAutoTitle_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./useAutoTitle.js */ "./blocks/composer/src/useAutoTitle.js");
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./api.js */ "./blocks/composer/src/api.js");
/* harmony import */ var _SlugPreview_jsx__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./SlugPreview.jsx */ "./blocks/composer/src/SlugPreview.jsx");
/* harmony import */ var _TagInput_jsx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./TagInput.jsx */ "./blocks/composer/src/TagInput.jsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);







const config = window.quickpostrConfig ?? {};

/** Debounce delay (ms) for draft auto-save. */
const DRAFT_SAVE_DELAY = 800;

/**
 * Minimal rich-text toolbar button.
 */
function ToolbarButton({
  label,
  onMouseDown,
  children
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
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
 */
function RichEditor({
  placeholder,
  disabled,
  editorRef,
  onChange
}) {
  const [isEmpty, setIsEmpty] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  function handleInput() {
    const el = editorRef.current;
    if (!el) return;
    const empty = el.innerText.trim() === '';
    setIsEmpty(empty);
    // Read normalized HTML via @wordpress/rich-text.
    const rawHtml = empty ? '' : el.innerHTML;
    const value = (0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_1__.create)({
      html: rawHtml
    });
    onChange((0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_1__.toHTMLString)({
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
    const url = window.prompt('Enter URL:');
    if (url) {
      editorRef.current?.focus();
      document.execCommand('createLink', false, url);
      handleInput();
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: "qp-rich-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "qp-rich-editor__toolbar",
      role: "toolbar",
      "aria-label": "Formatting",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ToolbarButton, {
        label: "Bold",
        onMouseDown: () => execFormat('bold'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("strong", {
          children: "B"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ToolbarButton, {
        label: "Italic",
        onMouseDown: () => execFormat('italic'),
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("em", {
          children: "I"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(ToolbarButton, {
        label: "Link",
        onMouseDown: handleLink,
        children: "\uD83D\uDD17"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      ref: editorRef,
      contentEditable: !disabled,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      className: "qp-rich-editor__content",
      "data-placeholder": isEmpty ? placeholder : undefined,
      role: "textbox",
      "aria-multiline": "true",
      "aria-label": "Post content",
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
 */
function TextComposer({
  onSuccess,
  editPost
}) {
  const editorRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const draftTimer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [html, setHtml] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [selectedTags, setSelectedTags] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [selectedCategories, setSelectedCategories] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(config.settings?.defaultCategory ? [config.settings.defaultCategory] : []);
  const [submitting, setSubmitting] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [flash, setFlash] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [draftId, setDraftId] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [draftBanner, setDraftBanner] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [draftPost, setDraftPost] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const placeholder = config.blockAttrs?.placeholderText ?? "What's on your mind?";
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Plain-text content for title preview and character count.
  const plainText = editorRef.current?.innerText?.trim() ?? '';
  const title = (0,_useAutoTitle_js__WEBPACK_IMPORTED_MODULE_2__.generateTitle)('text', plainText, '');

  // On mount: pre-fill from editPost, OR check for an existing draft.
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (editPost) {
      const raw = editPost.content?.raw ?? '';
      setDraftId(editPost.id);
      setHtml(raw);
      if (editorRef.current) {
        editorRef.current.innerHTML = raw;
      }
      return;
    }
    (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.getDraft)().then(draft => {
      if (draft && draft.format !== 'image') {
        setDraftPost(draft);
        setDraftBanner(true);
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Autofocus (only when not loading an edit post — avoids scroll jump).
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!editPost) {
      editorRef.current?.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Schedule a debounced draft save whenever content changes. */
  function scheduleDraftSave(content) {
    if (editPost) return; // Edit mode: no auto-save as draft.
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      if (!content) return;
      try {
        if (draftId) {
          await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.updatePost)(draftId, {
            content,
            status: 'draft'
          });
        } else {
          const newDraft = await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.createPost)({
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
        await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.discardDraft)(draftPost.id);
      } catch (_) {}
    }
    setDraftPost(null);
  }
  const handleSubmit = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    const plain = editorRef.current?.innerText?.trim() ?? '';
    if (!plain || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let wpPost;
      if (editPost) {
        // Edit mode: update the existing post.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.updatePost)(editPost.id, {
          content: html,
          status: defaultStatus,
          tags: selectedTags,
          categories: selectedCategories
        });
      } else if (draftId) {
        // Publish the auto-saved draft.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.updatePost)(draftId, {
          title: '',
          content: html,
          status: defaultStatus,
          format: 'status',
          tags: selectedTags,
          categories: selectedCategories
        });
      } else {
        // No draft: create a new post.
        wpPost = await (0,_api_js__WEBPACK_IMPORTED_MODULE_3__.createPost)({
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
      setError(err.message ?? 'Failed to publish. Please try again.');
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
  const submitLabel = editPost ? 'Update' : defaultStatus === 'draft' ? 'Save Draft' : 'Post';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: "qp-text-composer",
    onKeyDown: handleKeyDown,
    children: [draftBanner && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "qp-draft-banner",
      role: "status",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
        children: "Resume your saved draft?"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
        className: "qp-draft-banner__actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
          type: "button",
          className: "qp-draft-banner__resume",
          onClick: resumeDraft,
          children: "Resume"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
          type: "button",
          className: "qp-draft-banner__discard",
          onClick: handleDiscardDraft,
          children: "Discard"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(RichEditor, {
      placeholder: placeholder,
      disabled: submitting,
      editorRef: editorRef,
      onChange: handleHtmlChange
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_SlugPreview_jsx__WEBPACK_IMPORTED_MODULE_4__["default"], {
      title: title
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_TagInput_jsx__WEBPACK_IMPORTED_MODULE_5__["default"], {
      selectedTags: selectedTags,
      selectedCategories: selectedCategories,
      onTagsChange: setSelectedTags,
      onCategoriesChange: setSelectedCategories
    }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("p", {
      className: "qp-composer-error",
      role: "alert",
      children: error
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("footer", {
      className: "qp-text-composer__footer",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("span", {
        className: "qp-text-composer__char-count",
        "aria-live": "polite",
        children: editorRef.current?.innerText?.length ?? 0
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
        className: "qp-composer-submit",
        onClick: handleSubmit,
        disabled: !hasContent || submitting,
        "aria-label": submitting ? 'Publishing…' : submitLabel,
        type: "button",
        children: submitting ? 'Publishing…' : submitLabel
      })]
    }), flash && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "qp-composer-flash",
      role: "status",
      "aria-live": "assertive",
      children: editPost ? 'Updated!' : 'Posted!'
    })]
  });
}

/***/ },

/***/ "./blocks/composer/src/api.js"
/*!************************************!*\
  !*** ./blocks/composer/src/api.js ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createPost: () => (/* binding */ createPost),
/* harmony export */   discardDraft: () => (/* binding */ discardDraft),
/* harmony export */   getCategories: () => (/* binding */ getCategories),
/* harmony export */   getDraft: () => (/* binding */ getDraft),
/* harmony export */   getPost: () => (/* binding */ getPost),
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
 * @param {string} method
 * @param {string} path    — relative to restUrl, e.g. '/wp/v2/posts'
 * @param {object|null} body
 * @returns {Promise<any>}
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
 * @param {object} fields — post fields matching the WP REST posts schema.
 * @returns {Promise<object>} The created post object.
 */
function createPost(fields) {
  return request('POST', '/wp/v2/posts', fields);
}

/**
 * Upload a media file.
 *
 * @param {File} file
 * @returns {Promise<object>} The created media object (includes source_url).
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
 * @returns {Promise<Array>}
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
 * Fetch all categories.
 *
 * @returns {Promise<Array>}
 */
function getCategories() {
  const qs = new URLSearchParams({
    per_page: '100',
    _fields: 'id,name,parent'
  });
  return request('GET', `/wp/v2/categories?${qs}`);
}

/**
 * Fetch a single post in edit context (raw content).
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
function getPost(id) {
  const qs = new URLSearchParams({
    context: 'edit',
    _fields: 'id,title,content,format,status'
  });
  return request('GET', `/wp/v2/posts/${id}?${qs}`);
}

/**
 * Update an existing post.
 *
 * @param {number} id
 * @param {object} fields
 * @returns {Promise<object>}
 */
function updatePost(id, fields) {
  return request('PUT', `/wp/v2/posts/${id}`, fields);
}

/**
 * Return the current user's latest QuickPostr draft, or null if none.
 *
 * @returns {Promise<object|null>}
 */
function getDraft() {
  return request('GET', '/quickpostr/v1/draft');
}

/**
 * Permanently delete a draft post (move to trash).
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
function discardDraft(id) {
  return request('DELETE', `/wp/v2/posts/${id}`);
}

/***/ },

/***/ "./blocks/composer/src/useAutoTitle.js"
/*!*********************************************!*\
  !*** ./blocks/composer/src/useAutoTitle.js ***!
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
 * @param {string} text    — post content (plain text)
 * @param {string} caption — photo caption (plain text)
 * @returns {string}
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

/***/ "react"
/*!************************!*\
  !*** external "React" ***!
  \************************/
(module) {

module.exports = window["React"];

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
/*!**********************************************!*\
  !*** ./blocks/composer/src/composer-view.js ***!
  \**********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Composer_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Composer.jsx */ "./blocks/composer/src/Composer.jsx");
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
//# sourceMappingURL=composer-view.js.map