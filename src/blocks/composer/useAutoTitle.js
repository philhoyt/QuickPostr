/**
 * Auto-title generation — client-side preview only.
 *
 * The authoritative title is generated server-side in PHP via
 * QuickPostr::generate_title() in rest_after_insert_post. This function is
 * used only for the live SlugPreview display in the composer.
 *
 * @param {'text'|'photo'} mode
 * @param {string} text    — post content (plain text)
 * @param {string} caption — photo caption (plain text)
 * @returns {string}
 */
export function generateTitle( mode, text, caption ) {
	const now     = new Date();
	const month   = now.toLocaleString( 'en-US', { month: 'short' } );
	const day     = now.getDate();
	const year    = now.getFullYear();
	const dateStr = `${ month } ${ day }, ${ year }`;

	const source = mode === 'photo'
		? caption.trim()
		: text.trim();

	if ( ! source ) {
		return mode === 'photo'
			? `Photo — ${ dateStr }`
			: `Status — ${ dateStr }`;
	}

	if ( source.length <= 55 ) {
		return source;
	}

	const truncated  = source.slice( 0, 55 );
	const lastSpace  = truncated.lastIndexOf( ' ' );
	return ( lastSpace > 30 ? truncated.slice( 0, lastSpace ) : truncated ) + '…';
}
