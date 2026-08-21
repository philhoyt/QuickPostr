<?php
/**
 * Uninstall cleanup for QuickPostr.
 *
 * Runs when the plugin is deleted from the Plugins screen — not on deactivation.
 *
 * Removes what the plugin created about *people*: the like records, which carry
 * visitor names, email addresses and a hashed IP. Posts the user wrote through
 * the composer are their own content and are deliberately left alone; deleting
 * them here would destroy work the plugin merely helped create.
 *
 * @package QuickPostr
 */

// Only ever reachable through WordPress's uninstall routine.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Delete every like-comment, including its meta.
 *
 * Batched so a site with a large number of likes does not exhaust memory.
 */
function quickpostr_uninstall_delete_likes(): void {
	$batch_size = 200;

	do {
		$comments = get_comments(
			array(
				'type'   => 'quickpostr_like',
				'status' => 'any',
				'number' => $batch_size,
				'fields' => 'ids',
			)
		);

		$found = count( $comments );

		foreach ( $comments as $comment_id ) {
			// wp_delete_comment( force ) also removes the comment's meta.
			wp_delete_comment( (int) $comment_id, true );
		}
	} while ( $found === $batch_size );
}

/**
 * Remove the private taxonomy's terms.
 *
 * The taxonomy is not registered during uninstall, so it is registered just
 * long enough for term deletion to resolve.
 */
function quickpostr_uninstall_delete_terms(): void {
	register_taxonomy( 'quickpostr_source', 'post', array( 'public' => false ) );

	$terms = get_terms(
		array(
			'taxonomy'   => 'quickpostr_source',
			'hide_empty' => false,
			'fields'     => 'ids',
		)
	);

	if ( is_wp_error( $terms ) ) {
		return;
	}

	foreach ( $terms as $term_id ) {
		wp_delete_term( (int) $term_id, 'quickpostr_source' );
	}
}

quickpostr_uninstall_delete_likes();
quickpostr_uninstall_delete_terms();

// Settings and the scheduled sweep.
delete_option( 'quickpostr_settings' );
wp_clear_scheduled_hook( 'quickpostr_cleanup_pending_shares' );

// Rewrite rules referenced the PWA routes that no longer exist.
flush_rewrite_rules();
