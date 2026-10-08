<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- short name intentional; class is QuickPostr_Privacy.
/**
 * Personal-data tooling for QuickPostr.
 *
 * Likes are stored as comments, but core's comment exporter and eraser select
 * by comment_author_email only and anonymise rather than delete. That misses
 * a logged-in like that predates email being recorded on the row, and leaves
 * the IP hash behind in comment meta. This class registers an exporter and
 * eraser that find likes by user account as well as by email, and delete them
 * outright. It also owns the suggested privacy-policy text.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr_Privacy
 */
class QuickPostr_Privacy {

	/**
	 * Likes handled per exporter/eraser page.
	 */
	const PAGE_SIZE = 500;

	/**
	 * Register hooks.
	 *
	 * Priority 5 so the eraser runs before core's comment eraser (priority 10),
	 * which would otherwise blank the email and user_id first and leave the
	 * anonymised row for this eraser to miss.
	 */
	public function init(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'register_exporter' ), 5 );
		add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'register_eraser' ), 5 );
		add_action( 'admin_init', array( $this, 'add_privacy_policy_content' ) );
	}

	/**
	 * Register the likes exporter.
	 *
	 * @param array $exporters Registered exporters.
	 * @return array
	 */
	public function register_exporter( array $exporters ): array {
		$exporters['quickpostr-likes'] = array(
			'exporter_friendly_name' => __( 'QuickPostr likes', 'quickpostr' ),
			'callback'               => array( $this, 'export_likes' ),
		);
		return $exporters;
	}

	/**
	 * Register the likes eraser.
	 *
	 * @param array $erasers Registered erasers.
	 * @return array
	 */
	public function register_eraser( array $erasers ): array {
		$erasers['quickpostr-likes'] = array(
			'eraser_friendly_name' => __( 'QuickPostr likes', 'quickpostr' ),
			'callback'             => array( $this, 'erase_likes' ),
		);
		return $erasers;
	}

	/**
	 * Export every like belonging to an email address or its user account.
	 *
	 * @param string $email_address The requester's email.
	 * @param int    $page          1-based page.
	 * @return array{data: array, done: bool}
	 */
	public function export_likes( string $email_address, int $page = 1 ): array {
		$comments = $this->find_likes( $email_address, $page );
		$data     = array();

		foreach ( $comments as $comment ) {
			$post_title = get_the_title( (int) $comment->comment_post_ID );
			$permalink  = get_permalink( (int) $comment->comment_post_ID );

			$item = array(
				array(
					'name'  => __( 'Post', 'quickpostr' ),
					'value' => $post_title ? $post_title : (string) $comment->comment_post_ID,
				),
				array(
					'name'  => __( 'Post URL', 'quickpostr' ),
					'value' => $permalink ? $permalink : '',
				),
				array(
					'name'  => __( 'Liked on', 'quickpostr' ),
					'value' => $comment->comment_date,
				),
				array(
					'name'  => __( 'Name', 'quickpostr' ),
					'value' => $comment->comment_author,
				),
				array(
					'name'  => __( 'Email', 'quickpostr' ),
					'value' => $comment->comment_author_email,
				),
			);

			$data[] = array(
				'group_id'          => 'quickpostr-likes',
				'group_label'       => __( 'QuickPostr likes', 'quickpostr' ),
				'group_description' => __( 'Posts you liked through QuickPostr.', 'quickpostr' ),
				'item_id'           => 'quickpostr-like-' . $comment->comment_ID,
				'data'              => $item,
			);
		}

		return array(
			'data' => $data,
			'done' => count( $comments ) < self::PAGE_SIZE,
		);
	}

	/**
	 * Delete every like belonging to an email address or its user account.
	 *
	 * Deleting (rather than anonymising) is right here: an anonymised like is
	 * just a count with nothing left to attribute, and the like count is
	 * recomputed by the deleted_comment hook.
	 *
	 * @param string $email_address The requester's email.
	 * @param int    $page          1-based page.
	 * @return array{items_removed: int, items_retained: int, messages: array, done: bool}
	 */
	public function erase_likes( string $email_address, int $page = 1 ): array {
		// Always page 1: each pass deletes what it finds, so the next batch is
		// the new first page.
		unset( $page );
		$comments = $this->find_likes( $email_address, 1 );
		$removed  = 0;

		foreach ( $comments as $comment ) {
			if ( wp_delete_comment( (int) $comment->comment_ID, true ) ) {
				++$removed;
			}
		}

		return array(
			'items_removed'  => $removed,
			'items_retained' => 0,
			'messages'       => array(),
			'done'           => count( $comments ) < self::PAGE_SIZE,
		);
	}

	/**
	 * Find like comments for an email address: rows carrying that email and,
	 * when the address belongs to a user account, rows carrying that user ID.
	 *
	 * @param string $email_address The requester's email.
	 * @param int    $page          1-based page.
	 * @return \WP_Comment[]
	 */
	private function find_likes( string $email_address, int $page ): array {
		$email_address = sanitize_email( $email_address );
		if ( '' === $email_address ) {
			return array();
		}

		$base = array(
			'type'    => 'quickpostr_like',
			'status'  => 'any',
			'number'  => self::PAGE_SIZE,
			'offset'  => ( max( 1, $page ) - 1 ) * self::PAGE_SIZE,
			'orderby' => 'comment_ID',
			'order'   => 'ASC',
		);

		$by_email = get_comments( array_merge( $base, array( 'author_email' => $email_address ) ) );
		$found    = array();
		foreach ( $by_email as $comment ) {
			$found[ (int) $comment->comment_ID ] = $comment;
		}

		$user = get_user_by( 'email', $email_address );
		if ( $user instanceof \WP_User ) {
			$by_user = get_comments( array_merge( $base, array( 'user_id' => $user->ID ) ) );
			foreach ( $by_user as $comment ) {
				$found[ (int) $comment->comment_ID ] = $comment;
			}
		}

		// Paging is per source; cap so the caller's "done" test stays sound.
		return array_slice( array_values( $found ), 0, self::PAGE_SIZE );
	}

	/**
	 * Suggest privacy-policy text covering everything the plugin touches.
	 *
	 * @return void
	 */
	public function add_privacy_policy_content(): void {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$paragraphs = array(
			__( 'When you like a post, QuickPostr records that like so the count stays accurate and you are not counted twice. If you are logged in, the like is stored against your user account and email address. If you are not logged in, QuickPostr stores the name you enter, the email address you enter if you choose to provide one, and a one-way hash of your IP address. The hash is used only to recognise a repeat like on the same post — your IP address itself is not stored. Likes appear in the personal-data export and are deleted by an erasure request. The like button also remembers in your browser which posts you have liked.', 'quickpostr' ),
			__( 'If this site uses the location feature, authors can attach a place to a post. When you add a location, your browser may send your current coordinates or the place name you type to the configured geocoding provider (OpenStreetMap Nominatim, Google, or Mapbox) to look up an address; that provider sees your IP address and the location you searched. The resulting place name and coordinates are stored with the post and shown publicly.', 'quickpostr' ),
			__( 'Photos shared into the composer from a device share sheet are uploaded to this site before you publish. If you do not publish a post using the photo within 24 hours, it is deleted automatically. Photos uploaded through the composer have their camera metadata (including GPS coordinates) removed when the site has image stripping enabled and the image processing library is available; otherwise the metadata is kept with the file.', 'quickpostr' ),
			__( 'Likes are removed if the post they belong to is deleted, and all like records are removed if the plugin is uninstalled.', 'quickpostr' ),
		);

		$content = '';
		foreach ( $paragraphs as $paragraph ) {
			$content .= '<p>' . $paragraph . '</p>';
		}

		wp_add_privacy_policy_content(
			__( 'QuickPostr', 'quickpostr' ),
			wp_kses_post( wpautop( $content, false ) )
		);
	}
}
