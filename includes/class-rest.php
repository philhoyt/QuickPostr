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
		add_action( 'rest_api_init', array( $this, 'register_post_fields' ) );
	}

	/**
	 * Register QuickPostr's writable fields on the core post resource.
	 *
	 * The geo and Mux values live in protected (underscore-prefixed) post meta
	 * whose owning plugins register them with show_in_rest => false, so they
	 * cannot be set through the core REST `meta` param. Registering our own
	 * namespaced fields lets the composer post straight to /wp/v2/posts and get
	 * the meta written as a side effect — no proxy endpoint, and every core post
	 * field (including `date`) keeps working for free.
	 *
	 * Both fields are write-only on purpose: no get_callback, so no protected
	 * meta becomes newly readable. Exposing _geo_tagr_lat/_lng/_address on post
	 * responses would leak exact coordinates for every post to anyone who can
	 * read it.
	 *
	 * @return void
	 */
	public function register_post_fields(): void {
		register_rest_field(
			'post',
			'quickpostr_geo',
			array(
				'get_callback'    => null,
				'update_callback' => array( $this, 'update_geo_field' ),
				'schema'          => array(
					'description' => __( 'Location metadata written to GeoTagr post meta. Write-only.', 'quickpostr' ),
					'type'        => 'object',
					'context'     => array(),
					'properties'  => array(
						'lat'     => array( 'type' => 'number' ),
						'lng'     => array( 'type' => 'number' ),
						'place'   => array( 'type' => 'string' ),
						'address' => array( 'type' => 'string' ),
					),
				),
			)
		);

		register_rest_field(
			'post',
			'quickpostr_video',
			array(
				'get_callback'    => null,
				'update_callback' => array( $this, 'update_video_field' ),
				'schema'          => array(
					'description' => __( 'VideoMuxr playback and asset IDs. Write-only.', 'quickpostr' ),
					'type'        => 'object',
					'context'     => array(),
					'properties'  => array(
						'playback_id' => array( 'type' => 'string' ),
						'asset_id'    => array( 'type' => 'string' ),
					),
				),
			)
		);
	}

	/**
	 * Write GeoTagr location meta from the quickpostr_geo field.
	 *
	 * Best-effort by design: this runs after wp_insert_post() has already
	 * committed the post, so returning a WP_Error would fail the response and
	 * leave the caller with a phantom post. It mirrors the previous proxy
	 * behaviour, which wrote meta after a successful insert and ignored
	 * failures.
	 *
	 * update_additional_fields_for_object() hands the value over raw — core does
	 * not sanitize nested schema properties — so each value is sanitized here.
	 *
	 * @param mixed    $value The submitted field value.
	 * @param \WP_Post $post  The post being created or updated.
	 * @return void
	 */
	public function update_geo_field( mixed $value, \WP_Post $post ): void {
		if ( ! is_array( $value ) || ! function_exists( 'geo_tagr_get_post_meta' ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return;
		}

		$geo_map = array(
			'_geo_tagr_lat'     => isset( $value['lat'] ) ? (float) $value['lat'] : null,
			'_geo_tagr_lng'     => isset( $value['lng'] ) ? (float) $value['lng'] : null,
			'_geo_tagr_place'   => isset( $value['place'] ) ? sanitize_text_field( $value['place'] ) : null,
			'_geo_tagr_address' => isset( $value['address'] ) ? sanitize_text_field( $value['address'] ) : null,
		);

		foreach ( $geo_map as $meta_key => $meta_value ) {
			if ( null !== $meta_value && '' !== $meta_value ) {
				update_post_meta( $post->ID, $meta_key, $meta_value );
			}
		}
	}

	/**
	 * Write VideoMuxr playback/asset IDs from the quickpostr_video field.
	 *
	 * The meta keys are owned by VideoMuxr and drive its front-end player render
	 * and its before_delete_post asset cleanup. Guarded on VideoMuxr being
	 * present so the keys cannot be attached to arbitrary posts on sites that do
	 * not run it. Best-effort for the same reason as update_geo_field().
	 *
	 * @param mixed    $value The submitted field value.
	 * @param \WP_Post $post  The post being created or updated.
	 * @return void
	 */
	public function update_video_field( mixed $value, \WP_Post $post ): void {
		if ( ! is_array( $value ) || ! function_exists( 'videomuxr_is_configured' ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return;
		}

		$video_map = array(
			'_videomuxr_playback_id' => isset( $value['playback_id'] ) ? sanitize_text_field( $value['playback_id'] ) : null,
			'_videomuxr_asset_id'    => isset( $value['asset_id'] ) ? sanitize_text_field( $value['asset_id'] ) : null,
		);

		foreach ( $video_map as $meta_key => $meta_value ) {
			if ( null !== $meta_value && '' !== $meta_value ) {
				update_post_meta( $post->ID, $meta_key, $meta_value );
			}
		}
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

		// No 'default' on any core field: WP_REST_Request::get_parameter_order()
		// ends with 'defaults', so a declared default makes get_param() return a
		// value the client never sent. Forwarding that to core turns a partial
		// update into a destructive one -- a PUT carrying only { content } would
		// wipe the post's tags and categories and force it to publish.
		$geo_args = array(
			'title'                 => array(
				'type' => 'string',
			),
			'content'               => array(
				'type' => 'string',
			),
			'status'                => array(
				'type' => 'string',
				'enum' => array( 'publish', 'draft', 'pending', 'private' ),
			),
			'format'                => array(
				'type' => 'string',
			),
			'tags'                  => array(
				'type'  => 'array',
				'items' => array( 'type' => 'integer' ),
			),
			'categories'            => array(
				'type'  => 'array',
				'items' => array( 'type' => 'integer' ),
			),
			'meta'                  => array(
				'type' => 'object',
			),
			'featured_media'        => array(
				'type' => 'integer',
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
	 * Translate this route's legacy flat params into QuickPostr's post fields.
	 *
	 * Callers of the deprecated proxy send geo_lat/geo_lng/geo_place/geo_address
	 * and videomuxr_playback_id/videomuxr_asset_id as flat body params. Core's
	 * /wp/v2/posts knows nothing about those names, so they are folded into the
	 * quickpostr_geo and quickpostr_video fields registered by
	 * register_post_fields(), which write the same meta the proxy used to write
	 * inline. Keys with no data are omitted entirely.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return array Zero, one or two namespaced field values.
	 */
	private function map_legacy_params( \WP_REST_Request $request ): array {
		$mapped = array();

		$geo = array(
			'lat'     => $request->get_param( 'geo_lat' ),
			'lng'     => $request->get_param( 'geo_lng' ),
			'place'   => $request->get_param( 'geo_place' ),
			'address' => $request->get_param( 'geo_address' ),
		);
		$geo = array_filter(
			$geo,
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);
		if ( $geo ) {
			$mapped['quickpostr_geo'] = $geo;
		}

		$video = array(
			'playback_id' => $request->get_param( 'videomuxr_playback_id' ),
			'asset_id'    => $request->get_param( 'videomuxr_asset_id' ),
		);
		$video = array_filter(
			$video,
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);
		if ( $video ) {
			$mapped['quickpostr_video'] = $video;
		}

		return $mapped;
	}

	/**
	 * Forward a proxied request to a core posts endpoint.
	 *
	 * Copies the whole JSON body across rather than a whitelist, so no core post
	 * field can be silently dropped, then overlays the mapped legacy params.
	 * Core handles all validation, capability checks and hooks.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @param string           $method  HTTP method for the inner request.
	 * @param string           $route   Core route to dispatch to.
	 * @return \WP_REST_Response Core converts its own errors into a response.
	 */
	private function forward_to_core( \WP_REST_Request $request, string $method, string $route ): \WP_REST_Response {
		$inner  = new \WP_REST_Request( $method, $route );
		$params = array_merge(
			(array) $request->get_json_params(),
			$this->map_legacy_params( $request )
		);

		unset( $params['id'], $params['geo_lat'], $params['geo_lng'], $params['geo_place'], $params['geo_address'] );
		unset( $params['videomuxr_playback_id'], $params['videomuxr_asset_id'] );

		foreach ( $params as $key => $value ) {
			$inner->set_param( $key, $value );
		}

		return rest_do_request( $inner );
	}

	/**
	 * Create a post via the core WP REST endpoint.
	 *
	 * @deprecated 0.17.0 Post to /wp/v2/posts with the quickpostr_geo and
	 *                    quickpostr_video fields instead. Kept so existing
	 *                    callers keep working; removal planned for 1.0.0.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_post_with_geo( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		return $this->forward_to_core( $request, 'POST', '/wp/v2/posts' );
	}

	/**
	 * Update an existing post via the core WP REST endpoint.
	 *
	 * @deprecated 0.17.0 Send to /wp/v2/posts/{id} with the quickpostr_geo and
	 *                    quickpostr_video fields instead. Kept so existing
	 *                    callers keep working; removal planned for 1.0.0.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_post_with_geo( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$post_id = (int) $request->get_param( 'id' );

		return $this->forward_to_core( $request, 'PUT', "/wp/v2/posts/$post_id" );
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
	 * only (one-way), requires name, deduplicates by email when provided and by
	 * originating IP otherwise.
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
			$ip    = $this->get_request_ip();

			if ( ! $name ) {
				return new \WP_Error(
					'rest_missing_name',
					esc_html__( 'Name is required to like this post.', 'quickpostr' ),
					array( 'status' => 400 )
				);
			}

			// Deduplicate anonymous likes: by email when provided, otherwise by
			// originating IP. Without this an unauthenticated client could inflate
			// the count indefinitely by re-posting name-only likes.
			$already_liked = ( $email && $this->get_anonymous_like_exists( $post_id, $email ) )
				|| ( ! $email && $this->anonymous_like_exists_by_ip( $post_id, $ip ) );

			if ( $already_liked ) {
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
					'comment_author_IP'    => $ip,
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
	 * Return true if an anonymous like-comment from the given IP exists on a post.
	 *
	 * Used to throttle name-only anonymous likes (no email to dedupe on) so the
	 * like count cannot be inflated by repeated unauthenticated requests.
	 *
	 * @param int    $post_id The post ID.
	 * @param string $ip      The commenter IP address.
	 * @return bool
	 */
	public function anonymous_like_exists_by_ip( int $post_id, string $ip ): bool {
		if ( '' === $ip ) {
			return false;
		}
		$comments = get_comments(
			array(
				'post_id'   => $post_id,
				'author_ip' => $ip,
				'user_id'   => 0,
				'type'      => 'quickpostr_like',
				'status'    => 'approve',
				'number'    => 1,
			)
		);
		return ! empty( $comments );
	}

	/**
	 * Return the sanitized originating IP for the current request.
	 *
	 * Reads REMOTE_ADDR only — forwarded headers are not trusted because they
	 * are client-spoofable, which would defeat the dedupe.
	 *
	 * @return string The IP address, or an empty string when unavailable.
	 */
	private function get_request_ip(): string {
		if ( empty( $_SERVER['REMOTE_ADDR'] ) ) {
			return '';
		}
		return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
	}

	/**
	 * Verify the request comes from a logged-in user.
	 *
	 * Deliberately only an authentication check. Routes that create or modify
	 * posts forward to core, which runs the real per-object capability checks;
	 * the read-only routes here expose nothing role-sensitive.
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
