<?php
/**
 * Custom rewrite rule for the QuickPostr app page.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr_Rewrite
 *
 * Registers a rewrite rule so `yoursite.com/{slug}` serves the app shell
 * with no theme involvement.
 */
class QuickPostr_Rewrite {

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'add_rewrite_rule' ) );
		add_filter( 'query_vars', array( $this, 'add_query_var' ) );
		add_filter( 'template_include', array( $this, 'load_app_shell' ) );
	}

	/**
	 * Add the rewrite rule using the configured URL slug.
	 */
	public function add_rewrite_rule(): void {
		$slug = $this->get_slug();
		add_rewrite_rule( '^' . preg_quote( $slug, '/' ) . '/?$', 'index.php?quickpostr=1', 'top' );
	}

	/**
	 * Register the custom query var.
	 *
	 * @param string[] $vars Existing query vars.
	 * @return string[]
	 */
	public function add_query_var( array $vars ): array {
		$vars[] = 'quickpostr';
		return $vars;
	}

	/**
	 * Serve the app shell template when the quickpostr query var is set.
	 *
	 * @param string $template Current template path.
	 * @return string
	 */
	public function load_app_shell( string $template ): string {
		if ( get_query_var( 'quickpostr' ) ) {
			$shell = QUICKPOSTR_PATH . 'templates/app-shell.php';
			if ( file_exists( $shell ) ) {
				return $shell;
			}
		}
		return $template;
	}

	/**
	 * Return the configured URL slug, defaulting to 'quickpostr'.
	 *
	 * @return string
	 */
	private function get_slug(): string {
		$settings = get_option( 'quickpostr_settings', array() );
		$slug     = isset( $settings['app_url_slug'] ) ? sanitize_title( $settings['app_url_slug'] ) : '';
		return $slug ?: 'quickpostr';
	}
}
