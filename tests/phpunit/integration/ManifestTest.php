<?php
/**
 * Integration coverage for the PWA share pipeline and one-time setup.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

use QuickPostr;
use QuickPostr_Manifest;

/**
 * QuickPostr_Manifest claim/cleanup and QuickPostr::maybe_upgrade().
 */
final class ManifestTest extends QuickPostrTestCase {

	private int $author_a;

	private int $author_b;

	public function set_up(): void {
		parent::set_up();

		$this->author_a = self::factory()->user->create( array( 'role' => 'author' ) );
		$this->author_b = self::factory()->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * A pending shared upload owned by the given author, two days old so it is
	 * past the default one-day TTL.
	 *
	 * @param int $author User ID.
	 * @return int Attachment ID.
	 */
	private function pending_upload( int $author ): int {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_author'    => $author,
				'post_mime_type' => 'image/jpeg',
			)
		);
		update_post_meta( $attachment_id, QuickPostr_Manifest::PENDING_META, time() - 2 * DAY_IN_SECONDS );

		return $attachment_id;
	}

	public function test_saving_a_post_claims_the_authors_own_pending_upload(): void {
		$attachment_id = $this->pending_upload( $this->author_a );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => $this->author_a,
				'post_content' => '<img class="wp-image-' . $attachment_id . '" src="x.jpg">',
			)
		);

		$this->assertEmpty( get_post_meta( $attachment_id, QuickPostr_Manifest::PENDING_META, true ) );
		$this->assertSame( $post_id, wp_get_post_parent_id( $attachment_id ) );
	}

	/**
	 * SEC-04: post content is user-controlled, so naming someone else's
	 * attachment ID must not let a post claim it.
	 */
	public function test_another_user_cannot_claim_a_pending_upload(): void {
		$attachment_id = $this->pending_upload( $this->author_a );

		self::factory()->post->create(
			array(
				'post_author'  => $this->author_b,
				'post_content' => '<img class="wp-image-' . $attachment_id . '" src="x.jpg">',
			)
		);

		$this->assertNotEmpty( get_post_meta( $attachment_id, QuickPostr_Manifest::PENDING_META, true ) );
		$this->assertSame( 0, wp_get_post_parent_id( $attachment_id ) );
	}

	public function test_cleanup_removes_expired_pending_uploads_only(): void {
		$expired = $this->pending_upload( $this->author_a );
		$fresh   = $this->pending_upload( $this->author_a );
		update_post_meta( $fresh, QuickPostr_Manifest::PENDING_META, time() );

		( new QuickPostr_Manifest() )->cleanup_pending_shares();

		$this->assertNull( get_post( $expired ) );
		$this->assertInstanceOf( \WP_Post::class, get_post( $fresh ) );
	}

	/**
	 * Uninstall passes a zero TTL so even brand-new pending uploads go.
	 */
	public function test_zero_ttl_sweeps_everything_pending(): void {
		$ids = array();
		for ( $i = 0; $i < 3; $i++ ) {
			$ids[] = $this->pending_upload( $this->author_a );
		}
		update_post_meta( $ids[0], QuickPostr_Manifest::PENDING_META, time() );

		( new QuickPostr_Manifest() )->cleanup_pending_shares( 0 );

		foreach ( $ids as $id ) {
			$this->assertNull( get_post( $id ) );
		}
	}

	/**
	 * ARC-01: activation does not run on updates, so the cron and the terms
	 * must be re-armed by a version check instead.
	 */
	public function test_maybe_upgrade_arms_the_cron_and_seeds_terms_once(): void {
		wp_clear_scheduled_hook( QuickPostr_Manifest::CLEANUP_HOOK );
		delete_option( QuickPostr::VERSION_OPTION );
		foreach ( get_terms(
			array(
				'taxonomy'   => 'quickpostr_source',
				'hide_empty' => false,
			)
		) as $term ) {
			wp_delete_term( $term->term_id, 'quickpostr_source' );
		}

		( new QuickPostr() )->maybe_upgrade();

		$this->assertNotFalse( wp_next_scheduled( QuickPostr_Manifest::CLEANUP_HOOK ) );
		$this->assertSame( QUICKPOSTR_VERSION, get_option( QuickPostr::VERSION_OPTION ) );
		$this->assertNotEmpty( term_exists( 'app', 'quickpostr_source' ) );
		$this->assertNotEmpty( term_exists( 'gallery', 'quickpostr_source' ) );

		// A second run with the version recorded is a no-op.
		wp_clear_scheduled_hook( QuickPostr_Manifest::CLEANUP_HOOK );
		( new QuickPostr() )->maybe_upgrade();
		$this->assertFalse( wp_next_scheduled( QuickPostr_Manifest::CLEANUP_HOOK ) );
	}

	/**
	 * With trailing-slash permalinks, core wanted to 301 the service worker
	 * to /quickpostr-sw.js/, which browsers reject for worker scripts.
	 *
	 * @dataProvider pwa_routes
	 *
	 * @param string $path  The PWA route.
	 * @param string $query The query var that identifies it.
	 */
	public function test_pwa_routes_are_not_canonically_redirected( string $path, string $query ): void {
		global $wp_rewrite;

		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		( new QuickPostr_Manifest() )->register_rewrite_rules();
		$wp_rewrite->flush_rules();

		$this->go_to( home_url( $path ) );

		$this->assertSame( '1', get_query_var( $query ), 'The rewrite rule must match the route.' );

		// redirect_canonical() returns the target URL when it would redirect
		// and nothing at all when it would not.
		$this->assertEmpty(
			redirect_canonical( home_url( $path ), false ),
			'redirect_canonical() must leave the route alone.'
		);

		// Without the plugin's filter, core does want to redirect the two
		// slash-less routes, which is the bug this guards against.
		remove_all_filters( 'redirect_canonical' );
		if ( '/' !== substr( $path, -1 ) ) {
			$this->assertSame(
				home_url( $path . '/' ),
				redirect_canonical( home_url( $path ), false ),
				'Core adds a trailing slash here; the filter is what prevents it.'
			);
		}

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	/**
	 * The filter is targeted: an ordinary page keeps its canonical redirect.
	 */
	public function test_ordinary_pages_are_still_canonically_redirected(): void {
		global $wp_rewrite;

		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$page = self::factory()->post->create(
			array(
				'post_type' => 'page',
				'post_name' => 'ordinary',
			)
		);
		$this->go_to( home_url( '/?page_id=' . $page ) );

		$this->assertSame(
			home_url( '/ordinary/' ),
			redirect_canonical( home_url( '/?page_id=' . $page ), false )
		);

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	public function pwa_routes(): array {
		return array(
			'service worker' => array( '/quickpostr-sw.js', 'quickpostr_sw' ),
			'manifest'       => array( '/quickpostr-manifest.json', 'quickpostr_manifest' ),
			'share target'   => array( '/quickpostr-share/', 'quickpostr_share' ),
		);
	}

	public function test_manifest_link_is_only_printed_for_users_who_can_post(): void {
		$manifest = new QuickPostr_Manifest();

		wp_set_current_user( 0 );
		ob_start();
		$manifest->print_manifest_link();
		$this->assertSame( '', ob_get_clean(), 'Visitors must not trigger a manifest fetch.' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		ob_start();
		$manifest->print_manifest_link();
		$this->assertSame( '', ob_get_clean() );

		wp_set_current_user( $this->author_a );
		ob_start();
		$manifest->print_manifest_link();
		$this->assertStringContainsString( 'rel="manifest"', ob_get_clean() );
	}
}
