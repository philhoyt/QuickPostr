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
$qp_settings     = QuickPostr_Settings::get();
$qp_allowed      = (array) $qp_settings['allowed_roles'];
$quickpostr_user = wp_get_current_user();
$qp_user_roles   = (array) $quickpostr_user->roles;

if ( ! array_intersect( $qp_user_roles, $qp_allowed ) ) {
	return;
}

// Build the config object passed to the React app.
// The view script and stylesheet are enqueued automatically via block.json.
$qp_avatar_urls  = rest_get_avatar_urls( $quickpostr_user->user_email );
$qp_actor_handle = '';

$qp_config = array(
	'restUrl'          => rest_url(),
	'nonce'            => wp_create_nonce( 'wp_rest' ),
	'currentUser'      => array(
		'id'          => $quickpostr_user->ID,
		'name'        => $quickpostr_user->display_name,
		'avatarUrls'  => $qp_avatar_urls,
		'actorHandle' => $qp_actor_handle,
	),
	'settings'         => array(
		'defaultStatus'   => $qp_settings['default_status'],
		'defaultCategory' => (int) $qp_settings['default_category'],
		'showSlugPreview' => (bool) $qp_settings['show_slug_preview'],
		'frontEndEdit'    => (bool) $qp_settings['front_end_edit'],
	),
	'blockAttrs'       => array(
		'defaultMode'     => $attributes['defaultMode'] ?? 'status',
		'showSlugPreview' => $attributes['showSlugPreview'] ?? true,
		'placeholderText' => $attributes['placeholderText'] ?? __( "What's on your mind?", 'quickpostr' ),
	),
	'maxUploadSize'    => wp_max_upload_size(),
	'videoMuxr'        => ( function_exists( 'videomuxr_is_configured' ) && videomuxr_is_configured() ) ? array(
		'active'          => true,
		'directUploadUrl' => rest_url( 'videomuxr/v1/direct-upload' ),
		'statusUrl'       => rest_url( 'videomuxr/v1/upload-status' ),
		'nonce'           => wp_create_nonce( 'wp_rest' ),
	) : null,
	'betterBookmarks'  => class_exists( 'Better_Bookmarks' ),
	'geoTagrActive'    => function_exists( 'geo_tagr_get_post_meta' ),
	'geoTagrGeocoding' => ( function_exists( 'geo_tagr_get_post_meta' ) && class_exists( '\\GeoTagr\\Settings' ) ) ? array(
		'provider' => \GeoTagr\Settings::get( 'geocoding_provider', 'nominatim' ),
		'proxyUrl' => rest_url( 'geotagr/v1/geocode' ),
		'nonce'    => wp_create_nonce( 'wp_rest' ),
	) : null,
);

// Enqueue the WP media modal so PhotoComposer can open the library picker.
wp_enqueue_media();

wp_add_inline_script(
	'quickpostr-composer-view',
	'window.quickpostrConfig = ' . wp_json_encode( $qp_config ) . ';',
	'before'
);

// Block wrapper attributes (handles align, color, spacing supports).
$qp_wrapper_attributes = get_block_wrapper_attributes(
	array( 'id' => 'quickpostr-composer' )
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
</div>
