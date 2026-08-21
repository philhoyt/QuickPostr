<?php
/**
 * Integration coverage for the public like endpoint.
 *
 * This route is `permission_callback => '__return_true'` — the only
 * unauthenticated write the plugin exposes — so it is tested against a real
 * database rather than mocks. SEC-01 slipped through a mocked suite that
 * covered each dedupe helper in isolation but never the route end to end.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

use WP_REST_Request;

/**
 * The /quickpostr/v1/posts/<id>/like route.
 */
final class LikeEndpointTest extends QuickPostrTestCase {

	private int $post_id;

	public function set_up(): void {
		parent::set_up();

		$this->post_id = self::factory()->post->create(
			array( 'post_status' => 'publish' )
		);

		$_SERVER['REMOTE_ADDR'] = '203.0.113.5';
	}

	public function tear_down(): void {
		unset( $_SERVER['REMOTE_ADDR'] );
		parent::tear_down();
	}

	/**
	 * POST a like.
	 *
	 * @param array $body Request body.
	 * @param int   $post_id Post to like, defaults to the fixture.
	 * @return \WP_REST_Response
	 */
	private function like( array $body = array(), ?int $post_id = null ) {
		$request = new WP_REST_Request(
			'POST',
			'/quickpostr/v1/posts/' . ( $post_id ?? $this->post_id ) . '/like'
		);
		foreach ( $body as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return rest_get_server()->dispatch( $request );
	}

	public function test_anonymous_like_requires_a_name(): void {
		$response = $this->like();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_missing_name', $response->get_data()['code'] );
	}

	public function test_anonymous_like_is_counted(): void {
		$response = $this->like( array( 'name' => 'Ada' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['liked'] );
		$this->assertSame( 1, $response->get_data()['count'] );
	}

	/**
	 * SEC-01 at the route level.
	 *
	 * The IP check previously ran only when no email was supplied, so a client
	 * could like the same post without limit by sending a fresh address each
	 * time. Four different addresses from one IP must still count once.
	 */
	public function test_fresh_emails_from_one_ip_cannot_inflate_the_count(): void {
		$this->like( array( 'name' => 'One' ) );

		foreach ( array( 'a@example.test', 'b@example.test', 'c@example.test' ) as $email ) {
			$response = $this->like(
				array(
					'name'  => 'Bot',
					'email' => $email,
				)
			);
			$this->assertSame( 200, $response->get_status() );
		}

		$this->assertSame(
			1,
			$this->like( array( 'name' => 'Again' ) )->get_data()['count'],
			'A rotating email must not bypass the per-IP dedupe.'
		);
	}

	public function test_a_different_ip_may_like_the_same_post(): void {
		$this->like( array( 'name' => 'First' ) );

		$_SERVER['REMOTE_ADDR'] = '198.51.100.9';
		$response               = $this->like( array( 'name' => 'Second' ) );

		$this->assertSame( 2, $response->get_data()['count'] );
	}

	public function test_the_raw_ip_is_never_stored(): void {
		$this->like( array( 'name' => 'Ada' ) );

		$comments = get_comments(
			array(
				'post_id' => $this->post_id,
				'type'    => 'quickpostr_like',
			)
		);
		$this->assertCount( 1, $comments );

		$comment = $comments[0];
		$this->assertSame( '', $comment->comment_author_IP, 'The raw IP must not be persisted.' );

		$hash = get_comment_meta( $comment->comment_ID, \QuickPostr_Rest::LIKE_IP_META, true );
		$this->assertNotEmpty( $hash );
		$this->assertStringNotContainsString( '203.0.113.5', (string) $hash );
	}

	public function test_logged_in_like_toggles_off_again(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$first = $this->like();
		$this->assertTrue( $first->get_data()['liked'] );
		$this->assertSame( 1, $first->get_data()['count'] );

		// Each subsequent call from the same user flips the state.
		$second = $this->like();
		$this->assertFalse( $second->get_data()['liked'], 'A second like from the same user unlikes.' );
		$this->assertSame( 0, $second->get_data()['count'] );

		$third = $this->like();
		$this->assertTrue( $third->get_data()['liked'], 'And a third likes again.' );
		$this->assertSame( 1, $third->get_data()['count'] );
	}

	public function test_unpublished_posts_cannot_be_liked(): void {
		$draft    = self::factory()->post->create( array( 'post_status' => 'draft' ) );
		$response = $this->like( array( 'name' => 'Ada' ), $draft );

		$this->assertSame( 404, $response->get_status() );
	}

	public function test_like_comments_are_excluded_from_the_comment_count(): void {
		$this->like( array( 'name' => 'Ada' ) );

		$this->assertSame(
			'0',
			(string) get_comments_number( $this->post_id ),
			'Likes are stored as comments but must not inflate the visible count.'
		);
	}
}
