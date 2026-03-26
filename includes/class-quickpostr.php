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
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
	}

	/**
	 * Register all plugin blocks.
	 *
	 * The profile-edit blocks share a single view script that lives outside
	 * either block directory, so it must be registered manually here.
	 * Both block.json files reference it by handle (no file: prefix).
	 */
	public function register_block(): void {
		wp_register_script(
			'quickpostr-delete-post-view',
			QUICKPOSTR_URL . 'blocks/delete-post/view.js',
			array(),
			QUICKPOSTR_VERSION,
			array( 'in_footer' => true )
		);
		wp_register_script(
			'quickpostr-edit-post-view',
			QUICKPOSTR_URL . 'blocks/edit-post/view.js',
			array(),
			QUICKPOSTR_VERSION,
			array( 'in_footer' => true )
		);
		wp_register_script(
			'quickpostr-profile-edit',
			QUICKPOSTR_URL . 'blocks/profile-edit.js',
			array(),
			QUICKPOSTR_VERSION,
			array( 'in_footer' => true )
		);

		register_block_type( QUICKPOSTR_PATH . 'blocks/composer/' );
		register_block_type( QUICKPOSTR_PATH . 'blocks/delete-post/' );
		register_block_type( QUICKPOSTR_PATH . 'blocks/edit-post/' );
		register_block_type( QUICKPOSTR_PATH . 'blocks/profile-edit-name/' );
		register_block_type( QUICKPOSTR_PATH . 'blocks/profile-edit-bio/' );
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
		$terms = array( 'app', 'status', 'photo' );
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

		$raw_format  = get_post_format( $post->ID );
		$format      = $raw_format ? $raw_format : 'status';
		$format_term = ( 'image' === $format ) ? 'photo' : 'status';

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
			$label = ( 'photo' === $format )
				? __( 'Photo', 'quickpostr' )
				: __( 'Status', 'quickpostr' );
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
	 * Suppress the WordPress admin bar for non-administrator roles when
	 * the hide_admin_bar setting is enabled.
	 *
	 * @param bool $show Whether to show the admin bar.
	 * @return bool
	 */
	public function maybe_suppress_admin_bar( bool $show ): bool {
		if ( ! $show ) {
			return $show;
		}
		if ( current_user_can( 'manage_options' ) ) {
			return $show;
		}
		$settings = QuickPostr_Settings::get();
		if ( ! empty( $settings['hide_admin_bar'] ) ) {
			return false;
		}
		return $show;
	}

	/**
	 * Load plugin text domain.
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain( 'quickpostr', false, dirname( plugin_basename( QUICKPOSTR_PATH . 'quickpostr.php' ) ) . '/languages' );
	}
}
