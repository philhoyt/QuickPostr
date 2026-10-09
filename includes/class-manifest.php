<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- short name intentional; class is QuickPostr_Manifest.
/**
 * PWA manifest, share-target handler, and service worker for QuickPostr.
 *
 * Registers QuickPostr as a Progressive Web App share target so a user can
 * share a photo from their device's share sheet straight into the composer.
 *
 * Three root-scoped routes are served through WordPress rewrite rules:
 *   GET  /quickpostr-manifest.json  — the web app manifest (public)
 *   GET  /quickpostr-sw.js          — the service worker (root scope)
 *   POST /quickpostr-share/         — the share-target receiver (auth required)
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr_Manifest
 *
 * Owns the PWA surface: manifest JSON, the share-target endpoint, and the
 * service worker served from the site root so its scope covers the whole site.
 */
class QuickPostr_Manifest {

	/**
	 * Attachment meta key flagging a shared upload that has not yet been used
	 * in a published post. The value is the upload timestamp.
	 */
	const PENDING_META = '_quickpostr_pending_share';

	/**
	 * Cron hook that sweeps abandoned shared uploads.
	 */
	const CLEANUP_HOOK = 'quickpostr_cleanup_pending_shares';

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_rewrite_rules' ) );
		add_filter( 'query_vars', array( $this, 'register_query_vars' ) );
		add_filter( 'redirect_canonical', array( $this, 'skip_canonical_redirect' ) );
		add_action( 'template_redirect', array( $this, 'maybe_serve_route' ) );
		add_action( 'wp_head', array( $this, 'print_manifest_link' ) );
		add_action( 'wp_after_insert_post', array( $this, 'claim_shared_uploads' ), 10, 2 );
		add_action( self::CLEANUP_HOOK, array( $this, 'cleanup_pending_shares' ) );
	}

	/**
	 * How long (in seconds) an unused shared upload survives before the cleanup
	 * cron deletes it. Filterable via `quickpostr_pending_share_ttl`.
	 *
	 * @return int
	 */
	private function pending_ttl(): int {
		/**
		 * Filter the time-to-live for an unclaimed PWA-shared upload.
		 *
		 * @param int $ttl Seconds before an abandoned shared upload is deleted.
		 */
		return (int) apply_filters( 'quickpostr_pending_share_ttl', DAY_IN_SECONDS );
	}

	/**
	 * Register the rewrite rules for the manifest, service worker, and share
	 * endpoint. Public so the activation hook can register them before flushing.
	 */
	public function register_rewrite_rules(): void {
		add_rewrite_rule( '^quickpostr-manifest\.json$', 'index.php?quickpostr_manifest=1', 'top' );
		add_rewrite_rule( '^quickpostr-sw\.js$', 'index.php?quickpostr_sw=1', 'top' );
		add_rewrite_rule( '^quickpostr-share/?$', 'index.php?quickpostr_share=1', 'top' );
	}

	/**
	 * Schedule the daily sweep of abandoned shared uploads. Called on activation.
	 */
	public function schedule_cleanup(): void {
		if ( ! wp_next_scheduled( self::CLEANUP_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CLEANUP_HOOK );
		}
	}

	/**
	 * Clear the cleanup cron. Called on deactivation.
	 */
	public function clear_cleanup(): void {
		wp_clear_scheduled_hook( self::CLEANUP_HOOK );
	}

	/**
	 * Whitelist the custom query vars so get_query_var() can read them.
	 *
	 * @param array $vars Existing public query vars.
	 * @return array
	 */
	public function register_query_vars( array $vars ): array {
		$vars[] = 'quickpostr_manifest';
		$vars[] = 'quickpostr_sw';
		$vars[] = 'quickpostr_share';
		return $vars;
	}

	/**
	 * Keep WordPress from redirecting the PWA routes to trailing-slash URLs.
	 *
	 * With a permalink structure that ends in a slash (the default),
	 * redirect_canonical() sends /quickpostr-sw.js to /quickpostr-sw.js/ before
	 * template_redirect ever runs. Browsers refuse to register a service worker
	 * whose script is behind a redirect, so the share target silently never
	 * installed on such sites; the manifest fetch was redirected the same way.
	 *
	 * @param string|false $redirect_url URL WordPress wants to redirect to.
	 * @return string|false False for the plugin's routes, the URL otherwise.
	 */
	public function skip_canonical_redirect( $redirect_url ) {
		foreach ( array( 'quickpostr_manifest', 'quickpostr_sw', 'quickpostr_share' ) as $var ) {
			if ( get_query_var( $var ) ) {
				return false;
			}
		}

		return $redirect_url;
	}

	/**
	 * Dispatch the matched PWA route, if any. Each handler sends its own
	 * response and exits, so nothing falls through to template loading.
	 */
	public function maybe_serve_route(): void {
		if ( get_query_var( 'quickpostr_manifest' ) ) {
			$this->serve_manifest();
		}
		if ( get_query_var( 'quickpostr_sw' ) ) {
			$this->serve_service_worker();
		}
		if ( get_query_var( 'quickpostr_share' ) ) {
			$this->handle_share();
		}
	}

	/**
	 * Output the web app manifest as JSON.
	 *
	 * The manifest is public (no auth) so the browser can read it for
	 * installability. The share_target action always points at the dedicated
	 * /quickpostr-share/ receiver; start_url reflects the configured composer
	 * page so launching the installed app opens the composer.
	 */
	private function serve_manifest(): void {
		$name      = get_bloginfo( 'name' );
		$short     = mb_substr( $name, 0, 12 );
		$start_url = $this->get_composer_page_url();

		$icons = array();
		foreach ( array( 192, 512 ) as $size ) {
			$icon_url = get_site_icon_url( $size );
			if ( $icon_url ) {
				$icons[] = array(
					'src'     => $icon_url,
					'sizes'   => $size . 'x' . $size,
					'type'    => 'image/png',
					'purpose' => 'any',
				);
			}
		}

		$manifest = array(
			'name'         => $name,
			'short_name'   => $short ? $short : $name,
			'start_url'    => $start_url,
			// Root scope so the share_target action (/quickpostr-share/) is in
			// scope regardless of which page holds the composer, matching the
			// root-scoped service worker.
			'scope'        => home_url( '/' ),
			'display'      => 'standalone',
			'icons'        => $icons,
			'share_target' => array(
				'action'  => home_url( '/quickpostr-share/' ),
				'method'  => 'POST',
				'enctype' => 'multipart/form-data',
				'params'  => array(
					'files' => array(
						array(
							'name'   => 'media',
							'accept' => array( 'image/*' ),
						),
					),
				),
			),
		);

		/**
		 * Filter the QuickPostr web app manifest before it is output.
		 *
		 * Allows themes and companion plugins to merge their own manifest
		 * fields (additional icons, theme_color, categories, etc.).
		 *
		 * @param array $manifest The manifest array.
		 */
		$manifest = apply_filters( 'quickpostr_manifest', $manifest );

		status_header( 200 );
		header( 'Content-Type: application/manifest+json; charset=utf-8' );
		// The manifest only changes with settings, site name or icon; a day of
		// browser/proxy caching spares a full WordPress bootstrap per page view.
		header( 'Cache-Control: public, max-age=' . DAY_IN_SECONDS );
		echo wp_json_encode( $manifest );
		exit;
	}

	/**
	 * Serve the service worker from the site root.
	 *
	 * Serving from / gives the worker root scope natively, which the Web Share
	 * Target spec requires (the worker must control the start_url). The built
	 * asset lives under build/pwa/ and is read straight off disk.
	 */
	private function serve_service_worker(): void {
		$file = QUICKPOSTR_PATH . 'build/pwa/quickpostr-sw.js';

		if ( ! file_exists( $file ) ) {
			status_header( 404 );
			exit;
		}

		status_header( 200 );
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Service-Worker-Allowed: /' );
		// Explicit so intermediaries do not cache a stale worker; the browser
		// byte-compares on each navigation and picks up plugin updates promptly.
		header( 'Cache-Control: no-cache' );
		// The file is a plugin-bundled static JS asset, not user input, and is
		// served with a JavaScript content type — HTML escaping does not apply.
		echo file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/**
	 * Handle a Web Share Target POST.
	 *
	 * The share sheet POSTs a multipart/form-data request from another app, so
	 * it cannot carry a WordPress nonce — authentication is the session cookie
	 * plus the upload_files capability. A logged-out user is sent to the login
	 * screen; on success the uploaded attachment ID is handed to the composer
	 * via ?qp_share so the user can review and post.
	 *
	 * Three guards stand in for the missing nonce: the request is refused when
	 * the browser reports a cross-site initiator (Fetch Metadata), refused when
	 * an Origin or Referer header names another host, and each user is rate
	 * limited. See is_cross_site_request() for why these checks are safe here.
	 */
	private function handle_share(): void {
		$share_url = home_url( '/quickpostr-share/' );

		if ( ! is_user_logged_in() ) {
			wp_safe_redirect( wp_login_url( $share_url ) );
			exit;
		}

		$composer_url = $this->get_composer_page_url();

		if ( ! current_user_can( 'upload_files' ) ) {
			wp_safe_redirect( $composer_url );
			exit;
		}

		if ( $this->is_cross_site_request() ) {
			wp_safe_redirect( $composer_url );
			exit;
		}

		if ( $this->share_rate_limit_exceeded( get_current_user_id() ) ) {
			wp_safe_redirect( $composer_url );
			exit;
		}

		// No nonce is possible on a cross-app share POST; auth is the session
		// cookie plus the upload_files capability checked above.
		if ( empty( $_FILES['media'] ) || ! is_array( $_FILES['media'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			wp_safe_redirect( $composer_url );
			exit;
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$attachment_id = media_handle_upload( 'media', 0 );

		if ( is_wp_error( $attachment_id ) ) {
			wp_safe_redirect( $composer_url );
			exit;
		}

		// The manifest advertises image/* but that is a hint to the share
		// sheet, not a constraint the browser enforces. Anything else the site
		// would accept as an upload is refused here and removed again.
		if ( ! wp_attachment_is_image( $attachment_id ) ) {
			wp_delete_attachment( $attachment_id, true );
			wp_safe_redirect( $composer_url );
			exit;
		}

		// Flag the upload as pending so it is swept later if the user never
		// publishes a post that uses it. claim_shared_uploads() clears the flag
		// once the image is referenced by a saved post.
		update_post_meta( $attachment_id, self::PENDING_META, time() );

		wp_safe_redirect( add_query_arg( 'qp_share', $attachment_id, $composer_url ) );
		exit;
	}

	/**
	 * Whether the browser reported an explicitly cross-site initiator.
	 *
	 * Stands in for the nonce this endpoint cannot have. A Web Share Target
	 * launch has no document initiator, so per the Fetch Metadata spec the
	 * browser sends `Sec-Fetch-Site: none` — the same value as a bookmark or a
	 * typed URL. A form on someone else's site posting here sends `cross-site`.
	 *
	 * Only `none` and `same-origin` are accepted when the header is present:
	 * `cross-site` is another site's form, and `same-site` is a sibling
	 * subdomain, which has no business posting here either. A missing header
	 * (older browsers, proxies that strip it) falls through to the second
	 * check, so this cannot break a real share.
	 *
	 * The second check reads Origin, else Referer, which browsers have sent
	 * for far longer than Fetch Metadata: when one is present its host must be
	 * this site's. A share-sheet launch carries neither or a same-origin one.
	 *
	 * @return bool
	 */
	private function is_cross_site_request(): bool {
		if ( ! empty( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ) {
			$site = sanitize_text_field( wp_unslash( $_SERVER['HTTP_SEC_FETCH_SITE'] ) );

			if ( ! in_array( $site, array( 'none', 'same-origin' ), true ) ) {
				return true;
			}
		}

		$source = '';
		if ( ! empty( $_SERVER['HTTP_ORIGIN'] ) ) {
			$source = sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) );
		} elseif ( ! empty( $_SERVER['HTTP_REFERER'] ) ) {
			$source = sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) );
		}

		// Browsers send the literal string "null" for opaque origins.
		if ( '' === $source || 'null' === $source ) {
			return false;
		}

		$source_host = wp_parse_url( $source, PHP_URL_HOST );
		$home_host   = wp_parse_url( home_url(), PHP_URL_HOST );

		if ( ! is_string( $source_host ) || ! is_string( $home_host ) ) {
			return false;
		}

		return strtolower( $source_host ) !== strtolower( $home_host );
	}

	/**
	 * Throttle share uploads per user.
	 *
	 * The endpoint writes a file to the media library on every call, so without
	 * a ceiling a single session could be driven to fill the uploads directory.
	 * Sharing is a deliberate, one-at-a-time gesture, so the limit is generous
	 * enough never to be met by hand. The read-then-write is not atomic without
	 * a persistent object cache, so a burst of truly simultaneous requests can
	 * overshoot by a few; the ceiling is a brake, not a hard quota.
	 *
	 * @param int $user_id The sharing user.
	 * @return bool True when the user has exhausted the window.
	 */
	private function share_rate_limit_exceeded( int $user_id ): bool {
		/**
		 * Filter how many PWA shares a user may make per hour.
		 *
		 * @param int $limit Maximum shares per hour.
		 */
		$limit = (int) apply_filters( 'quickpostr_share_rate_limit', 30 );
		if ( $limit <= 0 ) {
			return false;
		}

		$key   = 'quickpostr_share_rate_' . $user_id;
		$count = (int) get_transient( $key );

		if ( $count >= $limit ) {
			return true;
		}

		set_transient( $key, $count + 1, HOUR_IN_SECONDS );

		return false;
	}

	/**
	 * Claim shared uploads referenced by a saved post.
	 *
	 * When a post is saved, any pending shared attachments embedded in its
	 * content are "claimed": the pending flag is cleared so the cleanup cron
	 * leaves them alone, and they are attached to the post. Fires for every
	 * post save (REST, editor, or direct insert) but only does work when a
	 * pending shared image is actually referenced.
	 *
	 * @param int      $post_id The saved post ID.
	 * @param \WP_Post $post    The saved post object.
	 */
	public function claim_shared_uploads( int $post_id, \WP_Post $post ): void {
		if ( 'attachment' === $post->post_type || empty( $post->post_content ) ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( ! preg_match_all( '/wp-image-(\d+)/', $post->post_content, $matches ) ) {
			return;
		}

		foreach ( array_unique( array_map( 'absint', $matches[1] ) ) as $attachment_id ) {
			if ( ! $attachment_id || ! get_post_meta( $attachment_id, self::PENDING_META, true ) ) {
				continue;
			}

			// The content is user-controlled, so an ID in it is only a claim.
			// Only the user who shared the upload may claim it for their post.
			if ( (int) get_post_field( 'post_author', $attachment_id ) !== (int) $post->post_author ) {
				continue;
			}

			delete_post_meta( $attachment_id, self::PENDING_META );
			if ( (int) wp_get_post_parent_id( $attachment_id ) === 0 ) {
				wp_update_post(
					array(
						'ID'          => $attachment_id,
						'post_parent' => $post_id,
					)
				);
			}
		}
	}

	/**
	 * Delete shared uploads that were never used in a post.
	 *
	 * Runs on the daily cron hook. Any attachment still flagged pending past the
	 * TTL was shared into the composer but never published, so it is removed.
	 * Works in batches of 50 until none are left or a time budget is spent, so
	 * a backlog cannot outgrow the sweep (the rate limit alone allows far more
	 * than 50 shares a day) while a single run stays bounded.
	 *
	 * @param int $ttl Optional. Seconds an unclaimed upload may live. Defaults
	 *                 to the filtered TTL; uninstall passes 0 to sweep all.
	 */
	public function cleanup_pending_shares( int $ttl = -1 ): void {
		$cutoff   = time() - ( $ttl >= 0 ? $ttl : $this->pending_ttl() );
		$deadline = microtime( true ) + 20;
		$batch    = 50;

		do {
			$attachments = get_posts(
				array(
					'post_type'      => 'attachment',
					'post_status'    => 'inherit',
					'posts_per_page' => $batch,
					'fields'         => 'ids',
					'no_found_rows'  => true,
					// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- bounded sweep on the indexed pending-share key, runs once daily on cron.
					'meta_query'     => array(
						array(
							'key'     => self::PENDING_META,
							'value'   => $cutoff,
							'compare' => '<=',
							'type'    => 'NUMERIC',
						),
					),
				)
			);

			$found = count( $attachments );

			foreach ( $attachments as $attachment_id ) {
				wp_delete_attachment( $attachment_id, true );
			}
		} while ( $found === $batch && microtime( true ) < $deadline );
	}

	/**
	 * Print the manifest link tag in the document head on the front end.
	 *
	 * Only for users who can post: the PWA exists to share into the composer,
	 * and the service worker is only ever registered from the composer, which
	 * renders for edit_posts users. Printing it for every visitor made every
	 * anonymous page view trigger a manifest fetch and a WordPress bootstrap.
	 */
	public function print_manifest_link(): void {
		if ( is_admin() || ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		printf(
			'<link rel="manifest" href="%s">' . "\n",
			esc_url( home_url( '/quickpostr-manifest.json' ) )
		);
	}

	/**
	 * Resolve the composer page URL from settings, falling back to the home URL.
	 *
	 * @return string
	 */
	private function get_composer_page_url(): string {
		$settings = QuickPostr_Settings::get();
		$page_id  = isset( $settings['composer_page_id'] ) ? (int) $settings['composer_page_id'] : 0;

		if ( $page_id > 0 ) {
			$permalink = get_permalink( $page_id );
			if ( $permalink ) {
				return $permalink;
			}
		}

		return home_url( '/' );
	}
}
