<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- short name intentional; class is QuickPostr_Rest.
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
			'/draft',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_draft' ),
				'permission_callback' => array( $this, 'check_permission' ),
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
	 * Return the current user's latest QuickPostr draft, if one exists.
	 *
	 * The composer uses this on mount to offer a "Resume draft?" banner.
	 * Returns null (HTTP 200) when no draft is found.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_draft(): \WP_REST_Response {
		$query = new \WP_Query(
			array(
				'post_type'      => 'post',
				'post_status'    => 'draft',
				'author'         => get_current_user_id(),
				'posts_per_page' => 1,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- _quickpostr_post is an indexed flag on QuickPostr posts only.
				'meta_query'     => array(
					array(
						'key'   => '_quickpostr_post',
						'value' => '1',
					),
				),
			)
		);

		if ( empty( $query->posts ) ) {
			return rest_ensure_response( null );
		}

		$post_id       = $query->posts[0]->ID;
		$inner_request = new \WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$inner_request->set_query_params(
			array(
				'context' => 'edit',
				'_fields' => 'id,title,content,format,status',
			)
		);
		$inner_response = rest_do_request( $inner_request );

		return rest_ensure_response( $inner_response->get_data() );
	}

	/**
	 * Return sanitized plugin settings for the app to consume.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_settings(): \WP_REST_Response {
		$settings = QuickPostr_Settings::get();

		// Strip server-only settings the client does not need.
		unset( $settings['allowed_roles'], $settings['hide_admin_bar'], $settings['front_end_edit'] );

		return rest_ensure_response( $settings );
	}
}
