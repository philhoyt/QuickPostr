/**
 * Single-photo post content helper.
 *
 * A single photo is stored as a core/image block in post_content (matching the
 * per-image markup used by buildGalleryContent), optionally followed by a
 * caption paragraph — instead of a featured image.
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
