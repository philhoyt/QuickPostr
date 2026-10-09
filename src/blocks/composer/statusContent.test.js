/**
 * Unit tests for the status post content helpers.
 */
import {
	buildStatusContent,
	statusContentToEditorHtml,
} from './statusContent.js';

const block = ( inner ) =>
	`<!-- wp:paragraph -->\n<p>${ inner }</p>\n<!-- /wp:paragraph -->`;

describe( 'buildStatusContent', () => {
	it( 'wraps plain text in a single paragraph block', () => {
		expect( buildStatusContent( 'Hello world' ) ).toBe(
			block( 'Hello world' )
		);
	} );

	it( 'keeps inline formatting inside the paragraph', () => {
		const html = 'make <b>me</b> <i>bold</i> <a href="https://x">x</a>';
		expect( buildStatusContent( html ) ).toBe( block( html ) );
	} );

	it( 'keeps a single line break inside the paragraph', () => {
		expect( buildStatusContent( 'one<br>two' ) ).toBe(
			block( 'one<br>two' )
		);
	} );

	it( 'splits on a blank line into two paragraph blocks', () => {
		expect( buildStatusContent( 'one<br><br>two' ) ).toBe(
			`${ block( 'one' ) }\n\n${ block( 'two' ) }`
		);
	} );

	it( 'treats three or more breaks, and whitespace between them, as one split', () => {
		expect( buildStatusContent( 'one<br>\n<br/>\n<br >two' ) ).toBe(
			`${ block( 'one' ) }\n\n${ block( 'two' ) }`
		);
	} );

	it( 'drops leading and trailing breaks', () => {
		expect( buildStatusContent( '<br><br>one<br>' ) ).toBe(
			block( 'one' )
		);
		expect( buildStatusContent( '<br>one<br><br><br>' ) ).toBe(
			block( 'one' )
		);
	} );

	it( 'turns pasted paragraphs and divs into paragraph boundaries', () => {
		expect( buildStatusContent( '<p>one</p><p class="x">two</p>' ) ).toBe(
			`${ block( 'one' ) }\n\n${ block( 'two' ) }`
		);
		expect(
			buildStatusContent( '<div>one</div><div><br></div><div>two</div>' )
		).toBe( `${ block( 'one' ) }\n\n${ block( 'two' ) }` );
	} );

	it( 'balances an inline format that spans a blank line', () => {
		// Bold switched on, Enter twice, more text: the editor DOM holds one
		// <b> across the break. Each paragraph must close and reopen it.
		expect( buildStatusContent( 'a <b>one<br><br>two</b> b' ) ).toBe(
			`${ block( 'a <b>one</b>' ) }\n\n${ block( '<b>two</b> b' ) }`
		);
		expect( buildStatusContent( '<b>x <i>y<br><br>z</i></b>' ) ).toBe(
			`${ block( '<b>x <i>y</i></b>' ) }\n\n${ block(
				'<b><i>z</i></b>'
			) }`
		);
	} );

	it( 'keeps link attributes', () => {
		const html =
			'see <a href="https://x/?a=1&amp;b=2" target="_blank">x</a>';
		expect( buildStatusContent( html ) ).toBe( block( html ) );
	} );

	it( 'removes HTML comments so nothing typed can inject a delimiter', () => {
		expect(
			buildStatusContent( 'one<!-- /wp:paragraph --><!-- wp:html -->two' )
		).toBe( block( 'onetwo' ) );
		expect( buildStatusContent( 'one<!-- unterminated' ) ).toBe(
			block( 'one' )
		);
	} );

	it( 'returns an empty string when nothing remains', () => {
		expect( buildStatusContent( '' ) ).toBe( '' );
		expect( buildStatusContent( '<br><br>' ) ).toBe( '' );
		expect( buildStatusContent( null ) ).toBe( '' );
		expect( buildStatusContent( undefined ) ).toBe( '' );
	} );
} );

describe( 'statusContentToEditorHtml', () => {
	it( 'unwraps paragraph blocks into editor HTML', () => {
		const stored = `${ block( 'one <b>two</b>' ) }\n\n${ block(
			'three<br>four'
		) }`;
		expect( statusContentToEditorHtml( stored ) ).toBe(
			'one <b>two</b><br><br>three<br>four'
		);
	} );

	it( 'is stable across a build → unwrap → build round trip', () => {
		const html = 'one <b>two</b><br>three<br><br>four';
		const built = buildStatusContent( html );
		expect( buildStatusContent( statusContentToEditorHtml( built ) ) ).toBe(
			built
		);
	} );

	it( 'passes raw HTML from an earlier version through unchanged', () => {
		expect( statusContentToEditorHtml( 'one<br>two' ) ).toBe(
			'one<br>two'
		);
	} );

	it( 'passes content with a non-paragraph block through unchanged', () => {
		const mixed =
			block( 'one' ) +
			'\n\n<!-- wp:image {"id":1} --><figure class="wp-block-image"><img src="x"/></figure><!-- /wp:image -->';
		expect( statusContentToEditorHtml( mixed ) ).toBe( mixed );

		const selfClosing =
			block( 'one' ) + '\n\n<!-- wp:videomuxr/video {"id":"a"} /-->';
		expect( statusContentToEditorHtml( selfClosing ) ).toBe( selfClosing );
	} );

	it( 'passes content with text outside a paragraph through unchanged', () => {
		const stray = `${ block( 'one' ) }\nstray text`;
		expect( statusContentToEditorHtml( stray ) ).toBe( stray );
	} );

	it( 'treats null and undefined as empty', () => {
		expect( statusContentToEditorHtml( null ) ).toBe( '' );
		expect( statusContentToEditorHtml( undefined ) ).toBe( '' );
	} );
} );
