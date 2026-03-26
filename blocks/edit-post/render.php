<?php
/**
 * Server-side render for quickpostr/edit-post.
 *
 * Renders an edit link for the current post in a Query Loop.
 * The link appends ?qp-edit={id} to the home URL so the Composer
 * block on that page can detect and pre-fill the editor.
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

// Capability gate: user must be able to edit this specific post.
if ( ! current_user_can( 'edit_post', $post_id ) ) {
	return;
}

// Plugin setting gate.
$settings = QuickPostr_Settings::get();
if ( empty( $settings['front_end_edit'] ) ) {
	return;
}

// Link to the home page (where the Composer block lives) with the edit param.
$edit_url = add_query_arg( 'qp-edit', $post_id, home_url( '/' ) );

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => 'qp-edit-post' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<a href="<?php echo esc_url( $edit_url ); ?>" class="qp-edit-post__link">
		<?php esc_html_e( 'Edit', 'quickpostr' ); ?>
	</a>
</div>
