<?php
/**
 * Server-side render for quickpostr/profile-edit-name.
 *
 * Displays the current user's display name with an inline edit control.
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

// Pass REST config to the shared view script once per page.
static $profile_edit_localized = false;
if ( ! $profile_edit_localized ) {
	wp_localize_script(
		'quickpostr-profile-edit',
		'quickpostrProfileEdit',
		array(
			'restUrl' => rest_url(),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		)
	);
	$profile_edit_localized = true;
}

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => 'qp-profile-edit-name' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<span
		class="qp-profile-edit__value"
		data-field="name"
		data-original="<?php echo esc_attr( $quickpostr_user->display_name ); ?>"
	><?php echo esc_html( $quickpostr_user->display_name ); ?></span>

	<span class="qp-profile-edit__controls">
		<button type="button" class="qp-profile-edit__edit-btn" aria-label="<?php esc_attr_e( 'Edit display name', 'quickpostr' ); ?>">
			<?php esc_html_e( 'Edit', 'quickpostr' ); ?>
		</button>
		<span class="qp-profile-edit__actions" hidden>
			<button type="button" class="qp-profile-edit__save-btn"><?php esc_html_e( 'Save', 'quickpostr' ); ?></button>
			<button type="button" class="qp-profile-edit__cancel-btn"><?php esc_html_e( 'Cancel', 'quickpostr' ); ?></button>
		</span>
		<span class="qp-profile-edit__status" aria-live="polite" hidden></span>
	</span>
</div>
