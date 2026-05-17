<?php
/**
 * Server-side render for quickpostr/delete-post.
 *
 * Renders a delete button for the current post in a Query Loop.
 * Outputs nothing unless the user can delete this specific post.
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

// Capability gate: user must be able to delete this specific post.
if ( ! current_user_can( 'delete_post', $quickpostr_post_id ) ) {
	return;
}

// Plugin setting gate.
$qp_settings = QuickPostr_Settings::get();
if ( empty( $qp_settings['front_end_edit'] ) ) {
	return;
}

// Pass REST config to the view script (registered via viewScript in block.json).
wp_add_inline_script(
	'quickpostr-delete-post-view',
	'window.quickpostrDeletePost = ' . wp_json_encode(
		array(
			'restUrl' => rest_url(),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		)
	) . ';',
	'before'
);

$qp_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'        => 'qp-delete-post',
		'data-post-id' => (string) $quickpostr_post_id,
	)
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<button type="button" class="qp-delete-post__btn">
		<?php esc_html_e( 'Delete', 'quickpostr' ); ?>
	</button>
	<span class="qp-delete-post__confirm" hidden>
		<span><?php esc_html_e( 'Delete this post?', 'quickpostr' ); ?></span>
		<button type="button" class="qp-delete-post__yes">
			<?php esc_html_e( 'Yes, delete', 'quickpostr' ); ?>
		</button>
		<button type="button" class="qp-delete-post__no">
			<?php esc_html_e( 'Cancel', 'quickpostr' ); ?>
		</button>
	</span>
</div>
