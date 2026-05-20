<?php
/**
 * Server-side render for quickpostr/post-actions.
 *
 * Renders a kebab menu (⋮) with Edit and/or Delete action items for the
 * current post in a Query Loop. Each item is gated individually by capability
 * so users who can only edit see only Edit, etc. Renders nothing for logged-out
 * visitors, non-QuickPostr posts, or when front-end editing is disabled.
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

// Plugin setting gate.
$qp_settings = QuickPostr_Settings::get();
if ( empty( $qp_settings['front_end_edit'] ) ) {
	return;
}

$qp_can_edit   = current_user_can( 'edit_post', $quickpostr_post_id );
$qp_can_delete = current_user_can( 'delete_post', $quickpostr_post_id );

// Render nothing if the user has neither capability.
if ( ! $qp_can_edit && ! $qp_can_delete ) {
	return;
}

// Single inline script — superset of what edit-post and delete-post each needed.
wp_add_inline_script(
	'quickpostr-post-actions-view',
	'window.quickpostrPostActions = ' . wp_json_encode(
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
		'class'        => 'qp-post-actions',
		'data-post-id' => (string) $quickpostr_post_id,
	)
);
?>
<div <?php echo $qp_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<button
		type="button"
		class="qp-post-actions__toggle"
		aria-label="<?php esc_attr_e( 'Post actions', 'quickpostr' ); ?>"
		aria-expanded="false"
		aria-haspopup="true"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<circle cx="12" cy="5" r="2"/>
			<circle cx="12" cy="12" r="2"/>
			<circle cx="12" cy="19" r="2"/>
		</svg>
	</button>

	<div class="qp-post-actions__menu" hidden>
		<?php if ( $qp_can_edit ) : ?>
		<button type="button" class="qp-post-actions__item qp-post-actions__item--edit">
			<?php esc_html_e( 'Edit', 'quickpostr' ); ?>
		</button>
		<?php endif; ?>

		<?php if ( $qp_can_delete ) : ?>
		<button type="button" class="qp-post-actions__item qp-post-actions__item--delete">
			<?php esc_html_e( 'Delete', 'quickpostr' ); ?>
		</button>
		<div class="qp-post-actions__confirm" hidden>
			<span><?php esc_html_e( 'Delete this post?', 'quickpostr' ); ?></span>
			<button type="button" class="qp-post-actions__confirm-yes">
				<?php esc_html_e( 'Yes, delete', 'quickpostr' ); ?>
			</button>
			<button type="button" class="qp-post-actions__confirm-no">
				<?php esc_html_e( 'Cancel', 'quickpostr' ); ?>
			</button>
		</div>
		<?php endif; ?>
	</div>
</div>
