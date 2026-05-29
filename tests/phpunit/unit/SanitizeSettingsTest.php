<?php
/**
 * Unit tests for QuickPostr_Settings::sanitize_settings().
 *
 * This is the security-relevant save sanitizer: it whitelists roles against the
 * real role list, constrains the status enum, and coerces checkboxes/ints.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use QuickPostr_Settings;

/**
 * @covers QuickPostr_Settings::sanitize_settings
 */
final class SanitizeSettingsTest extends TestCase {

	private QuickPostr_Settings $settings;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// wp_roles()->roles is the source of valid role keys.
		$roles = (object) array(
			'roles' => array(
				'administrator' => array( 'name' => 'Administrator' ),
				'editor'        => array( 'name' => 'Editor' ),
				'author'        => array( 'name' => 'Author' ),
				'subscriber'    => array( 'name' => 'Subscriber' ),
			),
		);
		Functions\when( 'wp_roles' )->justReturn( $roles );
		Functions\when( 'absint' )->alias( static fn( $v ) => abs( (int) $v ) );

		$this->settings = new QuickPostr_Settings();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_non_array_input_returns_defaults(): void {
		$result = $this->settings->sanitize_settings( 'not-an-array' );
		$this->assertSame( QuickPostr_Settings::defaults(), $result );
	}

	public function test_invalid_roles_are_dropped(): void {
		$result = $this->settings->sanitize_settings(
			array( 'allowed_roles' => array( 'administrator', 'editor', 'bogus-role', 'subscriber' ) )
		);
		$this->assertSame(
			array( 'administrator', 'editor', 'subscriber' ),
			$result['allowed_roles']
		);
	}

	public function test_empty_roles_fall_back_to_defaults(): void {
		$result = $this->settings->sanitize_settings(
			array( 'allowed_roles' => array( 'bogus-role' ) )
		);
		$this->assertSame(
			array( 'administrator', 'editor', 'author' ),
			$result['allowed_roles']
		);
	}

	public function test_status_enum_is_enforced(): void {
		$draft = $this->settings->sanitize_settings( array( 'default_status' => 'draft' ) );
		$this->assertSame( 'draft', $draft['default_status'] );

		$bad = $this->settings->sanitize_settings( array( 'default_status' => 'pending; DROP TABLE' ) );
		$this->assertSame( 'publish', $bad['default_status'] );
	}

	public function test_default_category_is_cast_to_absint(): void {
		$result = $this->settings->sanitize_settings( array( 'default_category' => '-42abc' ) );
		$this->assertSame( 42, $result['default_category'] );
	}

	public function test_checkboxes_coerce_to_bool(): void {
		$on = $this->settings->sanitize_settings(
			array(
				'show_slug_preview' => '1',
				'hide_admin_bar'    => '1',
				'strip_exif'        => '1',
			)
		);
		$this->assertTrue( $on['show_slug_preview'] );
		$this->assertTrue( $on['hide_admin_bar'] );
		$this->assertTrue( $on['strip_exif'] );

		// Absent checkboxes become false (unchecked boxes are not posted).
		$off = $this->settings->sanitize_settings( array() );
		$this->assertFalse( $off['show_slug_preview'] );
		$this->assertFalse( $off['hide_admin_bar_admins'] );
		$this->assertFalse( $off['front_end_edit'] );
	}
}
