<?php
/**
 * Media Gallery block — server-side render.
 *
 * $content  string  Serialized inner blocks HTML (core/image blocks).
 * $block    WP_Block
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'qp-media-gallery' ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized by core ?>>
	<div class="qp-media-gallery__track">
		<?php echo wp_kses_post( $content ); ?>
	</div>
	<nav class="qp-media-gallery__dots" aria-label="<?php esc_attr_e( 'Gallery navigation', 'quickpostr' ); ?>"></nav>
	<div class="qp-media-gallery__pill" aria-hidden="true"></div>
</div>
