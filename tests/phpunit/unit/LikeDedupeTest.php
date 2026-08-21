<?php
/**
 * Unit tests for the anonymous-like IP dedupe helper (SEC-01 hardening).
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use QuickPostr_Rest;

/**
 * @covers QuickPostr_Rest::anonymous_like_exists_by_ip
 * @covers QuickPostr_Rest::anonymous_like_already_exists
 */
final class LikeDedupeTest extends TestCase {

	private QuickPostr_Rest $rest;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->rest = new QuickPostr_Rest();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_empty_ip_short_circuits_without_querying(): void {
		// get_comments must never run for an empty IP.
		Functions\expect( 'get_comments' )->never();

		$this->assertFalse( $this->rest->anonymous_like_exists_by_ip( 123, '' ) );
	}

	public function test_existing_like_from_ip_returns_true(): void {
		Functions\expect( 'get_comments' )
			->once()
			->andReturn( array( (object) array( 'comment_ID' => 7 ) ) );

		$this->assertTrue( $this->rest->anonymous_like_exists_by_ip( 123, '203.0.113.5' ) );
	}

	public function test_no_like_from_ip_returns_false(): void {
		Functions\expect( 'get_comments' )
			->once()
			->andReturn( array() );

		$this->assertFalse( $this->rest->anonymous_like_exists_by_ip( 123, '203.0.113.5' ) );
	}

	/**
	 * The bypass this suite previously missed.
	 *
	 * Only the individual helpers had coverage, so the composition in
	 * toggle_like() went untested and a fresh email skipped the IP check
	 * entirely — letting one client like a post without limit.
	 */
	public function test_fresh_email_does_not_skip_the_ip_check(): void {
		// No like on file for this address...
		Functions\when( 'get_comments' )->alias(
			static function ( $args ) {
				// ...but the IP has liked before.
				return isset( $args['author_ip'] )
					? array( (object) array( 'comment_ID' => 7 ) )
					: array();
			}
		);

		$this->assertTrue(
			$this->rest->anonymous_like_already_exists( 123, 'brand-new@example.test', '203.0.113.5' ),
			'A previously unseen email must still be blocked by the IP check.'
		);
	}

	public function test_known_email_is_blocked_even_from_a_new_ip(): void {
		Functions\when( 'get_comments' )->alias(
			static function ( $args ) {
				// Email match; the IP is unseen.
				return isset( $args['author_email'] )
					? array( (object) array( 'comment_ID' => 9 ) )
					: array();
			}
		);

		$this->assertTrue(
			$this->rest->anonymous_like_already_exists( 123, 'seen@example.test', '198.51.100.9' )
		);
	}

	public function test_unseen_email_and_unseen_ip_is_allowed(): void {
		Functions\when( 'get_comments' )->justReturn( array() );

		$this->assertFalse(
			$this->rest->anonymous_like_already_exists( 123, 'new@example.test', '198.51.100.9' )
		);
	}

	public function test_name_only_like_is_still_deduped_by_ip(): void {
		Functions\when( 'get_comments' )->alias(
			static function ( $args ) {
				return isset( $args['author_ip'] )
					? array( (object) array( 'comment_ID' => 11 ) )
					: array();
			}
		);

		$this->assertTrue( $this->rest->anonymous_like_already_exists( 123, '', '203.0.113.5' ) );
	}

	public function test_query_is_scoped_to_anonymous_like_for_post_and_ip(): void {
		Functions\expect( 'get_comments' )
			->once()
			->with(
				\Mockery::on(
					static function ( $args ) {
						return 123 === $args['post_id']
							&& '203.0.113.5' === $args['author_ip']
							&& 0 === $args['user_id']
							&& 'quickpostr_like' === $args['type']
							&& 'approve' === $args['status']
							&& 1 === $args['number'];
					}
				)
			)
			->andReturn( array() );

		// Return value also asserted so the test is not flagged risky; the
		// argument shape itself is verified by the Mockery expectation above.
		$this->assertFalse(
			$this->rest->anonymous_like_exists_by_ip( 123, '203.0.113.5' )
		);
	}
}
