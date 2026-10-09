# QuickPostr — Claude Code conventions

## Project overview
QuickPostr is a WordPress Gutenberg block plugin (`quickpostr/composer`) that provides a front-end social-style post composer. PHP handles auth, taxonomy, and title generation; the block's React app handles composing and uploading.

## Build commands

```bash
# JS — build once
npm run build

# JS — watch
npm start

# PHP lint (PHPCS + WPCS)
composer lint

# PHP auto-fix (phpcbf)
composer lint:fix

# PHP static analysis
composer analyse

# PHP tests
composer test              # unit — Brain Monkey, no WordPress, no DB
composer test:integration  # WP_UnitTestCase against a real WordPress + DB
composer test:all          # both
composer test:coverage     # integration + line coverage (needs pcov)

# JS tests
npm run test:unit          # Jest
npm run test:e2e           # Playwright, against the wp-env site (starts it if needed)

# WordPress environments (Docker, via @wordpress/env)
npm run env:start          # E2E + manual-check site, WordPress 7.1.3 on :8888
npm run env:stop
npm run env:phpunit:start  # separate environment on :8890, PHPUnit only
npm run env:phpunit:stop
```

### WordPress runtimes

Both the integration suite and the E2E suite run against `@wordpress/env`.
There are two config files on purpose: `.wp-env.json` (E2E, port 8888) and
`.wp-env.phpunit.json` (PHPUnit, port 8890). `WP_UnitTestCase`'s bootstrap
drops every table in the database it connects to, so PHPUnit must never run
in the E2E environment. `composer test:integration` already targets the
PHPUnit one; wp-env ships the core test library and sets `WP_TESTS_DIR`
inside its containers. The unit suite (`composer test`) needs neither Docker
nor WordPress.

Both files pin `core` to `WordPress/WordPress#7.1.3` and `phpVersion` to the
plugin minimum. `/wp-compat` is what moves those deliberately.

If another wp-env project already holds those ports, set `port`/`testsPort`
in the gitignored `.wp-env.override.json` / `.wp-env.phpunit.override.json`
and run E2E with `WP_BASE_URL=http://localhost:<port> npm run test:e2e`.
wp-env refuses a `port` equal to its `testsPort` (default 8889), so pick
pairs.

PHPUnit is pinned to ^9.6 because the WordPress core test library caps
there — `yoast/phpunit-polyfills` supports at most PHPUnit 12, and
wordpress-develop pins polyfills to ^1.1, which tops out at 9.

## Before every commit — checklist

Run both linters and confirm they are clean before committing:

```bash
composer lint
```

Manual smoke tests (load the plugin in a browser):

- [ ] Block appears in the block inserter under the "QuickPostr" category
- [ ] Block renders the composer on the front end for a logged-in `author` or above
- [ ] Block shows nothing (no errors) for logged-out visitors
- [ ] Status post: type text → submit → post appears in WP admin with auto-generated title
- [ ] Photo post: attach image → submit → post appears with featured image in WP admin
- [ ] Admin bar is hidden for non-administrator roles when the setting is enabled
- [ ] Settings page saves and reloads correctly (Settings → QuickPostr)
- [ ] No JS console errors on front end or in block editor

## PHP coding standards

- WordPress ruleset via `phpcs.xml.dist`; run `composer lint` before every commit
- Short array syntax `[]` is allowed (sniff excluded)
- No short ternary (`?:`) — use full ternary or if/else
- File naming: short names (`class-rest.php`, `class-settings.php`) are intentional and suppressed inline with `phpcs:ignore`
- `current_user_can('manage_options')` — use capabilities, not role names
- Do not shadow the `$current_user` WordPress global; use a prefixed variable (e.g. `$quickpostr_user`)

## JS conventions

- `package.json` pins `overrides.prettier` to `npm:wp-prettier@^3.0.3`. Do not
  remove it. `@wordpress/eslint-plugin` declares a peer of `prettier: ">=3"`, so
  without the override an `npm update` hoists vanilla prettier over the
  WordPress fork, `parenSpacing` stops being honoured, and every `( foo )` in the
  codebase becomes a lint error (728 of them, when this happened).

- `.npmrc` sets `legacy-peer-deps=true`. `@wordpress/scripts` 36 declares
  optional peers (vitest, vite) whose peer ranges npm's strict resolver cannot
  satisfy together; the project uses neither. Do not remove it, or `npm ci`
  fails with ERESOLVE.
- JS tests stay on Jest via `wp-scripts test-unit-jest` and `jest.config.cjs`
  (`@wordpress/jest-preset-default`). `test-unit-js` now means Vitest.
- `.nvmrc` must satisfy `@wordpress/scripts`' `engines.node`; CI reads it.
- Build toolchain: `@wordpress/scripts` + custom `webpack.config.js` (async entry, Blockendar pattern)
- Two bundles: `index.js` (editor) and `composer-view.js` (front end)
- React is externalized — use `@wordpress/element` (`createRoot`), not `react-dom/client`
- `@wordpress/rich-text` is externalized; import from the package, dependency extraction handles the rest
- No Application Passwords — auth is cookie + nonce only (`X-WP-Nonce` header)

## Git

- Never add Claude as a co-author in commit messages
- v1 is preserved on the `v1` branch; active development is on `v2`
