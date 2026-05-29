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
