<?php
/**
 * Custom REST API endpoints for QuickPostr.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr_Rest
 *
 * Registers plugin-specific REST routes under /quickpostr/v1/.
 */
class QuickPostr_Rest {

	/**
	 * REST namespace.
	 */
	const NAMESPACE = 'quickpostr/v1';

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register all plugin REST routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/feed',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_feed' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'format'   => array(
						'type'              => 'string',
						'enum'              => array( 'status', 'photo' ),
						'sanitize_callback' => 'sanitize_key',
					),
					'per_page' => array(
						'type'    => 'integer',
						'default' => 20,
						'minimum' => 1,
						'maximum' => 50,
					),
					'page'     => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
					),
				),
			)
		);
	}

	/**
	 * Verify the request comes from an authenticated user with an allowed role.
	 *
	 * @return bool|WP_Error
	 */
	public function check_permission(): bool|\WP_Error {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error(
				'rest_forbidden',
				esc_html__( 'You must be logged in to access QuickPostr settings.', 'quickpostr' ),
				array( 'status' => 401 )
			);
		}
		return true;
	}

	/**
	 * Return sanitized plugin settings for the app to consume.
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings(): \WP_REST_Response {
		$settings = QuickPostr_Settings::get();

		// Strip any data the client doesn't need.
		unset( $settings['allowed_roles'] );

		return rest_ensure_response( $settings );
	}

	/**
	 * Return the current user's QuickPostr posts, optionally filtered by format.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response
	 */
	public function get_feed( \WP_REST_Request $request ): \WP_REST_Response {
		$tax_query = array(
			'relation' => 'AND',
			array(
				'taxonomy' => 'quickpostr_source',
				'field'    => 'slug',
				'terms'    => array( 'app' ),
			),
		);

		$format = $request->get_param( 'format' );
		if ( $format ) {
			$tax_query[] = array(
				'taxonomy' => 'quickpostr_source',
				'field'    => 'slug',
				'terms'    => array( sanitize_key( $format ) ),
			);
		}

		$query = new \WP_Query(
			array(
				'post_type'      => 'post',
				'post_status'    => array( 'publish', 'draft' ),
				'author'         => get_current_user_id(),
				'posts_per_page' => (int) $request->get_param( 'per_page' ),
				'paged'          => (int) $request->get_param( 'page' ),
				'tax_query'      => $tax_query, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				'no_found_rows'  => false,
			)
		);

		$posts = array();
		foreach ( $query->posts as $post ) {
			$featured_media_url = '';
			if ( has_post_thumbnail( $post ) ) {
				$thumb = wp_get_attachment_image_src( get_post_thumbnail_id( $post ), 'large' );
				if ( $thumb ) {
					$featured_media_url = $thumb[0];
				}
			}

			$posts[] = array(
				'id'                  => $post->ID,
				'title'               => $post->post_title,
				'content'             => wpautop( $post->post_content ),
				'date'                => $post->post_date_gmt,
				'status'              => $post->post_status,
				'format'              => get_post_format( $post ) ?: 'standard',
				'link'                => get_permalink( $post ),
				'featured_media_url'  => $featured_media_url,
			);
		}

		$response = rest_ensure_response( $posts );
		$response->header( 'X-WP-Total', (int) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (int) $query->max_num_pages );

		return $response;
	}
}
