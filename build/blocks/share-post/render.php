<?php
/**
 * Server-side render for quickpostr/share-post.
 *
 * Outputs a share button for the current post. The view script hides it
 * automatically on browsers that do not support the Web Share API.
 *
 * @package QuickPostr
 *
 * @var array  $attributes Block attributes.
 * @var string $content    Inner block content (unused).
 * @var object $block      The WP_Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$quickpostr_post_id = (int) ( $block->context['postId'] ?? get_the_ID() );
if ( ! $quickpostr_post_id ) {
	return;
}

$qp_post_title = wp_strip_all_tags( get_the_title( $quickpostr_post_id ) );
$qp_post_url   = esc_url( get_permalink( $quickpostr_post_id ) );

if ( ! $qp_post_url ) {
	return;
}

$qp_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'      => 'qp-share-post',
		'data-title' => $qp_post_title,
		'data-url'   => $qp_post_url,
	)
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<button type="button" class="qp-share-post__btn" hidden>
		<svg class="qp-share-post__icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<circle cx="18" cy="5" r="3"/>
			<circle cx="6" cy="12" r="3"/>
			<circle cx="18" cy="19" r="3"/>
			<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
			<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
		</svg>
		<?php esc_html_e( 'Share', 'quickpostr' ); ?>
	</button>
</div>
