/**
 * Single-photo post content helper.
 *
 * A single photo is stored as a core/image block in post_content (matching the
 * per-image markup used by buildGalleryContent), optionally followed by a
 * caption paragraph — instead of a featured image.
 */

/**
 * Escape a string for use inside a double-quoted HTML attribute.
 *
 * @param {string} value Raw text.
 * @return {string} Text safe to place between double quotes.
 */
export function escapeAttr( value ) {
	return String( value ?? '' )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Resolve the alt text for a published image: the user's alt text when given,
 * else the caption, else an empty string (decorative).
 *
 * @param {string} alt     Alt text the user typed for this image.
 * @param {string} caption The post caption, shared by every image in the post.
 * @return {string} Unescaped alt text.
 */
export function resolveAlt( alt, caption ) {
	const trimmedAlt = ( alt ?? '' ).trim();
	if ( trimmedAlt ) {
		return trimmedAlt;
	}
	return ( caption ?? '' ).trim();
}

/**
 * Build serialized content for a single-photo post: a core/image block plus an
 * optional caption paragraph.
 *
 * @param {number} mediaId  Attachment ID.
 * @param {string} mediaUrl Attachment source URL.
 * @param {string} caption  Optional caption text.
 * @param {string} alt      Optional alt text; falls back to the caption.
 * @return {string} Serialized block content.
 */
export function buildSinglePhotoContent(
	mediaId,
	mediaUrl,
	caption,
	alt = ''
) {
	const altAttr = escapeAttr( resolveAlt( alt, caption ) );
	const imageBlock =
		`<!-- wp:image {"id":${ mediaId },"sizeSlug":"large","linkDestination":"none"} -->\n` +
		`<figure class="wp-block-image size-large"><img src="${ mediaUrl }" alt="${ altAttr }" class="wp-image-${ mediaId }"/></figure>\n` +
		`<!-- /wp:image -->`;

	if ( ! caption.trim() ) {
		return imageBlock;
	}

	return (
		imageBlock +
		`\n<!-- wp:paragraph --><p>${ caption }</p><!-- /wp:paragraph -->`
	);
}
