<?php
/**
 * PHPUnit bootstrap for QuickPostr integration tests.
 *
 * Boots a real WordPress against a throwaway database, so tests can exercise
 * capability checks, REST routes and hook wiring against the actual runtime
 * rather than mocks.
 *
 * Runs inside the wp-env PHPUnit environment (.wp-env.phpunit.json), which
 * ships the WordPress core test library and points WP_TESTS_DIR at it. That
 * environment is separate from the E2E one on purpose: the core bootstrap
 * drops every table in the database it is given.
 *
 * @package QuickPostr
 */

$quickpostr_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $quickpostr_tests_dir || ! file_exists( $quickpostr_tests_dir . '/includes/functions.php' ) ) {
	fwrite( STDERR, "WP_TESTS_DIR is not set or does not contain the WordPress test library.\n" );
	fwrite( STDERR, "Run the integration suite inside wp-env:\n" );
	fwrite( STDERR, "  npm run env:phpunit:start && composer test:integration\n" );
	exit( 1 );
}

require_once $quickpostr_tests_dir . '/includes/functions.php';

/**
 * Load QuickPostr before WordPress finishes booting, so its init hooks fire.
 */
tests_add_filter(
	'muplugins_loaded',
	static function (): void {
		require dirname( __DIR__, 2 ) . '/quickpostr.php';
	}
);

/*
 * Stand in for GeoTagr so the quickpostr_geo write path is exercised. The
 * callback only checks that this function exists. VideoMuxr is deliberately
 * left undefined, so the two fields between them cover both branches: one
 * companion plugin present, one absent.
 */
if ( ! function_exists( 'geo_tagr_get_post_meta' ) ) {
	/**
	 * Test stub for GeoTagr's presence check.
	 *
	 * @return null
	 */
	function geo_tagr_get_post_meta() {
		return null;
	}
}

require $quickpostr_tests_dir . '/includes/bootstrap.php';

// Loaded after the harness so WP_UnitTestCase exists; test files are collected
// alphabetically, so the shared base class has to be defined before them.
require_once __DIR__ . '/integration/QuickPostrTestCase.php';
