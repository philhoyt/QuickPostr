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
	 * Comment meta key holding the salted hash of an anonymous liker's IP.
	 * Used only to deduplicate likes; the raw address is never stored.
	 */
	const LIKE_IP_META = '_quickpostr_like_ip';

	/**
	 * Post meta key caching the approved like count.
	 *
	 * Likes are comments, and counting them per post on every render was an
	 * N+1 against wp_comments. The count is written on every like toggle and on
	 * comment deletion/status change, and backfilled lazily for posts that
	 * predate the key.
	 */
	const LIKE_COUNT_META = '_quickpostr_like_count';

	/**
	 * Per-request cache of the current user's like comment IDs, keyed by post
	 * ID. Primed in bulk from the_posts so a feed of N posts costs one comment
	 * query rather than N. Static so the instance created in render.php shares
	 * it with the one bootstrapped on plugins_loaded.
	 *
	 * @var array<int, array<int, int|false>> user ID => [ post ID => comment ID|false ]
	 */
	private static array $user_like_cache = array();

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this, 'register_post_fields' ) );
		add_filter( 'the_posts', array( $this, 'prime_user_likes' ), 10, 1 );
		add_action( 'deleted_comment', array( $this, 'refresh_like_count_for_comment' ), 10, 2 );
		add_action( 'transition_comment_status', array( $this, 'refresh_like_count_on_status_change' ), 10, 3 );
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
	 * Both fields are write-only on purpose: no get_callback, so QuickPostr adds
	 * no new read surface for protected meta. Note that GeoTagr registers its
	 * own keys with show_in_rest, so _geo_tagr_lat/_lng/_place/_address are
	 * already readable by anyone through the core `meta` object. That is
	 * GeoTagr's decision to revisit; mirroring it here would only widen it.
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
	 * Public endpoint — `permission_callback` is `__return_true` on purpose:
	 * anonymous visitors are allowed to like, so there is no capability to
	 * check. Auth is handled inside toggle_like so both logged-in users (toggle)
	 * and anonymous visitors (name + email, one-way) can like. The anonymous
	 * path is bounded by per-post dedupe (email and IP hash), a per-IP rate
	 * limit, and length caps on the submitted fields.
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
					// A custom sanitize_callback replaces core's schema handling
					// for the arg, so maxLength is only enforced when the schema
					// validator is named explicitly.
					'name'  => array(
						'type'              => 'string',
						'maxLength'         => 100,
						'validate_callback' => 'rest_validate_request_arg',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
					'email' => array(
						'type'              => 'string',
						'maxLength'         => 254,
						'validate_callback' => 'rest_validate_request_arg',
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

		// Judged on public visibility, not post_status alone: a `publish`
		// object of a non-public post type must look exactly like a missing
		// one, otherwise this unauthenticated route enumerates them.
		if ( ! $post || ! is_post_publicly_viewable( $post ) ) {
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

				// comment_author_email is set so core's personal-data exporter
				// and eraser, which select comments by email, reach this row.
				wp_insert_comment(
					array(
						'comment_post_ID'      => $post_id,
						'user_id'              => $user_id,
						'comment_author'       => sanitize_text_field( $quickpostr_user->display_name ? $quickpostr_user->display_name : $quickpostr_user->user_login ),
						'comment_author_email' => $quickpostr_user->user_email,
						'comment_type'         => 'quickpostr_like',
						'comment_content'      => $this->like_comment_content(),
						'comment_approved'     => 1,
					)
				);
				$liked = true;
			}

			self::$user_like_cache[ $user_id ][ $post_id ] = $liked ? $this->get_user_like_comment_id( $post_id, $user_id, true ) : false;
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

			// Without an address there is nothing to dedupe or rate limit on
			// beyond an email the client chooses, so an anonymous like cannot
			// be bounded. Effectively unreachable under a real web server.
			if ( '' === $ip ) {
				return new \WP_Error(
					'rest_like_unavailable',
					esc_html__( 'Likes are unavailable right now.', 'quickpostr' ),
					array( 'status' => 403 )
				);
			}

			if ( $this->like_rate_limit_exceeded( $ip ) ) {
				return new \WP_Error(
					'rest_like_rate_limited',
					esc_html__( 'Too many likes. Please try again in a minute.', 'quickpostr' ),
					array( 'status' => 429 )
				);
			}

			$already_liked = $this->anonymous_like_already_exists( $post_id, $email, $ip );

			if ( $already_liked ) {
				return rest_ensure_response(
					array(
						'liked' => true,
						'count' => $this->get_like_count( $post_id ),
					)
				);
			}

			// The raw IP is deliberately not stored. Dedupe only needs equality,
			// so a salted hash serves the same purpose without retaining an
			// identifier that would otherwise need exporting and erasing. The
			// visitor's name lives only in comment_author, which core's eraser
			// anonymises — it is not repeated in comment_content.
			$comment_id = wp_insert_comment(
				array(
					'comment_post_ID'      => $post_id,
					'comment_author'       => $name,
					'comment_author_email' => $email,
					'comment_type'         => 'quickpostr_like',
					'comment_content'      => $this->like_comment_content(),
					'comment_approved'     => 1,
				)
			);

			if ( $comment_id ) {
				update_comment_meta( (int) $comment_id, self::LIKE_IP_META, $this->hash_ip( $ip ) );
			}

			$liked = true;
		}

		return rest_ensure_response(
			array(
				'liked' => $liked,
				'count' => $this->refresh_like_count( $post_id ),
			)
		);
	}

	/**
	 * The stored body of a like comment.
	 *
	 * Deliberately constant: the liker's name belongs in comment_author only,
	 * where core's privacy tools know to anonymise it.
	 *
	 * @return string
	 */
	private function like_comment_content(): string {
		return __( 'Liked this post.', 'quickpostr' );
	}

	/**
	 * Whether this IP has exhausted the anonymous like allowance.
	 *
	 * Per-post dedupe alone still lets one client insert a row on every
	 * published post as fast as it can send requests. This caps the rate; the
	 * limit is generous enough that a person liking their way down a feed never
	 * meets it.
	 *
	 * @param string $ip Originating IP address.
	 * @return bool True when the window is exhausted.
	 */
	private function like_rate_limit_exceeded( string $ip ): bool {
		/**
		 * Filter how many anonymous likes one IP address may submit per minute.
		 *
		 * @param int $limit Likes per minute. 0 disables the limit.
		 */
		$limit = (int) apply_filters( 'quickpostr_like_rate_limit', 20 );
		if ( $limit <= 0 ) {
			return false;
		}

		$key   = 'quickpostr_like_rate_' . md5( $this->hash_ip( $ip ) );
		$count = (int) get_transient( $key );

		if ( $count >= $limit ) {
			return true;
		}

		set_transient( $key, $count + 1, MINUTE_IN_SECONDS );

		return false;
	}

	/**
	 * Return the number of approved quickpostr_like comments on a post.
	 *
	 * Reads the cached count from post meta, which the Query Loop's meta cache
	 * primes for the whole page in one query. Posts liked before the cache
	 * existed have no key yet and are counted and backfilled on first read.
	 *
	 * @param int $post_id The post ID.
	 * @return int
	 */
	public function get_like_count( int $post_id ): int {
		if ( metadata_exists( 'post', $post_id, self::LIKE_COUNT_META ) ) {
			return (int) get_post_meta( $post_id, self::LIKE_COUNT_META, true );
		}

		return $this->refresh_like_count( $post_id );
	}

	/**
	 * Recount a post's approved likes from wp_comments and store the result.
	 *
	 * @param int $post_id The post ID.
	 * @return int The fresh count.
	 */
	public function refresh_like_count( int $post_id ): int {
		$count = (int) get_comments(
			array(
				'post_id' => $post_id,
				'type'    => 'quickpostr_like',
				'status'  => 'approve',
				'count'   => true,
			)
		);

		update_post_meta( $post_id, self::LIKE_COUNT_META, $count );

		return $count;
	}

	/**
	 * Keep the cached count honest when a like comment is deleted outside the
	 * toggle route (admin comments screen, post deletion cascade, uninstall).
	 *
	 * @param int               $comment_id The deleted comment ID.
	 * @param \WP_Comment|mixed $comment    The comment object, when WordPress supplies it.
	 */
	public function refresh_like_count_for_comment( int $comment_id, $comment = null ): void {
		if ( ! $comment instanceof \WP_Comment ) {
			$comment = get_comment( $comment_id );
		}

		if ( ! $comment instanceof \WP_Comment || 'quickpostr_like' !== $comment->comment_type ) {
			return;
		}

		$post_id = (int) $comment->comment_post_ID;

		// The post itself may be mid-deletion; nothing to cache then.
		if ( ! get_post( $post_id ) ) {
			return;
		}

		$this->refresh_like_count( $post_id );
		self::$user_like_cache = array();
	}

	/**
	 * Keep the cached count honest when a like is approved, unapproved or
	 * trashed from the comments screen.
	 *
	 * @param int|string  $new_status New comment status.
	 * @param int|string  $old_status Old comment status.
	 * @param \WP_Comment $comment    The comment.
	 */
	public function refresh_like_count_on_status_change( $new_status, $old_status, \WP_Comment $comment ): void {
		if ( 'quickpostr_like' !== $comment->comment_type ) {
			return;
		}

		$this->refresh_like_count( (int) $comment->comment_post_ID );
		self::$user_like_cache = array();
	}

	/**
	 * Prime the current user's like lookups for every post in a query.
	 *
	 * Runs on the_posts for the main query and every Query Loop, so the
	 * like-post block's "have I liked this?" check costs one comment query per
	 * page instead of one per post. Only post IDs not already cached are
	 * fetched.
	 *
	 * @param array $posts The query's posts (WP_Post objects or IDs).
	 * @return array Unchanged.
	 */
	public function prime_user_likes( array $posts ): array {
		if ( empty( $posts ) || ! is_user_logged_in() ) {
			return $posts;
		}

		$user_id  = get_current_user_id();
		$post_ids = array();

		foreach ( $posts as $post ) {
			$id = $post instanceof \WP_Post ? (int) $post->ID : (int) $post;
			if ( $id > 0 && ! isset( self::$user_like_cache[ $user_id ][ $id ] ) ) {
				$post_ids[] = $id;
			}
		}

		if ( empty( $post_ids ) ) {
			return $posts;
		}

		foreach ( $post_ids as $id ) {
			self::$user_like_cache[ $user_id ][ $id ] = false;
		}

		$comments = get_comments(
			array(
				'post__in' => $post_ids,
				'user_id'  => $user_id,
				'type'     => 'quickpostr_like',
				'status'   => 'approve',
				'number'   => count( $post_ids ),
			)
		);

		foreach ( $comments as $comment ) {
			self::$user_like_cache[ $user_id ][ (int) $comment->comment_post_ID ] = (int) $comment->comment_ID;
		}

		return $posts;
	}

	/**
	 * Return the comment ID of the user's like-comment on a post, or false.
	 *
	 * Served from the per-request cache when prime_user_likes() has seen the
	 * post; otherwise a single bounded query, whose result is cached too.
	 *
	 * @param int  $post_id The post ID.
	 * @param int  $user_id The user ID.
	 * @param bool $fresh   Bypass the cache (after a write).
	 * @return int|false
	 */
	public function get_user_like_comment_id( int $post_id, int $user_id, bool $fresh = false ): int|false {
		if ( ! $fresh && isset( self::$user_like_cache[ $user_id ][ $post_id ] ) ) {
			return self::$user_like_cache[ $user_id ][ $post_id ];
		}

		$comments = get_comments(
			array(
				'post_id' => $post_id,
				'user_id' => $user_id,
				'type'    => 'quickpostr_like',
				'status'  => 'approve',
				'number'  => 1,
			)
		);

		$comment_id = ! empty( $comments ) ? (int) $comments[0]->comment_ID : false;

		self::$user_like_cache[ $user_id ][ $post_id ] = $comment_id;

		return $comment_id;
	}

	/**
	 * Whether this anonymous visitor has already liked the post.
	 *
	 * Both checks always run. An earlier version consulted the IP *only* when no
	 * email was supplied, which let a client like the same post without limit by
	 * sending a fresh address every time — the email check only ever matches that
	 * same address, so a new one always looked like a first-time like. The route
	 * is unauthenticated, so that was an unbounded insert into wp_comments.
	 *
	 * Kept as its own method so the composition is testable: the previous bug
	 * survived because only the individual helpers had coverage.
	 *
	 * @param int    $post_id The post being liked.
	 * @param string $email   Submitted email address, may be empty.
	 * @param string $ip      Originating IP address, may be empty.
	 * @return bool True when this visitor already has a like on the post.
	 */
	public function anonymous_like_already_exists( int $post_id, string $email, string $ip ): bool {
		if ( '' !== $email && $this->get_anonymous_like_exists( $post_id, $email ) ) {
			return true;
		}

		return $this->anonymous_like_exists_by_ip( $post_id, $ip );
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
				'post_id'    => $post_id,
				'meta_key'   => self::LIKE_IP_META,   // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- indexed meta key, single-row lookup bounded by number => 1.
				'meta_value' => $this->hash_ip( $ip ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- exact match on a hash, not a LIKE.
				'user_id'    => 0,
				'type'       => 'quickpostr_like',
				'status'     => 'approve',
				'number'     => 1,
			)
		);
		return ! empty( $comments );
	}

	/**
	 * Salted, one-way hash of a visitor IP.
	 *
	 * Uses wp_hash(), so the value is bound to the site's salts and is not
	 * portable between installs. An IPv4 space is small enough to brute-force
	 * given the salt, so this is data minimisation rather than a guarantee — the
	 * point is that the plugin no longer retains an address it would otherwise
	 * have to export and erase on request.
	 *
	 * @param string $ip Raw IP address.
	 * @return string
	 */
	private function hash_ip( string $ip ): string {
		return wp_hash( 'quickpostr_like_ip|' . $ip );
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
				'post_type'              => 'post',
				'post_status'            => 'draft',
				'author'                 => get_current_user_id(),
				'posts_per_page'         => 1,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				// Single-row lookup: no pagination total, no cache priming — the
				// post is re-fetched through the core controller below anyway.
				'no_found_rows'          => true,
				'fields'                 => 'ids',
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- _quickpostr_post is an indexed flag on QuickPostr posts only.
				'meta_query'             => array(
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

		$post_id       = (int) $query->posts[0];
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
