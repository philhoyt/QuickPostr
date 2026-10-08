<?php
/**
 * Unit tests for the PWA share target's origin check.
 *
 * The share endpoint cannot carry a nonce, so this check is the main thing
 * standing between a logged-in uploader and a forged cross-site POST.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use QuickPostr_Manifest;
use ReflectionMethod;

/**
 * QuickPostr_Manifest::is_cross_site_request().
 *
 * @covers QuickPostr_Manifest::is_cross_site_request
 */
final class CrossSiteRequestTest extends TestCase {

	private ReflectionMethod $method;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\when( 'wp_parse_url' )->alias( 'parse_url' );
		Functions\when( 'home_url' )->justReturn( 'https://example.test' );

		$this->method = new ReflectionMethod( QuickPostr_Manifest::class, 'is_cross_site_request' );
		$this->method->setAccessible( true );

		unset( $_SERVER['HTTP_SEC_FETCH_SITE'], $_SERVER['HTTP_ORIGIN'], $_SERVER['HTTP_REFERER'] );
	}

	protected function tearDown(): void {
		unset( $_SERVER['HTTP_SEC_FETCH_SITE'], $_SERVER['HTTP_ORIGIN'], $_SERVER['HTTP_REFERER'] );
		Monkey\tearDown();
		parent::tearDown();
	}

	private function is_cross_site(): bool {
		return $this->method->invoke( new QuickPostr_Manifest() );
	}

	/**
	 * A share-sheet launch from an older browser: no headers at all.
	 */
	public function test_no_headers_is_allowed(): void {
		$this->assertFalse( $this->is_cross_site() );
	}

	/**
	 * Fetch Metadata, when present, is decisive.
	 *
	 * @dataProvider sec_fetch_site_values
	 *
	 * @param string $value    The Sec-Fetch-Site header value.
	 * @param bool   $expected Whether the request should be refused.
	 */
	public function test_sec_fetch_site_is_honoured( string $value, bool $expected ): void {
		$_SERVER['HTTP_SEC_FETCH_SITE'] = $value;

		$this->assertSame( $expected, $this->is_cross_site() );
	}

	public function sec_fetch_site_values(): array {
		return array(
			'share sheet launch'   => array( 'none', false ),
			'own page'             => array( 'same-origin', false ),
			'sibling subdomain'    => array( 'same-site', true ),
			'another site'         => array( 'cross-site', true ),
			'unknown future value' => array( 'whatever', true ),
		);
	}

	public function test_same_host_origin_is_allowed(): void {
		$_SERVER['HTTP_ORIGIN'] = 'https://example.test';

		$this->assertFalse( $this->is_cross_site() );
	}

	public function test_host_comparison_ignores_case(): void {
		$_SERVER['HTTP_ORIGIN'] = 'https://EXAMPLE.test';

		$this->assertFalse( $this->is_cross_site() );
	}

	public function test_foreign_origin_is_refused_without_fetch_metadata(): void {
		$_SERVER['HTTP_ORIGIN'] = 'https://evil.test';

		$this->assertTrue( $this->is_cross_site() );
	}

	public function test_referer_is_checked_when_origin_is_absent(): void {
		$_SERVER['HTTP_REFERER'] = 'https://evil.test/attack.html';

		$this->assertTrue( $this->is_cross_site() );
	}

	public function test_same_host_referer_is_allowed(): void {
		$_SERVER['HTTP_REFERER'] = 'https://example.test/compose/';

		$this->assertFalse( $this->is_cross_site() );
	}

	/**
	 * Browsers send the literal string "null" for opaque origins (sandboxed
	 * frames, file://). That is not evidence of another site.
	 */
	public function test_opaque_origin_is_allowed(): void {
		$_SERVER['HTTP_ORIGIN'] = 'null';

		$this->assertFalse( $this->is_cross_site() );
	}

	public function test_fetch_metadata_wins_over_a_matching_origin(): void {
		$_SERVER['HTTP_SEC_FETCH_SITE'] = 'cross-site';
		$_SERVER['HTTP_ORIGIN']         = 'https://example.test';

		$this->assertTrue( $this->is_cross_site() );
	}
}
