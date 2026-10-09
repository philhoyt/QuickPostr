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

/** One `<br>` in any spelling. */
const BR = '<br\\s*\\/?>';

/** A blank line: two or more breaks, whitespace between them allowed. */
const PARAGRAPH_BREAK = new RegExp( `(?:${ BR }\\s*){2,}`, 'i' );

/** Breaks and whitespace at either end of a paragraph. */
const EDGE_BREAKS = new RegExp( `^(?:\\s|${ BR })+|(?:\\s|${ BR })+$`, 'gi' );

/** A block delimiter for anything other than core/paragraph. */
const FOREIGN_BLOCK = /<!--\s*\/?wp:(?!paragraph\b)/;

/**
 * Build serialized core/paragraph blocks from the editor's inline HTML.
 *
 * A blank line (two or more `<br>`) starts a new paragraph; a single `<br>`
 * stays inside the paragraph as a soft line break. Leading, trailing and
 * empty paragraphs are dropped.
 *
 * Pasted content is normalised first: HTML comments are removed so nothing
 * typed can inject a block delimiter, and `<p>` / `<div>` tags become breaks,
 * because `@wordpress/rich-text` keeps unknown elements and a nested `<p>`
 * would fail block validation.
 *
 * @param {string} html Editor HTML.
 * @return {string} Serialized block content, or '' when there is no text.
 */
export function buildStatusContent( html ) {
	const normalized = String( html ?? '' )
		.replace( /<!--[\s\S]*?(?:-->|$)/g, '' )
		.replace( /<\/?(?:p|div)(?:\s[^>]*)?>/gi, '<br>' );

	return normalized
		.split( PARAGRAPH_BREAK )
		.map( ( chunk ) => chunk.replace( EDGE_BREAKS, '' ) )
		.filter( Boolean )
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

	if (
		! raw.includes( BLOCK_OPEN ) ||
		FOREIGN_BLOCK.test( raw ) ||
		typeof window === 'undefined' ||
		typeof window.DOMParser === 'undefined'
	) {
		return raw;
	}

	const doc = new window.DOMParser().parseFromString( raw, 'text/html' );
	const nodes = Array.from( doc.body.childNodes );

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
