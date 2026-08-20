/**
 * Auto-title generation — client-side preview only.
 *
 * The authoritative title is generated server-side in PHP via
 * QuickPostr::generate_title() in rest_after_insert_post. This mirrors it so
 * the composer's title field can show, as its placeholder, exactly what the
 * post will be called if the user types nothing.
 *
 * @param {'text'|'photo'|'gallery'|'video'|'link'} mode
 * @param {string}                                  text    — post content (plain text)
 * @param {string}                                  caption — caption for media modes
 * @param {string}                                  dateStr — date label for the empty-source fallback; defaults
 *                                                          to today in the browser's timezone. Callers should
 *                                                          pass titleDateString( postDate ) so a backdated
 *                                                          post previews its own date, the way PHP does.
 * @return {string} Generated post title.
 */
export function generateTitle( mode, text, caption, dateStr = '' ) {
	let date = dateStr;
	if ( ! date ) {
		const now = new Date();
		const month = now.toLocaleString( 'en-US', { month: 'short' } );
		date = `${ month } ${ now.getDate() }, ${ now.getFullYear() }`;
	}

	// Media modes title from the caption; everything else from the body.
	const usesCaption =
		mode === 'photo' || mode === 'gallery' || mode === 'video';
	const source = ( usesCaption ? caption : text ).trim();

	if ( ! source ) {
		// Labels mirror QuickPostr::generate_title() exactly.
		const labels = {
			photo: 'Photo',
			gallery: 'Gallery',
			video: 'Video',
			link: 'Link',
		};
		return `${ labels[ mode ] ?? 'Status' } — ${ date }`;
	}

	if ( source.length <= 55 ) {
		return source;
	}

	const truncated = source.slice( 0, 55 );
	const lastSpace = truncated.lastIndexOf( ' ' );
	return (
		( lastSpace > 30 ? truncated.slice( 0, lastSpace ) : truncated ) + '…'
	);
}
