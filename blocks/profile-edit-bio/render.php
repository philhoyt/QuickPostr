<?php
/**
 * Server-side render for quickpostr/profile-edit-bio.
 *
 * Displays the current user's biographical info with an inline edit control.
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

$quickpostr_user = wp_get_current_user();
$bio             = get_user_meta( $quickpostr_user->ID, 'description', true );

// Enqueue shared profile-edit view script once per page.
$handle = 'quickpostr-profile-edit';
if ( ! wp_script_is( $handle, 'enqueued' ) ) {
	wp_enqueue_script(
		$handle,
		QUICKPOSTR_URL . 'blocks/profile-edit.js',
		array(),
		QUICKPOSTR_VERSION,
		array( 'in_footer' => true )
	);
	wp_localize_script(
		$handle,
		'quickpostrProfileEdit',
		array(
			'restUrl' => rest_url(),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		)
	);
}

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => 'qp-profile-edit-bio' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<p
		class="qp-profile-edit__value"
		data-field="description"
		data-original="<?php echo esc_attr( $bio ); ?>"
	><?php echo esc_html( $bio ); ?></p>

	<span class="qp-profile-edit__controls">
		<button type="button" class="qp-profile-edit__edit-btn" aria-label="<?php esc_attr_e( 'Edit bio', 'quickpostr' ); ?>">
			<?php esc_html_e( 'Edit', 'quickpostr' ); ?>
		</button>
		<textarea
			class="qp-profile-edit__textarea"
			rows="4"
			aria-label="<?php esc_attr_e( 'Bio', 'quickpostr' ); ?>"
			hidden
		><?php echo esc_html( $bio ); ?></textarea>
		<span class="qp-profile-edit__actions" hidden>
			<button type="button" class="qp-profile-edit__save-btn"><?php esc_html_e( 'Save', 'quickpostr' ); ?></button>
			<button type="button" class="qp-profile-edit__cancel-btn"><?php esc_html_e( 'Cancel', 'quickpostr' ); ?></button>
		</span>
		<span class="qp-profile-edit__status" aria-live="polite" hidden></span>
	</span>
</div>
