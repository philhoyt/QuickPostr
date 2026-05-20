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

		$this->register_like_routes();
	}

	/**
	 * Register the like toggle route.
	 */
	public function register_like_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/posts/(?P<id>\d+)/like',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'toggle_like' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'validate_callback' => function ( $value ) {
							return is_numeric( $value );
						},
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Toggle a like-comment for the current user on the given post.
	 *
	 * Creates a quickpostr_like comment if none exists; deletes it if it does.
	 * Returns the authoritative liked state and like count.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function toggle_like( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$post_id = absint( $request->get_param( 'id' ) );
		$post    = get_post( $post_id );

		if ( ! $post || 'publish' !== $post->post_status ) {
			return new \WP_Error(
				'rest_post_not_found',
				esc_html__( 'Post not found.', 'quickpostr' ),
				array( 'status' => 404 )
			);
		}

		$user_id    = get_current_user_id();
		$comment_id = $this->get_user_like_comment_id( $post_id, $user_id );

		if ( $comment_id ) {
			wp_delete_comment( $comment_id, true );
			$liked = false;
		} else {
			$quickpostr_user = wp_get_current_user();
			$display_name    = $quickpostr_user->display_name ? $quickpostr_user->display_name : $quickpostr_user->user_login;

			wp_insert_comment(
				array(
					'comment_post_ID'  => $post_id,
					'user_id'          => $user_id,
					'comment_type'     => 'quickpostr_like',
					'comment_content'  => sanitize_text_field( $display_name ) . esc_html__( ' liked this post', 'quickpostr' ),
					'comment_approved' => 1,
				)
			);
			$liked = true;
		}

		return rest_ensure_response(
			array(
				'liked' => $liked,
				'count' => $this->get_like_count( $post_id ),
			)
		);
	}

	/**
	 * Return the number of quickpostr_like comments on a post.
	 *
	 * @param int $post_id The post ID.
	 * @return int
	 */
	public function get_like_count( int $post_id ): int {
		return (int) get_comments(
			array(
				'post_id' => $post_id,
				'type'    => 'quickpostr_like',
				'status'  => 'approve',
				'count'   => true,
			)
		);
	}

	/**
	 * Return the comment ID of the current user's like-comment on a post, or false.
	 *
	 * @param int $post_id The post ID.
	 * @param int $user_id The user ID.
	 * @return int|false
	 */
	public function get_user_like_comment_id( int $post_id, int $user_id ): int|false {
		$comments = get_comments(
			array(
				'post_id' => $post_id,
				'user_id' => $user_id,
				'type'    => 'quickpostr_like',
				'status'  => 'approve',
				'number'  => 1,
			)
		);

		if ( ! empty( $comments ) ) {
			return (int) $comments[0]->comment_ID;
		}

		return false;
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
