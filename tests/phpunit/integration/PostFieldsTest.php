<?php
/**
 * Integration coverage for QuickPostr's writable post fields and title logic.
 *
 * These are the paths that make the composer work through the core REST route:
 * the write-only quickpostr_geo / quickpostr_video fields, the capability
 * guards on their callbacks, and the rules deciding whether PHP generates a
 * title or honours one the user typed.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

use WP_REST_Request;

/**
 * Coverage for quickpostr_geo, quickpostr_video and title handling.
 */
final class PostFieldsTest extends QuickPostrTestCase {

	private int $author_id;

	public function set_up(): void {
		parent::set_up();

		$this->author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $this->author_id );
	}

	/**
	 * Create a post through the core REST route, the way the composer does.
	 *
	 * @param array $body Request body.
	 * @return \WP_REST_Response
	 */
	private function create( array $body ) {
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * GeoTagr is stubbed in the integration bootstrap, so this exercises the
	 * companion-plugin-present branch of the callback.
	 */
	public function test_geo_field_writes_geotagr_meta(): void {
		$response = $this->create(
			array(
				'title'          => 'Geo post',
				'content'        => 'body',
				'status'         => 'publish',
				'quickpostr_geo' => array(
					'lat'     => 41.4993,
					'lng'     => -81.6944,
					'place'   => 'Cleveland',
					'address' => 'Cleveland, OH',
				),
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$post_id = $response->get_data()['id'];

		$this->assertSame( '41.4993', get_post_meta( $post_id, '_geo_tagr_lat', true ) );
		$this->assertSame( 'Cleveland', get_post_meta( $post_id, '_geo_tagr_place', true ) );
	}

	public function test_geo_field_is_write_only(): void {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey(
			'quickpostr_geo',
			$data,
			'The geo field must never appear in a response.'
		);
		$this->assertArrayNotHasKey( 'quickpostr_video', $data );
	}

	/**
	 * VideoMuxr is absent from the test runtime, so the callback must decline
	 * rather than attach Mux ids to an arbitrary post.
	 */
	public function test_video_field_is_ignored_without_videomuxr(): void {
		$response = $this->create(
			array(
				'title'            => 'Video post',
				'content'          => 'body',
				'status'           => 'publish',
				'quickpostr_video' => array(
					'playback_id' => 'pb_forged',
					'asset_id'    => 'as_forged',
				),
			)
		);

		$post_id = $response->get_data()['id'];
		$this->assertSame( '', get_post_meta( $post_id, '_videomuxr_playback_id', true ) );
	}

	/**
	 * With no title in the request, PHP owns the canonical value.
	 */
	public function test_php_generates_a_title_when_none_is_sent(): void {
		$response = $this->create(
			array(
				'title'   => '',
				'content' => 'A thought worth keeping.',
				'status'  => 'publish',
				'format'  => 'status',
				'meta'    => array( '_quickpostr_post' => '1' ),
			)
		);

		$post_id = $response->get_data()['id'];
		$this->assertSame( 'A thought worth keeping.', get_post( $post_id )->post_title );
		$this->assertEmpty(
			get_post_meta( $post_id, '_quickpostr_custom_title', true ),
			'A generated title must not be flagged as the user\'s own.'
		);
	}

	public function test_a_typed_title_is_honoured_and_flagged(): void {
		$response = $this->create(
			array(
				'title'   => 'My Very Own Headline',
				'content' => 'Body text that would otherwise become the title.',
				'status'  => 'publish',
				'format'  => 'status',
				'meta'    => array( '_quickpostr_post' => '1' ),
			)
		);

		$post_id = $response->get_data()['id'];
		$this->assertSame( 'My Very Own Headline', get_post( $post_id )->post_title );
		$this->assertSame( '1', get_post_meta( $post_id, '_quickpostr_custom_title', true ) );
	}

	public function test_generated_titles_are_hidden_on_the_front_end(): void {
		$response = $this->create(
			array(
				'title'   => '',
				'content' => 'Hidden please.',
				'status'  => 'publish',
				'format'  => 'status',
				'meta'    => array( '_quickpostr_post' => '1' ),
			)
		);
		$post_id  = $response->get_data()['id'];

		$this->assertSame(
			'',
			apply_filters( 'the_title', get_post( $post_id )->post_title, $post_id ),
			'An auto-generated title must be suppressed in the feed.'
		);
	}

	public function test_custom_titles_are_shown_on_the_front_end(): void {
		$response = $this->create(
			array(
				'title'   => 'Show Me',
				'content' => 'Body.',
				'status'  => 'publish',
				'format'  => 'status',
				'meta'    => array( '_quickpostr_post' => '1' ),
			)
		);
		$post_id  = $response->get_data()['id'];

		$this->assertSame(
			'Show Me',
			apply_filters( 'the_title', get_post( $post_id )->post_title, $post_id ),
			'A title the user typed is the whole point; it must not be hidden.'
		);
	}

	/**
	 * The composer's date field reaches core untouched.
	 */
	public function test_a_backdated_post_keeps_its_date_and_label(): void {
		$response = $this->create(
			array(
				'title'   => '',
				'content' => 'Backdated body.',
				'date'    => '2025-07-04T09:15:00',
				'status'  => 'publish',
				'format'  => 'status',
				'meta'    => array( '_quickpostr_post' => '1' ),
			)
		);

		$post_id = $response->get_data()['id'];
		$post    = get_post( $post_id );

		$this->assertSame( '2025-07-04 09:15:00', $post->post_date );
		$this->assertSame(
			'Backdated body.',
			$post->post_title,
			'The title is generated from the content of the backdated post.'
		);
	}

	public function test_a_future_date_schedules_rather_than_publishes(): void {
		$response = $this->create(
			array(
				'title'   => 'Later',
				'content' => 'body',
				'date'    => gmdate( 'Y-m-d\TH:i:s', time() + DAY_IN_SECONDS ),
				'status'  => 'publish',
			)
		);

		$this->assertSame(
			'future',
			get_post( $response->get_data()['id'] )->post_status,
			'Core turns a future-dated publish into a scheduled post.'
		);
	}
}
