<?php
/**
 * Server-side render for quickpostr/like-post.
 *
 * Renders a heart button with the current like count for all visitors.
 * Logged-in users get a toggle (like/unlike). Logged-out visitors see a modal
 * offering a login link or a name/email form for anonymous likes.
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

$quickpostr_post_id = (int) ( $block->context['postId'] ?? 0 );
if ( ! $quickpostr_post_id ) {
	return;
}

$qp_logged_in  = is_user_logged_in();
$qp_rest       = new QuickPostr_Rest();
$qp_like_count = $qp_rest->get_like_count( $quickpostr_post_id );
$qp_liked      = $qp_logged_in
	? (bool) $qp_rest->get_user_like_comment_id( $quickpostr_post_id, get_current_user_id() )
	: false;

// Output the inline config once per page even when multiple like blocks render.
static $qp_like_config_added = false;
if ( ! $qp_like_config_added ) {
	wp_add_inline_script(
		'quickpostr-like-post-view',
		'window.quickpostrLikePost = ' . wp_json_encode(
			array(
				'restUrl'  => rest_url(),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'loginUrl' => wp_login_url(),
			)
		) . ';',
		'before'
	);
	$qp_like_config_added = true;
}

$qp_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'          => 'qp-like-post',
		'data-post-id'   => (string) $quickpostr_post_id,
		'data-liked'     => $qp_liked ? 'true' : 'false',
		'data-count'     => (string) $qp_like_count,
		'data-logged-in' => $qp_logged_in ? 'true' : 'false',
	)
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<button
		type="button"
		class="qp-like-post__button<?php echo $qp_liked ? ' is-liked' : ''; ?>"
		aria-label="<?php echo $qp_liked ? esc_attr__( 'Unlike this post', 'quickpostr' ) : esc_attr__( 'Like this post', 'quickpostr' ); ?>"
		aria-pressed="<?php echo $qp_liked ? 'true' : 'false'; ?>"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class="qp-like-post__icon"
		>
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
		<span class="qp-like-post__count"><?php echo esc_html( (string) $qp_like_count ); ?></span>
	</button>
</div>
