<?php
/**
 * Server-side render for quickpostr/edit-post.
 *
 * Renders an edit button for the current post in a Query Loop.
 * On click, the view script fetches the post and fires a custom DOM event
 * so the Composer block can pre-fill in-place without a page reload.
 * Falls back to ?qp-edit={id} navigation if no Composer is present.
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

if ( ! is_user_logged_in() ) {
	return;
}

$quickpostr_post_id = (int) ( $block->context['postId'] ?? 0 );
if ( ! $quickpostr_post_id ) {
	return;
}

// Only render for QuickPostr posts.
if ( ! has_term( 'app', 'quickpostr_source', $quickpostr_post_id ) ) {
	return;
}

// Capability gate: user must be able to edit this specific post.
if ( ! current_user_can( 'edit_post', $quickpostr_post_id ) ) {
	return;
}

// Plugin setting gate.
$qp_settings = QuickPostr_Settings::get();
if ( empty( $qp_settings['front_end_edit'] ) ) {
	return;
}

// Pass REST config to the view script (registered via viewScript in block.json).
wp_add_inline_script(
	'quickpostr-edit-post-view',
	'window.quickpostrEditPost = ' . wp_json_encode(
		array(
			'restUrl' => rest_url(),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
			'homeUrl' => home_url( '/' ),
		)
	) . ';',
	'before'
);

$qp_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'        => 'qp-edit-post',
		'data-post-id' => (string) $quickpostr_post_id,
	)
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<button type="button" class="qp-edit-post__btn">
		<?php esc_html_e( 'Edit', 'quickpostr' ); ?>
	</button>
</div>
