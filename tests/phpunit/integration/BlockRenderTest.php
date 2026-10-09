<?php
/**
 * Integration coverage for the dynamic blocks' render.php gates.
 *
 * Every block is server-rendered and decides who sees what from the current
 * user, so the gates are exercised here against a real user table rather than
 * by reading the files.
 *
 * @package QuickPostr
 */

namespace QuickPostr\Tests\Integration;

/**
 * Render gates for the composer, like-post and post-actions blocks.
 */
final class BlockRenderTest extends QuickPostrTestCase {

	/**
	 * Render a block by its serialized form.
	 *
	 * @param string $markup Block markup, e.g. '<!-- wp:quickpostr/composer /-->'.
	 * @return string
	 */
	private function render( string $markup ): string {
		$blocks = parse_blocks( $markup );
		return render_block( $blocks[0] );
	}

	/**
	 * Render a block inside a Query Loop context for the given post.
	 *
	 * @param string $name    Block name without namespace, e.g. 'like-post'.
	 * @param int    $post_id The post providing postId context.
	 * @return string
	 */
	private function render_for_post( string $name, int $post_id ): string {
		$block = new \WP_Block(
			array(
				'blockName'    => 'quickpostr/' . $name,
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array( 'postId' => $post_id )
		);
		return $block->render();
	}

	public function test_composer_renders_nothing_for_visitors(): void {
		wp_set_current_user( 0 );

		$this->assertSame( '', trim( $this->render( '<!-- wp:quickpostr/composer /-->' ) ) );
	}

	public function test_composer_renders_nothing_for_subscribers(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertSame( '', trim( $this->render( '<!-- wp:quickpostr/composer /-->' ) ) );
	}

	public function test_composer_is_hidden_from_roles_not_in_the_setting(): void {
		update_option( 'quickpostr_settings', array( 'allowed_roles' => array( 'administrator' ) ) );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );

		$this->assertSame( '', trim( $this->render( '<!-- wp:quickpostr/composer /-->' ) ) );
	}

	public function test_composer_renders_for_an_allowed_author(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );

		$html = $this->render( '<!-- wp:quickpostr/composer /-->' );

		$this->assertStringContainsString( 'quickpostr-composer-root', $html );

		// The inline config must not leak server-only settings.
		$inline = wp_scripts()->get_data( 'quickpostr-composer-view', 'before' );
		$config = implode( "\n", (array) $inline );
		$this->assertStringContainsString( 'quickpostrConfig', $config );
		$this->assertStringNotContainsString( 'allowed_roles', $config );
		$this->assertStringNotContainsString( 'hide_admin_bar', $config );
	}

	public function test_like_button_for_visitors_opens_a_dialog_and_is_not_a_toggle(): void {
		wp_set_current_user( 0 );
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$html = $this->render_for_post( 'like-post', $post_id );

		$this->assertStringContainsString( 'aria-haspopup="dialog"', $html );
		$this->assertStringNotContainsString( 'aria-pressed', $html );
		$this->assertStringContainsString( 'aria-label="Like this post"', $html );
	}

	public function test_like_button_for_users_is_a_pressed_toggle_with_a_constant_name(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$html = $this->render_for_post( 'like-post', $post_id );

		$this->assertStringContainsString( 'aria-pressed="false"', $html );
		$this->assertStringContainsString( 'aria-label="Like this post"', $html );
		$this->assertStringNotContainsString( 'Unlike', $html );
	}

	public function test_post_actions_render_nothing_when_front_end_edit_is_off(): void {
		update_option( 'quickpostr_settings', array( 'front_end_edit' => false ) );
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_author' => $author,
			)
		);
		wp_set_object_terms( $post_id, array( 'app' ), 'quickpostr_source' );
		wp_set_current_user( $author );

		$this->assertSame( '', trim( $this->render_for_post( 'post-actions', $post_id ) ) );
	}

	public function test_post_actions_toggle_is_a_disclosure_not_a_menu(): void {
		update_option( 'quickpostr_settings', array( 'front_end_edit' => true ) );
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_author' => $author,
			)
		);
		wp_set_object_terms( $post_id, array( 'app' ), 'quickpostr_source' );
		wp_set_current_user( $author );

		$html = $this->render_for_post( 'post-actions', $post_id );

		$this->assertStringContainsString( 'aria-expanded="false"', $html );
		$this->assertStringNotContainsString( 'aria-haspopup', $html );
		$this->assertStringContainsString( 'role="alert"', $html );
	}
}
