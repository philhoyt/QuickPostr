<?php
/**
 * Server-side render for the QuickPostr Composer block.
 *
 * Performs the auth gate and mounts the React composer for qualified users.
 *
 * @package QuickPostr
 *
 * @var array  $attributes Block attributes.
 * @var string $content    Inner block content (unused — dynamic block).
 * @var object $block      The WP_Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Auth gate: must be logged in with posting capability.
if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
	return;
}

// Optionally enforce allowed_roles from plugin settings.
$settings        = QuickPostr_Settings::get();
$allowed         = (array) $settings['allowed_roles'];
$quickpostr_user = wp_get_current_user();
$user_roles      = (array) $quickpostr_user->roles;

if ( ! array_intersect( $user_roles, $allowed ) ) {
	return;
}

// Read the generated asset manifest so WordPress loads all dependencies
// (wp-element, react, react-jsx-runtime, wp-rich-text) before our script.
$asset_file = QUICKPOSTR_PATH . 'blocks/composer/build/composer-view.asset.php';
$asset      = file_exists( $asset_file )
	? require $asset_file
	: array(
		'dependencies' => array(),
		'version'      => QUICKPOSTR_VERSION,
	);

// Enqueue the front-end composer bundle.
wp_enqueue_script(
	'quickpostr-composer-view',
	QUICKPOSTR_URL . 'blocks/composer/build/composer-view.js',
	$asset['dependencies'],
	$asset['version'],
	array( 'in_footer' => true )
);

wp_enqueue_style(
	'quickpostr-composer-style',
	QUICKPOSTR_URL . 'blocks/composer/style.css',
	array(),
	QUICKPOSTR_VERSION
);

// Build the config object passed to the React app.
$avatar_urls  = rest_get_avatar_urls( $quickpostr_user->user_email );
$actor_handle = '';

$config = array(
	'restUrl'       => rest_url(),
	'nonce'         => wp_create_nonce( 'wp_rest' ),
	'currentUser'   => array(
		'id'          => $quickpostr_user->ID,
		'name'        => $quickpostr_user->display_name,
		'avatarUrls'  => $avatar_urls,
		'actorHandle' => $actor_handle,
	),
	'settings'      => array(
		'defaultStatus'   => $settings['default_status'],
		'defaultCategory' => (int) $settings['default_category'],
		'showSlugPreview' => (bool) $settings['show_slug_preview'],
		'frontEndEdit'    => (bool) $settings['front_end_edit'],
	),
	'blockAttrs'    => array(
		'defaultMode'     => $attributes['defaultMode'] ?? 'status',
		'showSlugPreview' => $attributes['showSlugPreview'] ?? true,
		'placeholderText' => $attributes['placeholderText'] ?? __( "What's on your mind?", 'quickpostr' ),
	),
	'maxUploadSize' => wp_max_upload_size(),
);

wp_add_inline_script(
	'quickpostr-composer-view',
	'window.quickpostrConfig = ' . wp_json_encode( $config ) . ';',
	'before'
);

// Block wrapper attributes (handles align, color, spacing supports).
$wrapper_attributes = get_block_wrapper_attributes(
	array( 'id' => 'quickpostr-composer' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
</div>
