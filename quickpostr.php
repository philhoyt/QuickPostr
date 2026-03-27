<?php
/**
 * Plugin Name:       QuickPostr
 * Plugin URI:        https://wordpress.org/plugins/quickpostr/
 * Description:       A front-end, social-style post composer for WordPress. Place the Composer block anywhere, post like it's social media.
 * Version:           0.5.0
 * Requires at least: 6.7
 * Requires PHP:      8.1
 * Author:            QuickPostr Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       quickpostr
 * Domain Path:       /languages
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'QUICKPOSTR_VERSION', '0.5.0' );
define( 'QUICKPOSTR_PATH', plugin_dir_path( __FILE__ ) );
define( 'QUICKPOSTR_URL', plugin_dir_url( __FILE__ ) );

require_once QUICKPOSTR_PATH . 'includes/class-quickpostr.php';
require_once QUICKPOSTR_PATH . 'includes/class-settings.php';
require_once QUICKPOSTR_PATH . 'includes/class-rest.php';

register_activation_hook( __FILE__, 'quickpostr_activate' );
register_deactivation_hook( __FILE__, 'quickpostr_deactivate' );

/**
 * Plugin activation: flush rewrite rules.
 */
function quickpostr_activate(): void {
	flush_rewrite_rules();
}

/**
 * Plugin deactivation: flush rewrite rules.
 */
function quickpostr_deactivate(): void {
	flush_rewrite_rules();
}

/**
 * Bootstrap the plugin.
 */
function quickpostr_init(): void {
	$plugin = new QuickPostr();
	$plugin->init();
}
add_action( 'plugins_loaded', 'quickpostr_init' );
