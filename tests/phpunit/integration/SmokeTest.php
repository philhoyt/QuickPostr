<?php
/**
 * Confirms the integration harness boots WordPress with QuickPostr active.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

/**
 * Harness smoke test.
 */
final class SmokeTest extends QuickPostrTestCase {

	public function test_wordpress_is_loaded(): void {
		$this->assertTrue( defined( 'ABSPATH' ) );
		$this->assertNotEmpty( get_bloginfo( 'name' ) );
	}

	public function test_quickpostr_is_active(): void {
		$this->assertTrue( class_exists( 'QuickPostr_Rest' ) );
		$this->assertTrue( defined( 'QUICKPOSTR_VERSION' ) );
	}

	public function test_taxonomy_and_blocks_are_registered(): void {
		$this->assertTrue( taxonomy_exists( 'quickpostr_source' ) );
		$registry = \WP_Block_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'quickpostr/composer' ) );
	}
}
