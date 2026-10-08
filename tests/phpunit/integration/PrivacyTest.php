<?php
/**
 * Integration coverage for the personal-data exporter and eraser.
 *
 * Likes are comments, but core's comment tools select by author email only.
 * These tests pin down that a like made while logged in — which has a user ID
 * — is found by the account's email, and that erasure removes the row rather
 * than leaving an anonymised shell behind.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

use QuickPostr_Privacy;
use QuickPostr_Rest;
use WP_REST_Request;

/**
 * QuickPostr_Privacy.
 */
final class PrivacyTest extends QuickPostrTestCase {

	private int $post_id;

	private QuickPostr_Privacy $privacy;

	public function set_up(): void {
		parent::set_up();

		$this->post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$this->privacy = new QuickPostr_Privacy();

		$_SERVER['REMOTE_ADDR'] = '203.0.113.5';
	}

	public function tear_down(): void {
		unset( $_SERVER['REMOTE_ADDR'] );
		parent::tear_down();
	}

	private function like( array $body = array() ): void {
		$request = new WP_REST_Request( 'POST', '/quickpostr/v1/posts/' . $this->post_id . '/like' );
		foreach ( $body as $key => $value ) {
			$request->set_param( $key, $value );
		}
		rest_get_server()->dispatch( $request );
	}

	public function test_exporter_and_eraser_are_registered(): void {
		$exporters = apply_filters( 'wp_privacy_personal_data_exporters', array() );
		$erasers   = apply_filters( 'wp_privacy_personal_data_erasers', array() );

		$this->assertArrayHasKey( 'quickpostr-likes', $exporters );
		$this->assertArrayHasKey( 'quickpostr-likes', $erasers );
	}

	public function test_logged_in_like_is_exported_by_account_email(): void {
		$user_id = self::factory()->user->create(
			array(
				'role'       => 'subscriber',
				'user_email' => 'ada@example.test',
			)
		);
		wp_set_current_user( $user_id );
		$this->like();
		wp_set_current_user( 0 );

		$export = $this->privacy->export_likes( 'ada@example.test' );

		$this->assertTrue( $export['done'] );
		$this->assertCount( 1, $export['data'] );
		$this->assertSame( 'quickpostr-likes', $export['data'][0]['group_id'] );

		$fields = array_column( $export['data'][0]['data'], 'value', 'name' );
		$this->assertSame( get_the_title( $this->post_id ), $fields['Post'] );
		$this->assertSame( 'ada@example.test', $fields['Email'] );
	}

	public function test_anonymous_like_is_exported_by_submitted_email(): void {
		$this->like(
			array(
				'name'  => 'Grace',
				'email' => 'grace@example.test',
			)
		);

		$export = $this->privacy->export_likes( 'grace@example.test' );

		$this->assertCount( 1, $export['data'] );
		$fields = array_column( $export['data'][0]['data'], 'value', 'name' );
		$this->assertSame( 'Grace', $fields['Name'] );
	}

	public function test_unknown_email_exports_nothing(): void {
		$this->like( array( 'name' => 'Someone' ) );

		$export = $this->privacy->export_likes( 'nobody@example.test' );

		$this->assertSame( array(), $export['data'] );
		$this->assertTrue( $export['done'] );
	}

	public function test_eraser_deletes_likes_and_refreshes_the_count(): void {
		$user_id = self::factory()->user->create(
			array(
				'role'       => 'subscriber',
				'user_email' => 'ada@example.test',
			)
		);
		wp_set_current_user( $user_id );
		$this->like();
		wp_set_current_user( 0 );

		// A second, unrelated like must survive.
		$_SERVER['REMOTE_ADDR'] = '198.51.100.9';
		$this->like( array( 'name' => 'Bystander' ) );

		$this->assertSame( 2, ( new QuickPostr_Rest() )->get_like_count( $this->post_id ) );

		$result = $this->privacy->erase_likes( 'ada@example.test' );

		$this->assertSame( 1, $result['items_removed'] );
		$this->assertSame( 0, $result['items_retained'] );
		$this->assertTrue( $result['done'] );

		$remaining = get_comments(
			array(
				'post_id' => $this->post_id,
				'type'    => 'quickpostr_like',
			)
		);
		$this->assertCount( 1, $remaining );
		$this->assertSame( 'Bystander', $remaining[0]->comment_author );

		$this->assertSame(
			1,
			(int) get_post_meta( $this->post_id, QuickPostr_Rest::LIKE_COUNT_META, true ),
			'Deleting a like through the eraser must update the cached count.'
		);
	}

	/**
	 * The visitor's name used to be repeated inside comment_content, where
	 * core's anonymiser never looks.
	 */
	public function test_like_content_does_not_repeat_the_name(): void {
		$this->like( array( 'name' => 'Grace' ) );

		$comments = get_comments(
			array(
				'post_id' => $this->post_id,
				'type'    => 'quickpostr_like',
			)
		);

		$this->assertStringNotContainsString( 'Grace', $comments[0]->comment_content );
	}

	/**
	 * Core only accepts suggested policy text during or after admin_init in
	 * wp-admin. Firing the real hook sends headers the test runner cannot, so
	 * the test stands in an admin screen and marks the action as having run.
	 */
	public function test_policy_text_is_suggested_during_admin_init(): void {
		set_current_screen( 'options-privacy' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$had_admin_init                      = $GLOBALS['wp_actions']['admin_init'] ?? null;
		$GLOBALS['wp_actions']['admin_init'] = 1; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- test fixture, restored below.

		$this->privacy->add_privacy_policy_content();

		if ( null === $had_admin_init ) {
			unset( $GLOBALS['wp_actions']['admin_init'] );
		} else {
			$GLOBALS['wp_actions']['admin_init'] = $had_admin_init; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- restoring the fixture.
		}

		$property = new \ReflectionProperty( \WP_Privacy_Policy_Content::class, 'policy_content' );
		$property->setAccessible( true );
		$sections = (array) $property->getValue();

		set_current_screen( 'front' );

		$found = false;
		foreach ( $sections as $section ) {
			if ( 'QuickPostr' === $section['plugin_name'] ) {
				$found = true;
				$this->assertStringContainsString( 'Nominatim', $section['policy_text'] );
				$this->assertStringContainsString( '24 hours', $section['policy_text'] );
			}
		}
		$this->assertTrue( $found, 'QuickPostr should register suggested privacy-policy text.' );
	}
}
