/**
 * Status post content helpers.
 *
 * The rich editor hands over flat inline HTML (`<b>`, `<i>`, `<a>`, `<br>`).
 * Stored as-is, WordPress treats it as a Classic block. These helpers wrap it
 * in core/paragraph blocks on the way out and unwrap it on draft resume, so
 * a status post is block-native like every other composer mode.
 */

const BLOCK_OPEN = '<!-- wp:paragraph -->';
const BLOCK_CLOSE = '<!-- /wp:paragraph -->';

/** A block delimiter for anything other than core/paragraph. */
const FOREIGN_BLOCK = /<!--\s*\/?wp:(?!paragraph\b)/;

/**
 * Parse an HTML fragment into a detached document body.
 *
 * @param {string} html Fragment.
 * @return {HTMLElement} The body element holding the fragment.
 */
function parseBody( html ) {
	return new window.DOMParser().parseFromString( html, 'text/html' ).body;
}

/**
 * The text nodes and `<br>` elements under a body, in document order. Inline
 * wrappers (`<b>`, `<a>`, …) are transparent: only these "atoms" decide where
 * a paragraph starts and ends.
 *
 * @param {HTMLElement} body Parsed body.
 * @return {Node[]} Atoms.
 */
function atomsOf( body ) {
	const walker = body.ownerDocument.createTreeWalker( body );
	const atoms = [];
	let node = walker.nextNode();
	while ( node ) {
		if ( node.nodeType === node.TEXT_NODE || node.nodeName === 'BR' ) {
			atoms.push( node );
		}
		node = walker.nextNode();
	}
	return atoms;
}

/**
 * Group atoms into paragraphs. A run of two or more `<br>` with nothing but
 * whitespace between them is a paragraph break; a single `<br>` stays inside
 * the paragraph. Each paragraph begins and ends on a non-blank text node, so
 * leading and trailing breaks are dropped and empty paragraphs never appear.
 *
 * @param {Node[]} atoms Atoms in document order.
 * @return {Array<[Text, Text]>} First and last text node of each paragraph.
 */
function paragraphBounds( atoms ) {
	const bounds = [];
	let first = null;
	let last = null;
	let breaks = 0;

	for ( const atom of atoms ) {
		if ( atom.nodeName === 'BR' ) {
			breaks++;
			continue;
		}
		if ( atom.data.trim() === '' ) {
			continue;
		}
		if ( breaks >= 2 && first ) {
			bounds.push( [ first, last ] );
			first = null;
		}
		breaks = 0;
		first = first ?? atom;
		last = atom;
	}

	if ( first ) {
		bounds.push( [ first, last ] );
	}

	return bounds;
}

/**
 * Reduce a parsed body to the markup between two text nodes, whitespace at
 * either end excluded. Range deletion keeps every ancestor that is only
 * partly covered, so a `<b>` spanning a paragraph break survives on both
 * sides as a properly closed element.
 *
 * @param {HTMLElement} body  Parsed body; mutated.
 * @param {Text}        first First text node of the paragraph.
 * @param {Text}        last  Last text node of the paragraph.
 * @return {string} Paragraph inner HTML.
 */
function cutParagraph( body, first, last ) {
	const doc = body.ownerDocument;

	const after = doc.createRange();
	after.setStart( last, last.data.trimEnd().length );
	after.setEnd( body, body.childNodes.length );
	after.deleteContents();

	const before = doc.createRange();
	before.setStart( body, 0 );
	before.setEnd( first, first.data.length - first.data.trimStart().length );
	before.deleteContents();

	return body.innerHTML;
}

/**
 * Build serialized core/paragraph blocks from the editor's inline HTML.
 *
 * A blank line (two or more `<br>`) starts a new paragraph; a single `<br>`
 * stays inside the paragraph as a soft line break. Leading, trailing and
 * empty paragraphs are dropped. An inline format that spans a blank line
 * (bold switched on, Enter twice, more text) is closed in one paragraph and
 * reopened in the next rather than leaving an unbalanced tag in each block.
 *
 * Pasted content is normalised first: HTML comments are removed so nothing
 * typed can inject a block delimiter, and `<p>` / `<div>` tags become breaks,
 * because a nested `<p>` would fail block validation.
 *
 * @param {string} html Editor HTML.
 * @return {string} Serialized block content, or '' when there is no text.
 */
export function buildStatusContent( html ) {
	const normalized = String( html ?? '' )
		.replace( /<!--[\s\S]*?(?:-->|$)/g, '' )
		.replace( /<\/?(?:p|div)(?:\s[^>]*)?>/gi, '<br>' );

	const bounds = paragraphBounds( atomsOf( parseBody( normalized ) ) );

	return bounds
		.map( ( bound, i ) => {
			// Each paragraph is cut from its own parse, so the atoms are
			// re-resolved by position rather than reused across mutations.
			const body = parseBody( normalized );
			const paragraphs = paragraphBounds( atomsOf( body ) );
			return cutParagraph( body, ...paragraphs[ i ] );
		} )
		.map(
			( text ) => `${ BLOCK_OPEN }\n<p>${ text }</p>\n${ BLOCK_CLOSE }`
		)
		.join( '\n\n' );
}

/**
 * Turn stored paragraph-block content back into editor HTML for draft resume.
 *
 * Only content made of nothing but core/paragraph blocks is unwrapped: the
 * paragraphs' inner HTML joined by a blank line. Anything else (a draft saved
 * as raw HTML by an earlier version, or one the user extended with other
 * blocks in wp-admin) is returned unchanged rather than losing content.
 *
 * @param {string} content Stored post content.
 * @return {string} Editor HTML.
 */
export function statusContentToEditorHtml( content ) {
	const raw = String( content ?? '' );

	if ( ! raw.includes( BLOCK_OPEN ) || FOREIGN_BLOCK.test( raw ) ) {
		return raw;
	}

	const nodes = Array.from( parseBody( raw ).childNodes );

	const hasStrayText = nodes.some(
		( node ) =>
			node.nodeType === node.TEXT_NODE && node.textContent.trim() !== ''
	);
	const paragraphs = nodes.filter(
		( node ) => node.nodeType === node.ELEMENT_NODE
	);

	if (
		hasStrayText ||
		! paragraphs.length ||
		paragraphs.some( ( el ) => el.tagName !== 'P' )
	) {
		return raw;
	}

	return paragraphs.map( ( p ) => p.innerHTML ).join( '<br><br>' );
}
