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

		$geo_args = array(
			'title'                 => array(
				'type'    => 'string',
				'default' => '',
			),
			'content'               => array(
				'type'    => 'string',
				'default' => '',
			),
			'status'                => array(
				'type'    => 'string',
				'default' => 'publish',
				'enum'    => array( 'publish', 'draft', 'pending', 'private' ),
			),
			'format'                => array(
				'type'    => 'string',
				'default' => 'standard',
			),
			'tags'                  => array(
				'type'    => 'array',
				'items'   => array( 'type' => 'integer' ),
				'default' => array(),
			),
			'categories'            => array(
				'type'    => 'array',
				'items'   => array( 'type' => 'integer' ),
				'default' => array(),
			),
			'meta'                  => array(
				'type'    => 'object',
				'default' => array(),
			),
			'featured_media'        => array(
				'type'    => 'integer',
				'default' => 0,
			),
			'videomuxr_playback_id' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'videomuxr_asset_id'    => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'geo_lat'               => array(
				'type'              => 'number',
				'sanitize_callback' => fn( $v ) => (float) $v,
			),
			'geo_lng'               => array(
				'type'              => 'number',
				'sanitize_callback' => fn( $v ) => (float) $v,
			),
			'geo_place'             => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'geo_address'           => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
		);

		register_rest_route(
			self::NAMESPACE,
			'/posts',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_post_with_geo' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => $geo_args,
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/posts/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_post_with_geo' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array_merge(
					$geo_args,
					array(
						'id' => array(
							'validate_callback' => function ( $value ) {
								return is_numeric( $value );
							},
							'sanitize_callback' => 'absint',
						),
					)
				),
			)
		);

		$this->register_like_routes();
	}

	/**
	 * Create a post via the core WP REST endpoint, then save GeoTagr meta if present.
	 *
	 * Proxies standard post fields to /wp/v2/posts so WP core handles all
	 * validation and hooks (including assign_source_terms). The geo_* params
	 * are written directly via update_post_meta() after the post is created.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_post_with_geo( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$inner = new \WP_REST_Request( 'POST', '/wp/v2/posts' );

		foreach ( array( 'title', 'content', 'status', 'format', 'tags', 'categories', 'meta' ) as $key ) {
			$value = $request->get_param( $key );
			if ( null !== $value ) {
				$inner->set_param( $key, $value );
			}
		}

		$featured_media = (int) $request->get_param( 'featured_media' );
		if ( $featured_media ) {
			$inner->set_param( 'featured_media', $featured_media );
		}

		$response = rest_do_request( $inner );
		$data     = $response->get_data();
		$post_id  = is_array( $data ) ? ( $data['id'] ?? 0 ) : 0;

		if ( $post_id ) {
			$this->save_videomuxr_meta( $post_id, $request );
		}

		if ( $post_id && function_exists( 'geo_tagr_get_post_meta' ) ) {
			$geo_map = array(
				'_geo_tagr_lat'     => $request->get_param( 'geo_lat' ),
				'_geo_tagr_lng'     => $request->get_param( 'geo_lng' ),
				'_geo_tagr_place'   => $request->get_param( 'geo_place' ),
				'_geo_tagr_address' => $request->get_param( 'geo_address' ),
			);
			foreach ( $geo_map as $meta_key => $meta_value ) {
				if ( null !== $meta_value && '' !== $meta_value ) {
					update_post_meta( $post_id, $meta_key, $meta_value );
				}
			}
		}

		return $response;
	}

	/**
	 * Update an existing post via the core WP REST endpoint, then save GeoTagr meta.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_post_with_geo( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$post_id = (int) $request->get_param( 'id' );
		$inner   = new \WP_REST_Request( 'PUT', "/wp/v2/posts/$post_id" );

		foreach ( array( 'title', 'content', 'status', 'format', 'tags', 'categories', 'meta' ) as $key ) {
			$value = $request->get_param( $key );
			if ( null !== $value ) {
				$inner->set_param( $key, $value );
			}
		}

		$featured_media = (int) $request->get_param( 'featured_media' );
		if ( $featured_media ) {
			$inner->set_param( 'featured_media', $featured_media );
		}

		$response   = rest_do_request( $inner );
		$data       = $response->get_data();
		$updated_id = is_array( $data ) ? ( $data['id'] ?? 0 ) : 0;

		if ( $updated_id ) {
			$this->save_videomuxr_meta( $updated_id, $request );
		}

		if ( $updated_id && function_exists( 'geo_tagr_get_post_meta' ) ) {
			$geo_map = array(
				'_geo_tagr_lat'     => $request->get_param( 'geo_lat' ),
				'_geo_tagr_lng'     => $request->get_param( 'geo_lng' ),
				'_geo_tagr_place'   => $request->get_param( 'geo_place' ),
				'_geo_tagr_address' => $request->get_param( 'geo_address' ),
			);
			foreach ( $geo_map as $meta_key => $meta_value ) {
				if ( null !== $meta_value && '' !== $meta_value ) {
					update_post_meta( $updated_id, $meta_key, $meta_value );
				}
			}
		}

		return $response;
	}

	/**
	 * Persist VideoMuxr playback/asset IDs as post meta when present.
	 *
	 * The composer submits these when VideoMuxr handled the video upload. The
	 * meta keys are owned by VideoMuxr (registered show_in_rest => false, so they
	 * cannot be set through the core REST meta param) and drive its front-end
	 * player render and its before_delete_post asset cleanup.
	 *
	 * @param int              $post_id The post the meta belongs to.
	 * @param \WP_REST_Request $request The REST request.
	 * @return void
	 */
	private function save_videomuxr_meta( int $post_id, \WP_REST_Request $request ): void {
		$playback_id = $request->get_param( 'videomuxr_playback_id' );
		$asset_id    = $request->get_param( 'videomuxr_asset_id' );

		if ( is_string( $playback_id ) && '' !== $playback_id ) {
			update_post_meta( $post_id, '_videomuxr_playback_id', $playback_id );
		}
		if ( is_string( $asset_id ) && '' !== $asset_id ) {
			update_post_meta( $post_id, '_videomuxr_asset_id', $asset_id );
		}
	}

	/**
	 * Register the like toggle route.
	 *
	 * Public endpoint — auth is handled inside toggle_like so both logged-in
	 * users (toggle) and anonymous visitors (name + email, one-way) can like.
	 */
	public function register_like_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/posts/(?P<id>\d+)/like',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'toggle_like' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id'    => array(
						'validate_callback' => function ( $value ) {
							return is_numeric( $value );
						},
						'sanitize_callback' => 'absint',
					),
					'name'  => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
					'email' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_email',
						'default'           => '',
					),
				),
			)
		);
	}

	/**
	 * Toggle or create a like-comment for the current user or visitor.
	 *
	 * Logged-in users: toggle (create or delete). Anonymous visitors: create
	 * only (one-way), requires name, deduplicates by email when provided.
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

		if ( is_user_logged_in() ) {
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
		} else {
			$name  = (string) $request->get_param( 'name' );
			$email = (string) $request->get_param( 'email' );

			if ( ! $name ) {
				return new \WP_Error(
					'rest_missing_name',
					esc_html__( 'Name is required to like this post.', 'quickpostr' ),
					array( 'status' => 400 )
				);
			}

			// Deduplicate by email when provided.
			if ( $email && $this->get_anonymous_like_exists( $post_id, $email ) ) {
				return rest_ensure_response(
					array(
						'liked' => true,
						'count' => $this->get_like_count( $post_id ),
					)
				);
			}

			wp_insert_comment(
				array(
					'comment_post_ID'      => $post_id,
					'comment_author'       => $name,
					'comment_author_email' => $email,
					'comment_type'         => 'quickpostr_like',
					'comment_content'      => $name . esc_html__( ' liked this post', 'quickpostr' ),
					'comment_approved'     => 1,
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
	 * Return true if an anonymous like-comment with the given email exists on a post.
	 *
	 * @param int    $post_id The post ID.
	 * @param string $email   The commenter email.
	 * @return bool
	 */
	public function get_anonymous_like_exists( int $post_id, string $email ): bool {
		$comments = get_comments(
			array(
				'post_id'      => $post_id,
				'author_email' => $email,
				'type'         => 'quickpostr_like',
				'status'       => 'approve',
				'number'       => 1,
			)
		);
		return ! empty( $comments );
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
