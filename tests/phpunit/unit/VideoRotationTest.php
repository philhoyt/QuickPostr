<?php
/**
 * Unit tests for the rotated-video dimension fix.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use QuickPostr;

/**
 * QuickPostr::fix_rotated_video_dimensions().
 *
 * @covers QuickPostr::fix_rotated_video_dimensions
 */
final class VideoRotationTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Quarter turns swap width and height; anything else leaves them alone.
	 *
	 * @dataProvider rotations
	 *
	 * @param int  $rotate  Rotation reported by the file.
	 * @param bool $swapped Whether the dimensions should be swapped.
	 */
	public function test_quarter_turns_swap_dimensions( int $rotate, bool $swapped ): void {
		Functions\when( 'get_post_mime_type' )->justReturn( 'video/mp4' );
		// A zero rotation makes the code look at the file; there is none here.
		Functions\when( 'get_attached_file' )->justReturn( false );

		$metadata = array(
			'width'  => 1920,
			'height' => 1080,
			'rotate' => $rotate,
		);

		$result = ( new QuickPostr() )->fix_rotated_video_dimensions( $metadata, 42 );

		$this->assertSame( $swapped ? 1080 : 1920, $result['width'] );
		$this->assertSame( $swapped ? 1920 : 1080, $result['height'] );
	}

	public function rotations(): array {
		return array(
			'upright'               => array( 0, false ),
			'quarter clockwise'     => array( 90, true ),
			'quarter anticlockwise' => array( -90, true ),
			'upside down'           => array( 180, false ),
			'three quarters'        => array( 270, true ),
			'minus three quarters'  => array( -270, true ),
			'full turn'             => array( 360, false ),
		);
	}

	public function test_non_video_attachments_are_untouched(): void {
		Functions\when( 'get_post_mime_type' )->justReturn( 'image/jpeg' );

		$metadata = array(
			'width'  => 1920,
			'height' => 1080,
			'rotate' => 90,
		);

		$this->assertSame( $metadata, ( new QuickPostr() )->fix_rotated_video_dimensions( $metadata, 42 ) );
	}

	public function test_missing_rotation_reads_the_file_once(): void {
		Functions\when( 'get_post_mime_type' )->justReturn( 'video/mp4' );
		Functions\when( 'get_attached_file' )->justReturn( __FILE__ );
		Functions\expect( 'wp_read_video_metadata' )
			->once()
			->andReturn( array( 'rotate' => 90 ) );

		$result = ( new QuickPostr() )->fix_rotated_video_dimensions(
			array(
				'width'  => 1920,
				'height' => 1080,
			),
			42
		);

		$this->assertSame( 1080, $result['width'] );
		$this->assertSame( 1920, $result['height'] );
	}
}
