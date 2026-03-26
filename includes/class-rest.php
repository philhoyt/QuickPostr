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

		// Strip server-only settings the client does not need.
		unset( $settings['allowed_roles'], $settings['hide_admin_bar'], $settings['front_end_edit'] );

		return rest_ensure_response( $settings );
	}
}
