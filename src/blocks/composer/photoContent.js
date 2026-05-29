/**
 * Single-photo post content helpers.
 *
 * A single photo is stored as a core/image block in post_content (matching the
 * per-image markup used by buildGalleryContent), optionally followed by a
 * caption paragraph — instead of a featured image. These helpers build that
 * content on create/update and parse it back when editing.
 */

/**
 * Build serialized content for a single-photo post: a core/image block plus an
 * optional caption paragraph.
 *
 * @param {number} mediaId  Attachment ID.
 * @param {string} mediaUrl Attachment source URL.
 * @param {string} caption  Optional caption text.
 * @return {string} Serialized block content.
 */
export function buildSinglePhotoContent( mediaId, mediaUrl, caption ) {
	const imageBlock =
		`<!-- wp:image {"id":${ mediaId },"sizeSlug":"large","linkDestination":"none"} -->\n` +
		`<figure class="wp-block-image size-large"><img src="${ mediaUrl }" alt="" class="wp-image-${ mediaId }"/></figure>\n` +
		`<!-- /wp:image -->`;

	if ( ! caption.trim() ) {
		return imageBlock;
	}

	return (
		imageBlock +
		`\n<!-- wp:paragraph --><p>${ caption }</p><!-- /wp:paragraph -->`
	);
}

/**
 * Parse single-photo content produced by buildSinglePhotoContent().
 *
 * Uses a scoped regex over the known serialized format — the front-end composer
 * view does not load @wordpress/blocks, so full block parsing is unavailable.
 *
 * @param {string} rawContent Raw post content.
 * @return {{mediaId: number, mediaUrl: string, caption: string}|null}
 *         Parsed parts, or null when no core/image block is present.
 */
export function parseSinglePhotoContent( rawContent ) {
	if ( typeof rawContent !== 'string' ) {
		return null;
	}

	const idMatch = rawContent.match( /<!-- wp:image \{"id":(\d+)/ );
	if ( ! idMatch ) {
		return null;
	}

	const srcMatch = rawContent.match( /<img[^>]*\ssrc="([^"]*)"/ );
	const captionMatch = rawContent.match(
		/<!-- wp:paragraph --><p>([\s\S]*?)<\/p><!-- \/wp:paragraph -->/
	);

	return {
		mediaId: parseInt( idMatch[ 1 ], 10 ),
		mediaUrl: srcMatch ? srcMatch[ 1 ] : '',
		caption: captionMatch ? captionMatch[ 1 ] : '',
	};
}
