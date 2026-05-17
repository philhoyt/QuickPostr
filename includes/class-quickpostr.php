<?php
/**
 * Core plugin class.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr
 *
 * Bootstraps all plugin subsystems.
 */
class QuickPostr {

	/**
	 * Initialise all subsystems.
	 */
	public function init(): void {
		( new QuickPostr_Settings() )->init();
		( new QuickPostr_Rest() )->init();

		add_action( 'init', array( $this, 'register_taxonomy' ) );
		add_action( 'init', array( $this, 'register_post_meta' ) );
		add_action( 'init', array( $this, 'seed_terms' ) );
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'init', array( $this, 'register_block_patterns' ) );
		add_filter( 'block_categories_all', array( $this, 'register_block_category' ), 10, 1 );
		add_action( 'rest_after_insert_post', array( $this, 'assign_source_terms' ), 10, 2 );
		add_filter( 'the_title', array( $this, 'suppress_title' ), 10, 2 );
		add_filter( 'show_admin_bar', array( $this, 'maybe_suppress_admin_bar' ), 10, 1 );
		add_filter( 'wp_handle_upload', array( $this, 'maybe_strip_exif' ), 10, 1 );
	}

	/**
	 * Register all plugin blocks and their view scripts.
	 *
	 * View scripts are referenced by handle (not file:) in block.json so they
	 * must be registered here before register_block_type processes the metadata.
	 * All view scripts read their asset manifest for dependencies (including wp-i18n).
	 */
	public function register_block(): void {
		$composer_asset_file = QUICKPOSTR_PATH . 'build/blocks/composer/view.asset.php';
		$composer_asset      = file_exists( $composer_asset_file )
			? require $composer_asset_file
			: array(
				'dependencies' => array(),
				'version'      => QUICKPOSTR_VERSION,
			);

		$delete_asset_file = QUICKPOSTR_PATH . 'build/blocks/delete-post/view.asset.php';
		$delete_asset      = file_exists( $delete_asset_file )
			? require $delete_asset_file
			: array(
				'dependencies' => array(),
				'version'      => QUICKPOSTR_VERSION,
			);

		$edit_asset_file = QUICKPOSTR_PATH . 'build/blocks/edit-post/view.asset.php';
		$edit_asset      = file_exists( $edit_asset_file )
			? require $edit_asset_file
			: array(
				'dependencies' => array(),
				'version'      => QUICKPOSTR_VERSION,
			);

		$share_asset_file = QUICKPOSTR_PATH . 'build/blocks/share-post/view.asset.php';
		$share_asset      = file_exists( $share_asset_file )
			? require $share_asset_file
			: array(
				'dependencies' => array(),
				'version'      => QUICKPOSTR_VERSION,
			);

		wp_register_script(
			'quickpostr-composer-view',
			QUICKPOSTR_URL . 'build/blocks/composer/view.js',
			$composer_asset['dependencies'],
			$composer_asset['version'],
			array( 'in_footer' => true )
		);
		wp_set_script_translations( 'quickpostr-composer-view', 'quickpostr' );

		wp_register_script(
			'quickpostr-delete-post-view',
			QUICKPOSTR_URL . 'build/blocks/delete-post/view.js',
			$delete_asset['dependencies'],
			$delete_asset['version'],
			array( 'in_footer' => true )
		);
		wp_set_script_translations( 'quickpostr-delete-post-view', 'quickpostr' );

		wp_register_script(
			'quickpostr-edit-post-view',
			QUICKPOSTR_URL . 'build/blocks/edit-post/view.js',
			$edit_asset['dependencies'],
			$edit_asset['version'],
			array( 'in_footer' => true )
		);
		wp_set_script_translations( 'quickpostr-edit-post-view', 'quickpostr' );

		wp_register_script(
			'quickpostr-share-post-view',
			QUICKPOSTR_URL . 'build/blocks/share-post/view.js',
			$share_asset['dependencies'],
			$share_asset['version'],
			array( 'in_footer' => true )
		);
		wp_set_script_translations( 'quickpostr-share-post-view', 'quickpostr' );

		register_block_type( QUICKPOSTR_PATH . 'build/blocks/composer/' );
		register_block_type( QUICKPOSTR_PATH . 'build/blocks/delete-post/' );
		register_block_type( QUICKPOSTR_PATH . 'build/blocks/edit-post/' );
		register_block_type( QUICKPOSTR_PATH . 'build/blocks/share-post/' );
		register_block_type( QUICKPOSTR_PATH . 'build/blocks/media-gallery/' );
	}

	/**
	 * Register the QuickPostr block inserter category.
	 *
	 * @param array $categories Existing block categories.
	 * @return array
	 */
	public function register_block_category( array $categories ): array {
		return array_merge(
			array(
				array(
					'slug'  => 'quickpostr',
					'title' => __( 'QuickPostr', 'quickpostr' ),
					'icon'  => null,
				),
			),
			$categories
		);
	}

	/**
	 * Register block patterns and the QuickPostr pattern category.
	 */
	public function register_block_patterns(): void {
		register_block_pattern_category(
			'quickpostr',
			array( 'label' => __( 'QuickPostr', 'quickpostr' ) )
		);
	}

	/**
	 * Register the _quickpostr_post meta key so the REST API can write it.
	 * The value is the signal that triggers taxonomy term assignment in
	 * assign_source_terms() — without this, WP silently drops the meta
	 * from the REST payload and no terms are ever assigned.
	 */
	public function register_post_meta(): void {
		register_post_meta(
			'post',
			'_quickpostr_post',
			array(
				'type'          => 'string',
				'single'        => true,
				'default'       => '',
				'show_in_rest'  => true,
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Register the private quickpostr_source taxonomy.
	 */
	public function register_taxonomy(): void {
		register_taxonomy(
			'quickpostr_source',
			'post',
			array(
				'label'              => __( 'QuickPostr Source', 'quickpostr' ),
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => false,
				'show_in_menu'       => false,
				'show_in_nav_menus'  => false,
				'show_in_rest'       => false,
				'show_tagcloud'      => false,
				'show_admin_column'  => false,
				'hierarchical'       => false,
				'rewrite'            => false,
			)
		);
	}

	/**
	 * Ensure the required taxonomy terms exist.
	 * Uses wp_insert_term which is a no-op if the term already exists.
	 */
	public function seed_terms(): void {
		$terms = array( 'app', 'status', 'photo', 'link', 'video', 'gallery' );
		foreach ( $terms as $slug ) {
			if ( ! term_exists( $slug, 'quickpostr_source' ) ) {
				wp_insert_term( $slug, 'quickpostr_source', array( 'slug' => $slug ) );
			}
		}
	}

	/**
	 * Assign quickpostr_source terms after a post is created via the REST API.
	 * Also generates and sets the authoritative post title server-side.
	 * Triggered only when the _quickpostr_post meta flag is present.
	 *
	 * @param \WP_Post         $post    The inserted post.
	 * @param \WP_REST_Request $request The REST request.
	 */
	public function assign_source_terms( \WP_Post $post, \WP_REST_Request $request ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( ! get_post_meta( $post->ID, '_quickpostr_post', true ) ) {
			return;
		}

		$raw_format = get_post_format( $post->ID );
		$format     = $raw_format ? $raw_format : 'status';

		if ( 'image' === $format ) {
			$format_term = 'photo';
		} elseif ( 'link' === $format ) {
			$format_term = 'link';
		} elseif ( 'video' === $format ) {
			$format_term = 'video';
		} elseif ( 'gallery' === $format ) {
			$format_term = 'gallery';
		} else {
			$format_term = 'status';
		}

		wp_set_object_terms( $post->ID, array( 'app', $format_term ), 'quickpostr_source' );

		// Generate and set the authoritative title. The JS composer sends an
		// empty title — PHP owns the canonical value.
		$date  = wp_date( 'M j, Y', strtotime( $post->post_date ) );
		$title = $this->generate_title( $post->post_content, $format_term, $date );

		if ( $title ) {
			wp_update_post(
				array(
					'ID'         => $post->ID,
					'post_title' => $title,
				)
			);
		}
	}

	/**
	 * Generate a title from post content.
	 *
	 * Mirrors the JS generateTitle() function in useAutoTitle.js — this is the
	 * authoritative server-side version. The JS copy is preview-only.
	 *
	 * @param string $content Raw post content (may contain HTML).
	 * @param string $format  'status' or 'photo'.
	 * @param string $date    Human-readable date string used as a fallback label.
	 * @return string
	 */
	public function generate_title( string $content, string $format, string $date = '' ): string {
		$source = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $content ) ) );

		if ( empty( $source ) ) {
			if ( 'photo' === $format ) {
				$label = __( 'Photo', 'quickpostr' );
			} elseif ( 'link' === $format ) {
				$label = __( 'Link', 'quickpostr' );
			} elseif ( 'video' === $format ) {
				$label = __( 'Video', 'quickpostr' );
			} elseif ( 'gallery' === $format ) {
				$label = __( 'Gallery', 'quickpostr' );
			} else {
				$label = __( 'Status', 'quickpostr' );
			}
			return $label . ' — ' . ( $date ? $date : wp_date( 'M j, Y' ) );
		}

		if ( mb_strlen( $source ) <= 55 ) {
			return $source;
		}

		$truncated  = mb_substr( $source, 0, 55 );
		$last_space = mb_strrpos( $truncated, ' ' );

		return ( $last_space > 30
			? mb_substr( $truncated, 0, $last_space )
			: $truncated
		) . '…';
	}

	/**
	 * Suppress the title on the front-end for posts created by QuickPostr.
	 * Deliberately skipped in admin and REST contexts so ActivityPub
	 * and admin list views receive the real stored title.
	 *
	 * @param string $title   The post title.
	 * @param int    $post_id The post ID.
	 * @return string
	 */
	public function suppress_title( string $title, int $post_id ): string {
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return $title;
		}
		if ( has_term( 'app', 'quickpostr_source', $post_id ) ) {
			return '';
		}
		return $title;
	}

	/**
	 * Suppress the WordPress admin bar based on the hide_admin_bar and
	 * hide_admin_bar_admins settings.
	 *
	 * @param bool $show Whether to show the admin bar.
	 * @return bool
	 */
	public function maybe_suppress_admin_bar( bool $show ): bool {
		if ( ! $show ) {
			return $show;
		}
		$settings = QuickPostr_Settings::get();
		if ( current_user_can( 'manage_options' ) ) {
			return ! empty( $settings['hide_admin_bar_admins'] ) ? false : $show;
		}
		if ( ! empty( $settings['hide_admin_bar'] ) ) {
			return false;
		}
		return $show;
	}

	/**
	 * Strip EXIF metadata from uploaded JPEG images when the setting is enabled.
	 *
	 * Calls autoOrient() before stripImage() so that the EXIF orientation is
	 * baked into the pixel data before the tag is removed. Without this step,
	 * stripping the orientation tag leaves the pixels in the camera's raw
	 * orientation, causing images to appear rotated on display.
	 *
	 * Fails silently so uploads are never blocked if stripping is unavailable.
	 *
	 * @param array $upload Upload data from wp_handle_upload.
	 * @return array Unmodified upload data (file is modified in place).
	 */
	public function maybe_strip_exif( array $upload ): array {
		$settings = QuickPostr_Settings::get();
		if ( empty( $settings['strip_exif'] ) ) {
			return $upload;
		}

		$file = $upload['file'] ?? '';
		$type = $upload['type'] ?? '';

		if ( ! $file || 'image/jpeg' !== $type ) {
			return $upload;
		}

		if ( ! class_exists( 'Imagick' ) ) {
			return $upload;
		}

		try {
			$image = new Imagick( $file );
			$image->autoOrient();
			$image->stripImage();
			$image->writeImage( $file );
			$image->destroy();
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Fail silently — better to keep metadata than break the upload.
		}

		return $upload;
	}
}
