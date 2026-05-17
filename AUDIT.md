# QuickPostr — Audit Report

**Date:** 2026-05-17
**WordPress latest stable:** 6.9.4
**Scanned:** 8 PHP files (plugin-owned) · 4 blocks · 20 JS/JSX files

---

## Project Inventory

```
PROJECT INVENTORY
─────────────────────────────────────────────────
Type:        Plugin (Gutenberg blocks)
Slug:        quickpostr
PHP files:   8 (excl. lib/plugin-update-checker)
Blocks:      4 (composer, delete-post, edit-post, share-post)
JS source:   20 files (6 JSX, 14 JS)
Tooling:     phpcs ✓  phpunit ✓  wp-scripts ✓  theme.json ✗
             eslint ✓  stylelint ✓  wp-env ✗
PHPCS:       0 errors / 0 warnings (all 8 files clean)
```

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Warning  | 0 (7 fixed) |
| Info     | 3 |

---

## Status

| ID | Issue | Status |
|----|-------|--------|
| STD-01 | `wp_localize_script` for REST nonce in two render.php files | ✅ Fixed |
| STD-02 | Direct `import React from 'react'` in 6 front-end JSX files | ✅ Fixed |
| STD-03 | Hardcoded English UI strings not wrapped in `__()` | ✅ Fixed |
| STD-04 | `@wordpress/scripts` v30 — 2 major versions behind latest v32 | ✅ Fixed |
| STD-05 | `@wordpress/eslint-plugin` v22 — 3 major versions behind latest v25 | ✅ Fixed |
| BLK-01 | `share-post/render.php` — `$qp_post_title` not explicitly stripped before data attribute | ✅ Fixed |
| BLK-02 | `share-post/render.php` — `$qp_post_url` not explicitly escaped before data attribute | ✅ Fixed |
| TST-01 | No unit or E2E tests exist in the project | open |
| TST-02 | All 4 dynamic blocks lack E2E specs | open |
| TST-03 | Security-sensitive auth gates in render.php files are untested | open |

---

## Critical

None found.

---

## Warnings

### [STD-01] `wp_localize_script` used to pass REST nonce

**Files:**
- `src/blocks/delete-post/render.php:45–52`
- `src/blocks/edit-post/render.php:47–55`

**Code:**
```php
wp_localize_script(
    'quickpostr-delete-post-view',
    'quickpostrDeletePost',
    array(
        'restUrl' => rest_url(),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
    )
);
```

**Fix:** Use `wp_add_inline_script` with `'before'` position instead. `wp_localize_script` serializes data before the script executes and uses `json_encode` without escaping for HTML context; `wp_add_inline_script` runs just before the script and is the correct tool for REST nonces. Note that the Composer block's `render.php` already uses `wp_add_inline_script` correctly — match that pattern here.

```php
wp_add_inline_script(
    'quickpostr-delete-post-view',
    'window.quickpostrDeletePost = ' . wp_json_encode( array(
        'restUrl' => rest_url(),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
    ) ) . ';',
    'before'
);
```

---

### [STD-02] Direct `import React from 'react'` in front-end JSX files

**Files:**
- `src/blocks/composer/Composer.jsx:1`
- `src/blocks/composer/TextComposer.jsx:1`
- `src/blocks/composer/PhotoComposer.jsx:1`
- `src/blocks/composer/LinkComposer.jsx:1`
- `src/blocks/composer/SlugPreview.jsx:1`
- `src/blocks/composer/TagInput.jsx:1`

**Code:** `import React, { useState, ... } from 'react';`

**Fix:** CLAUDE.md states "React is externalized — use `@wordpress/element`, not `react-dom/client`". These files import from `'react'` directly. `@wordpress/dependency-extraction-webpack-plugin` (bundled with `@wordpress/scripts`) externalizes `react` to `window.React` and `@wordpress/element` to `window.wp.element`. If the front-end page doesn't provide `window.React`, the bundle fails silently; if it provides both, hooks may run against two React instances.

The front-end entry point (`view.js`) correctly uses `@wordpress/element`. Update all JSX components to import hooks from `@wordpress/element`:

```js
// Before
import React, { useState, useEffect } from 'react';

// After
import { useState, useEffect } from '@wordpress/element';
```

The explicit `React` import is not needed with JSX in the wp-scripts build (the JSX runtime is configured automatically). Only named hook/utility imports are needed.

---

### [STD-03] Hardcoded English UI strings not wrapped in i18n functions

Dozens of user-facing strings across the JSX and plain-JS view files are hardcoded English and cannot be translated. Representative list:

**`src/blocks/composer/Composer.jsx`**
- `:135` — `'Cancel edit'`
- `:161–167` — `{ status: 'Status', photo: 'Photo', link: 'Link' }`
- `:173` — `'Editing post'`
- `:101` — `'Loading…'`

**`src/blocks/composer/TextComposer.jsx`**
- `:379–383` — `'Update'`, `'Save Draft'`, `'Post'`
- `:395` — `'Resume your saved draft?'`
- `:399` — `'Resume'`, `:406` — `'Discard'`
- `:445` — `'Publishing…'`
- `:457` — `'Updated!'`, `'Posted!'`

**`src/blocks/composer/PhotoComposer.jsx`**
- `:69` — `'Please select an image file.'`
- `:76` — `` `File too large — maximum size is ${ mb } MB.` ``
- `:338` — `'Add a caption… (optional)'` (placeholder)
- `:371–379` — `'Publishing…'`, `'Update'`, `'Save Draft'`, `'Post'`
- `:391` — `'Posted!'`

**`src/blocks/composer/LinkComposer.jsx`**
- `:229–232` — placeholder strings
- `:247` — `'Preview'`
- `:285–288` — `'Install Better Bookmarks...'`
- `:214–219` — `'Update'`, `'Save Draft'`, `'Post'`

**`src/blocks/delete-post/view.js`** (plain JS)
- `:38` — `'Deleting…'`, `:73` — `'Yes, delete'`

**`src/blocks/edit-post/view.js`** (plain JS)
- `:26` — `'Loading…'`, `:62` — `'Edit'`

**Fix:** For JSX files, import `{ __, sprintf }` from `@wordpress/i18n` and wrap all user-facing strings. For plain-JS view scripts (`view.js`), strings can be translated via `wp_set_script_translations()` — the i18n functions are available via `window.wp.i18n` when the script has translations registered. The quickest path: add `wp_set_script_translations( 'quickpostr-composer-view', 'quickpostr' )` and similar calls in `register_block()`, then wrap JS strings in `__( 'string', 'quickpostr' )` after importing from `@wordpress/i18n`.

---

### [STD-04] `@wordpress/scripts` is 2 major versions behind

**File:** `package.json:26`
**Installed:** `^30.0.0` **Latest:** `32.2.0`

**Fix:** v32 is a significant upgrade — it moves from ESLint v8 to ESLint v9 (flat config). This means:
1. Upgrade: `npm install --save-dev @wordpress/scripts@latest`
2. Replace `.eslintrc.js` with `eslint.config.js` (flat config format) — ESLint v9 silently ignores `.eslintrc.js`
3. Update `@wordpress/eslint-plugin` (see STD-05)

Flat config migration template (from the shared `~/.claude/rules/wordpress/js-scss.md`):
```js
// eslint.config.js
const wpPlugin = require('@wordpress/eslint-plugin');
module.exports = [
    { ignores: ['build/**', 'vendor/**', 'node_modules/**', 'lib/**'] },
    ...wpPlugin.configs.recommended,
    { rules: {} },
];
```

---

### [STD-05] `@wordpress/eslint-plugin` v22 is 3 major versions behind

**File:** `package.json:23`
**Installed:** `^22.22.0` (pinned to match scripts v30) **Latest:** `25.2.0`

**Fix:** This is a downstream consequence of STD-04 — `@wordpress/scripts` v30 ships eslint-plugin v22, so the version is pinned to avoid peer-dep conflicts. Resolving STD-04 (upgrading to scripts v32) simultaneously upgrades eslint-plugin to v25 and removes the pin.

---

### [BLK-01] `$qp_post_title` not explicitly stripped before use as data attribute

**File:** `src/blocks/share-post/render.php:24,34`

**Code:**
```php
$qp_post_title = get_the_title( $quickpostr_post_id );
// ...
$qp_wrapper_attributes = get_block_wrapper_attributes(
    array(
        'data-title' => $qp_post_title,   // ← may contain HTML
        'data-url'   => $qp_post_url,
    )
);
```

**Fix:** `get_the_title()` can return titles containing HTML entities (e.g. `&#8217;` for smart quotes, `<em>` if the title has markup). When used as a data attribute value consumed by JavaScript (`el.dataset.title`), the HTML entities may not decode as expected. Use `wp_strip_all_tags()` to ensure the value is plain text:

```php
$qp_post_title = wp_strip_all_tags( get_the_title( $quickpostr_post_id ) );
```

`get_block_wrapper_attributes()` does sanitize attribute values internally, so this is not a confirmed XSS vector — but explicit stripping documents intent and prevents JavaScript consumers from receiving raw HTML entity strings.

---

### [BLK-02] `$qp_post_url` not explicitly escaped before use as data attribute

**File:** `src/blocks/share-post/render.php:25,35`

**Code:**
```php
$qp_post_url = get_permalink( $quickpostr_post_id );
// ...
'data-url' => $qp_post_url,
```

**Fix:** Use `esc_url()` to make the escaping intent explicit and guard against any future change in how `get_block_wrapper_attributes()` handles attribute values:

```php
$qp_post_url = esc_url( get_permalink( $quickpostr_post_id ) );
```

---

## Info

### [TST-01] No test files exist anywhere in the project

**Recommendation:** `phpunit.xml` was created during setup but `tests/phpunit/` is empty and there are no JS test files. Given the auth gates and REST logic in this plugin, adding tests would meaningfully improve confidence when upgrading WordPress or changing access control logic. Starting points: (1) A PHPUnit integration test for `QuickPostr_Settings::sanitize_settings()` to verify all field sanitization paths. (2) Unit tests for `QuickPostr::generate_title()` — it has several branches and is pure logic.

---

### [TST-02] All 4 dynamic blocks have no E2E coverage

**Recommendation:** All four blocks use `render.php` and have auth-gated output. Key flows worth automating: composer block renders for `author` role, shows nothing for logged-out visitor; delete-post block renders only for the post's author; share-post renders the share button on public posts. These would catch auth-gate regressions on WordPress upgrades.

---

### [TST-03] Security-sensitive render.php auth gates are untested

**Recommendation:** `composer/render.php`, `delete-post/render.php`, and `edit-post/render.php` all check `is_user_logged_in()`, `current_user_can()`, and the `allowed_roles` setting before rendering. These gates are never exercised by automated tests. A simple PHPUnit integration test using `wp_set_current_user()` to simulate different roles would verify these paths don't regress.

---

## Quick Wins

1. **STD-01 (15 min):** Replace `wp_localize_script` with `wp_add_inline_script` in `delete-post/render.php` and `edit-post/render.php` — two small, well-contained PHP changes with clear before/after pattern from composer's render.php.
2. **BLK-01/BLK-02 (5 min):** Add `wp_strip_all_tags()` to `$qp_post_title` and `esc_url()` to `$qp_post_url` in `share-post/render.php` — two one-liner changes that make escaping intent explicit.
3. **STD-04/STD-05 (1–2 hours):** Upgrade `@wordpress/scripts` to v32 + migrate ESLint to flat config — unblocks eslint-plugin upgrade and gets the project onto supported tooling.

---

## Already Fixed / Clean

- **PHP security:** All 8 plugin-owned PHP files pass PHPCS with 0 errors/0 warnings. Output is consistently escaped (`esc_html()`, `esc_attr()`, `esc_url()`). No unescaped echoes, no raw `$_POST`/`$_GET` access, no SQL injection surface.
- **REST endpoints:** Both `/quickpostr/v1/settings` and `/quickpostr/v1/draft` are GET-only with `check_permission()` requiring login. No write endpoint uses `__return_true`.
- **Settings sanitization:** `QuickPostr_Settings::sanitize_settings()` validates every field with appropriate sanitizers (`absint`, `in_array`, `!empty`).
- **Block structure:** All 4 blocks use `apiVersion: 3`, include `$schema`, set `"html": false`, are dynamic (`render.php`), and call `get_block_wrapper_attributes()`.
- **Capability checks:** All render.php files gate on `current_user_can()`. The settings page re-checks `manage_options` inside the render callback.
- **No debug code:** No `var_dump`, `print_r`, `error_log`, or `dd()` in any production file.
- **No hardcoded secrets:** No API keys or credentials in any committed file.
- **No deprecated packages:** All Composer and npm packages are actively maintained.
- **Version headers:** `readme.txt` `Tested up to: 6.9.4` matches WordPress latest stable. `Stable tag: 0.6.0` consistent across readme.txt, plugin header, and package.json.
- **Dependency extraction:** View scripts are registered manually with asset-file dependencies to correctly bundle React for the front end.
- **EXIF stripping:** The `maybe_strip_exif()` handler auto-orients before stripping — preventing rotation bugs from missing EXIF orientation data.
