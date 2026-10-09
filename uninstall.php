<?php
/**
 * Uninstall cleanup for QuickPostr.
 *
 * Runs when the plugin is deleted from the Plugins screen — not on deactivation.
 *
 * Removes everything the plugin created: the like records (which carry visitor
 * names, email addresses and a hashed IP), photos shared into the composer but
 * never published, the plugin's own post meta, its taxonomy terms, option,
 * transients and cron event. Posts the user wrote through the composer are
 * their own content and are deliberately left alone; deleting them here would
 * destroy work the plugin merely helped create. Meta owned by companion
 * plugins (_geo_tagr_*, _videomuxr_*) is theirs to remove.
 *
 * @package QuickPostr
 */

// Only ever reachable through WordPress's uninstall routine.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-manifest.php';

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

/**
 * Remove transients by prefix, including their timeout rows.
 *
 * Transients expire on their own, but an unexpired one would otherwise sit in
 * wp_options after the plugin is gone.
 *
 * @param string $prefix The transient name prefix (without `_transient_`).
 */
function quickpostr_uninstall_delete_transients( string $prefix ): void {
	global $wpdb;

	$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- no API deletes transients by prefix; one-off at uninstall.
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
			$wpdb->esc_like( '_transient_' . $prefix ) . '%',
			$wpdb->esc_like( '_transient_timeout_' . $prefix ) . '%'
		)
	);
}

quickpostr_uninstall_delete_likes();
quickpostr_uninstall_delete_terms();

// Shared uploads that were never published, however recent, then the flag
// itself in case any attachment survived the sweep.
( new QuickPostr_Manifest() )->cleanup_pending_shares( 0 );
delete_post_meta_by_key( QuickPostr_Manifest::PENDING_META );

// The plugin's own post meta. Deleting a meta key leaves the post intact.
delete_post_meta_by_key( '_quickpostr_post' );
delete_post_meta_by_key( '_quickpostr_custom_title' );
delete_post_meta_by_key( '_quickpostr_like_count' );

// Options, transients and the scheduled sweep.
delete_option( 'quickpostr_settings' );
delete_option( 'quickpostr_version' );
quickpostr_uninstall_delete_transients( 'quickpostr_share_rate_' );
quickpostr_uninstall_delete_transients( 'quickpostr_like_rate_' );
wp_clear_scheduled_hook( 'quickpostr_cleanup_pending_shares' );

// Rewrite rules referenced the PWA routes that no longer exist.
flush_rewrite_rules();
