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
npm run test:unit
```

### Integration test setup (one time)

The integration suite needs the WordPress core test library and a **throwaway**
database — the harness drops all tables in it on every run.

```bash
bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version]
```

With Local by Flywheel, the host is the mysqld socket path:

```bash
SOCK="$HOME/Library/Application Support/Local/run/<site-id>/mysql/mysqld.sock"
bin/install-wp-tests.sh quickpostr_tests root root "localhost:$SOCK" 7.1
```

Local must be running for the integration suite; the unit suite has no such
dependency. PHPUnit is pinned to ^9.6 because the WordPress core test library
caps there — `yoast/phpunit-polyfills` supports at most PHPUnit 12, and
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

- Build toolchain: `@wordpress/scripts` + custom `webpack.config.js` (async entry, Blockendar pattern)
- Two bundles: `index.js` (editor) and `composer-view.js` (front end)
- React is externalized — use `@wordpress/element` (`createRoot`), not `react-dom/client`
- `@wordpress/rich-text` is externalized; import from the package, dependency extraction handles the rest
- No Application Passwords — auth is cookie + nonce only (`X-WP-Nonce` header)

## Git

- Never add Claude as a co-author in commit messages
- v1 is preserved on the `v1` branch; active development is on `v2`
