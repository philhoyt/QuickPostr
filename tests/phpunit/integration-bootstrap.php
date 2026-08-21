<?php
/**
 * PHPUnit bootstrap for QuickPostr integration tests.
 *
 * Boots a real WordPress against a throwaway database, so tests can exercise
 * capability checks, REST routes and hook wiring against the actual runtime
 * rather than mocks. Requires bin/install-wp-tests.sh to have been run.
 *
 * @package QuickPostr
 */

$quickpostr_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $quickpostr_tests_dir ) {
	$quickpostr_tests_dir = '/tmp/wordpress-tests-lib';
}

if ( ! file_exists( $quickpostr_tests_dir . '/includes/functions.php' ) ) {
	fwrite( STDERR, "Could not find the WordPress test library at {$quickpostr_tests_dir}.\n" );
	fwrite( STDERR, "Run: bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version]\n" );
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
