<?php
/**
 * Unit tests for QuickPostr::generate_title().
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use QuickPostr;

/**
 * @covers QuickPostr::generate_title
 */
final class GenerateTitleTest extends TestCase {

	private QuickPostr $plugin;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// __() returns the string unchanged; wp_strip_all_tags strips tags;
		// wp_date is only hit on the empty-date fallback.
		Functions\when( '__' )->returnArg( 1 );
		Functions\when( 'wp_strip_all_tags' )->alias(
			static fn( $text ) => trim( (string) preg_replace( '/<[^>]*>/', '', (string) $text ) )
		);
		Functions\when( 'wp_date' )->justReturn( 'Jan 1, 2026' );

		$this->plugin = new QuickPostr();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_empty_content_status_uses_label_and_date(): void {
		$this->assertSame(
			'Status — May 29, 2026',
			$this->plugin->generate_title( '', 'status', 'May 29, 2026' )
		);
	}

	public function test_empty_content_photo_uses_photo_label(): void {
		$this->assertSame(
			'Photo — May 29, 2026',
			$this->plugin->generate_title( '   ', 'photo', 'May 29, 2026' )
		);
	}

	public function test_empty_content_video_uses_video_label(): void {
		$this->assertSame(
			'Video — May 29, 2026',
			$this->plugin->generate_title( '', 'video', 'May 29, 2026' )
		);
	}

	public function test_empty_date_falls_back_to_wp_date(): void {
		$this->assertSame(
			'Status — Jan 1, 2026',
			$this->plugin->generate_title( '', 'status', '' )
		);
	}

	public function test_short_content_returned_verbatim(): void {
		$this->assertSame(
			'Just a quick thought',
			$this->plugin->generate_title( 'Just a quick thought', 'status', 'May 29, 2026' )
		);
	}

	public function test_html_is_stripped_and_whitespace_collapsed(): void {
		$this->assertSame(
			'Hello world',
			$this->plugin->generate_title( "<p>Hello   \n world</p>", 'status', 'May 29, 2026' )
		);
	}

	public function test_long_content_truncates_on_word_boundary_with_ellipsis(): void {
		$content = 'The quick brown fox jumps over the lazy dog and then keeps on running far away';
		$title   = $this->plugin->generate_title( $content, 'status', 'May 29, 2026' );

		$this->assertStringEndsWith( '…', $title );
		// 55-char window is "The quick brown fox jumps over the lazy dog and then ke";
		// last space is well past index 30, so it trims to the last whole word.
		$this->assertSame( 'The quick brown fox jumps over the lazy dog and then…', $title );
	}

	public function test_long_unbroken_content_hard_truncates_at_55(): void {
		$content = str_repeat( 'a', 80 );
		$title   = $this->plugin->generate_title( $content, 'status', 'May 29, 2026' );

		$this->assertSame( str_repeat( 'a', 55 ) . '…', $title );
	}
}
