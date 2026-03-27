/******/ (() => { // webpackBootstrap
/*!************************************!*\
  !*** ./src/shared/profile-edit.js ***!
  \************************************/
/**
 * Profile Edit — shared front-end view script.
 *
 * Handles inline editing for quickpostr/profile-edit-name and
 * quickpostr/profile-edit-bio blocks. Both blocks enqueue this
 * single file via the 'quickpostr-profile-edit' script handle.
 *
 * No build step — plain ES5-compatible JavaScript.
 */
(function () {
  'use strict';

  var cfg = window.quickpostrProfileEdit || {};

  /**
   * Save a field value to the current user's profile via REST.
   *
   * @param {string}   field    WP REST user field name ('name' or 'description').
   * @param {string}   value    New value.
   * @param {Function} onDone   Called with (true) on success, (false) on error.
   */
  function saveField(field, value, onDone) {
    var url = (cfg.restUrl || '').replace(/\/$/, '') + '/wp/v2/users/me';
    var body = {};
    body[field] = value;
    fetch(url, {
      method: 'PUT',
      headers: {
        'X-WP-Nonce': cfg.nonce || '',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function (res) {
      onDone(res.ok);
    }).catch(function () {
      onDone(false);
    });
  }
  function showStatus(statusEl, message, success) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.className = 'qp-profile-edit__status' + (success ? ' qp-profile-edit__status--ok' : ' qp-profile-edit__status--error');
    if (success) {
      setTimeout(function () {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }, 2000);
    }
  }

  /**
   * Wire up a name block (single-line, contenteditable span).
   */
  function initNameBlock(el) {
    var valueEl = el.querySelector('.qp-profile-edit__value');
    var editBtn = el.querySelector('.qp-profile-edit__edit-btn');
    var saveBtn = el.querySelector('.qp-profile-edit__save-btn');
    var cancelBtn = el.querySelector('.qp-profile-edit__cancel-btn');
    var actions = el.querySelector('.qp-profile-edit__actions');
    var statusEl = el.querySelector('.qp-profile-edit__status');
    var field = valueEl && valueEl.dataset.field || 'name';
    if (!valueEl || !editBtn || !saveBtn || !cancelBtn) {
      return;
    }
    editBtn.addEventListener('click', function () {
      valueEl.contentEditable = 'true';
      valueEl.focus();
      // Place cursor at end.
      var range = document.createRange();
      range.selectNodeContents(valueEl);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      editBtn.hidden = true;
      if (actions) {
        actions.hidden = false;
      }
    });
    cancelBtn.addEventListener('click', function () {
      valueEl.textContent = valueEl.dataset.original || '';
      valueEl.contentEditable = 'false';
      editBtn.hidden = false;
      if (actions) {
        actions.hidden = true;
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }
    });
    saveBtn.addEventListener('click', function () {
      var newValue = valueEl.textContent.trim();
      if (!newValue) {
        return;
      }
      saveBtn.disabled = true;
      if (statusEl) {
        statusEl.textContent = 'Saving\u2026';
        statusEl.hidden = false;
      }
      saveField(field, newValue, function (ok) {
        saveBtn.disabled = false;
        if (ok) {
          valueEl.dataset.original = newValue;
          valueEl.contentEditable = 'false';
          editBtn.hidden = false;
          if (actions) {
            actions.hidden = true;
          }
          showStatus(statusEl, 'Saved!', true);
        } else {
          showStatus(statusEl, 'Could not save. Please try again.', false);
        }
      });
    });

    // Prevent newlines in the name field.
    valueEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveBtn.click();
      }
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
  }

  /**
   * Wire up a bio block (multi-line textarea).
   */
  function initBioBlock(el) {
    var valueEl = el.querySelector('.qp-profile-edit__value');
    var textarea = el.querySelector('.qp-profile-edit__textarea');
    var editBtn = el.querySelector('.qp-profile-edit__edit-btn');
    var saveBtn = el.querySelector('.qp-profile-edit__save-btn');
    var cancelBtn = el.querySelector('.qp-profile-edit__cancel-btn');
    var actions = el.querySelector('.qp-profile-edit__actions');
    var statusEl = el.querySelector('.qp-profile-edit__status');
    var field = valueEl && valueEl.dataset.field || 'description';
    if (!valueEl || !textarea || !editBtn || !saveBtn || !cancelBtn) {
      return;
    }
    editBtn.addEventListener('click', function () {
      textarea.value = valueEl.dataset.original || '';
      valueEl.hidden = true;
      textarea.hidden = false;
      textarea.focus();
      editBtn.hidden = true;
      if (actions) {
        actions.hidden = false;
      }
    });
    cancelBtn.addEventListener('click', function () {
      textarea.hidden = true;
      valueEl.hidden = false;
      editBtn.hidden = false;
      if (actions) {
        actions.hidden = true;
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }
    });
    saveBtn.addEventListener('click', function () {
      var newValue = textarea.value.trim();
      saveBtn.disabled = true;
      if (statusEl) {
        statusEl.textContent = 'Saving\u2026';
        statusEl.hidden = false;
      }
      saveField(field, newValue, function (ok) {
        saveBtn.disabled = false;
        if (ok) {
          valueEl.textContent = newValue;
          valueEl.dataset.original = newValue;
          textarea.hidden = true;
          valueEl.hidden = false;
          editBtn.hidden = false;
          if (actions) {
            actions.hidden = true;
          }
          showStatus(statusEl, 'Saved!', true);
        } else {
          showStatus(statusEl, 'Could not save. Please try again.', false);
        }
      });
    });
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
  }
  function init() {
    document.querySelectorAll('.qp-profile-edit-name').forEach(initNameBlock);
    document.querySelectorAll('.qp-profile-edit-bio').forEach(initBioBlock);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
/******/ })()
;
//# sourceMappingURL=profile-edit.js.map