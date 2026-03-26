<?php
/**
 * App shell — bare HTML document that loads the React app.
 * No wp_head(), no theme. Served at yoursite.com/{slug}.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$settings  = QuickPostr_Settings::get();
$build_url = QUICKPOSTR_URL . 'build/';

$config = array(
	'siteUrl'  => home_url(),
	'restUrl'  => rest_url(),
	'nonce'    => wp_create_nonce( 'wp_rest' ),
	'buildUrl' => $build_url,
	'settings' => array(
		'defaultStatus'   => $settings['default_status'],
		'defaultCategory' => (int) $settings['default_category'],
		'showSlugPreview' => (bool) $settings['show_slug_preview'],
		'appUrlSlug'      => $settings['app_url_slug'],
	),
);
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr( get_bloginfo( 'language' ) ); ?>">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="theme-color" content="#0E0D0B">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="QuickPostr">
	<title>QuickPostr</title>
	<link rel="manifest" href="<?php echo esc_url( $build_url . 'manifest.json' ); ?>">
	<link rel="apple-touch-icon" href="<?php echo esc_url( $build_url . 'icon-192.png' ); ?>">
	<link rel="stylesheet" href="<?php echo esc_url( $build_url . 'app.css' ); ?>">
	<script>
		window.quickpostrConfig = <?php echo wp_json_encode( $config ); ?>;
	</script>
</head>
<body>
	<div id="app"></div>
	<script type="module" src="<?php echo esc_url( $build_url . 'app.js' ); ?>"></script>
</body>
</html>
