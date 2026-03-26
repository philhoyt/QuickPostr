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

$post_id = (int) ( $block->context['postId'] ?? 0 );
if ( ! $post_id ) {
	return;
}

// Only render for QuickPostr posts.
if ( ! has_term( 'app', 'quickpostr_source', $post_id ) ) {
	return;
}

// Capability gate: user must be able to delete this specific post.
if ( ! current_user_can( 'delete_post', $post_id ) ) {
	return;
}

// Plugin setting gate.
$settings = QuickPostr_Settings::get();
if ( empty( $settings['front_end_edit'] ) ) {
	return;
}

// Enqueue view script once per page.
$handle = 'quickpostr-delete-post';
if ( ! wp_script_is( $handle, 'enqueued' ) ) {
	wp_enqueue_script(
		$handle,
		QUICKPOSTR_URL . 'blocks/delete-post/view.js',
		array(),
		QUICKPOSTR_VERSION,
		array( 'in_footer' => true )
	);
	wp_localize_script(
		$handle,
		'quickpostrDeletePost',
		array(
			'restUrl' => rest_url(),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		)
	);
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'        => 'qp-delete-post',
		'data-post-id' => (string) $post_id,
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
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
