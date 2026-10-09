/**
 * Playwright configuration.
 *
 * Extends the @wordpress/scripts base config. That config derives the base
 * URL, the `webServer` port it waits on and the REST login target from
 * WP_BASE_URL, and defaults it to the old wp-env tests port (8889). The E2E
 * environment in .wp-env.json serves 8888, so the variable is set before the
 * base config is loaded rather than overriding `use.baseURL` afterwards.
 */
process.env.WP_BASE_URL ??= 'http://localhost:8888';

const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

module.exports = {
	...baseConfig,
	testDir: './tests/e2e/specs',
};
