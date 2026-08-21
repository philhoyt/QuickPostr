<?php
/**
 * Shared base class for QuickPostr integration tests.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

use QuickPostr;
use WP_UnitTestCase;

/**
 * Restores the plugin state that WP_UnitTestCase tears down between tests.
 */
abstract class QuickPostrTestCase extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();

		/*
		 * WP_UnitTestCase::tear_down() calls unregister_all_meta_keys(), which
		 * drops _quickpostr_post along with everything else. That flag is what
		 * assign_source_terms() checks before generating a title and assigning
		 * source terms, so without re-registering it here every test after the
		 * first would silently exercise a plugin with its title logic disabled
		 * — and pass or fail for the wrong reason.
		 */
		( new QuickPostr() )->register_post_meta();

		// REST routes and the write-only post fields are registered on this
		// hook; the test bootstrap never fires a real request.
		do_action( 'rest_api_init' );
	}
}
