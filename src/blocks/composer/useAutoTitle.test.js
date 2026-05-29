/**
 * Unit tests for generateTitle() — the client-side title preview.
 */
import { generateTitle } from './useAutoTitle.js';

describe( 'generateTitle', () => {
	it( 'returns a Status label + date when text is empty', () => {
		expect( generateTitle( 'text', '', '' ) ).toMatch( /^Status — / );
	} );

	it( 'returns a Photo label + date when caption is empty', () => {
		expect( generateTitle( 'photo', '', '' ) ).toMatch( /^Photo — / );
	} );

	it( 'uses the caption (not text) in photo mode', () => {
		expect(
			generateTitle( 'photo', 'ignored body', 'A nice sunset' )
		).toBe( 'A nice sunset' );
	} );

	it( 'returns short content verbatim', () => {
		expect( generateTitle( 'text', 'Just a quick thought', '' ) ).toBe(
			'Just a quick thought'
		);
	} );

	it( 'trims surrounding whitespace', () => {
		expect( generateTitle( 'text', '   hello   ', '' ) ).toBe( 'hello' );
	} );

	it( 'truncates long content on a word boundary with an ellipsis', () => {
		const content =
			'The quick brown fox jumps over the lazy dog and then keeps on running far away';
		expect( generateTitle( 'text', content, '' ) ).toBe(
			'The quick brown fox jumps over the lazy dog and then…'
		);
	} );

	it( 'hard-truncates unbroken content at 55 characters', () => {
		const content = 'a'.repeat( 80 );
		expect( generateTitle( 'text', content, '' ) ).toBe(
			'a'.repeat( 55 ) + '…'
		);
	} );

	it( 'matches the PHP generate_title() word-boundary behaviour', () => {
		// Parity check with QuickPostr::generate_title() in PHP.
		const content =
			'The quick brown fox jumps over the lazy dog and then keeps on running far away';
		const js = generateTitle( 'text', content, '' );
		expect( js.length ).toBeLessThanOrEqual( 56 ); // 55 + ellipsis
		expect( js.endsWith( '…' ) ).toBe( true );
	} );
} );
