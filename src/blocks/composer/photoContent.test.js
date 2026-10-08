/**
 * Unit tests for the single-photo content build/parse helpers.
 */
import {
	buildSinglePhotoContent,
	escapeAttr,
	resolveAlt,
} from './photoContent.js';

describe( 'buildSinglePhotoContent', () => {
	it( 'builds a core/image block with the attachment id and url', () => {
		const content = buildSinglePhotoContent( 42, 'https://x/img.jpg', '' );
		expect( content ).toContain( '<!-- wp:image {"id":42,' );
		expect( content ).toContain( 'src="https://x/img.jpg"' );
		expect( content ).toContain( 'class="wp-image-42"' );
		expect( content ).toContain( '<!-- /wp:image -->' );
	} );

	it( 'omits a caption paragraph when the caption is empty', () => {
		expect( buildSinglePhotoContent( 1, 'u', '' ) ).not.toContain(
			'wp:paragraph'
		);
		expect( buildSinglePhotoContent( 1, 'u', '   ' ) ).not.toContain(
			'wp:paragraph'
		);
	} );

	it( 'appends a caption paragraph when a caption is provided', () => {
		const content = buildSinglePhotoContent( 1, 'u', 'A nice sunset' );
		expect( content ).toContain(
			'<!-- wp:paragraph --><p>A nice sunset</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'writes an empty alt when neither alt nor caption is given', () => {
		expect( buildSinglePhotoContent( 1, 'u', '' ) ).toContain( 'alt=""' );
	} );

	it( 'uses the alt text when provided', () => {
		const content = buildSinglePhotoContent( 1, 'u', 'Caption', 'A dog' );
		expect( content ).toContain( 'alt="A dog"' );
	} );

	it( 'falls back to the caption when the alt is empty', () => {
		const content = buildSinglePhotoContent( 1, 'u', 'A nice sunset', '' );
		expect( content ).toContain( 'alt="A nice sunset"' );
	} );

	it( 'escapes the alt text for the attribute', () => {
		const content = buildSinglePhotoContent(
			1,
			'u',
			'',
			'Tom & "Jerry" <3'
		);
		expect( content ).toContain(
			'alt="Tom &amp; &quot;Jerry&quot; &lt;3"'
		);
	} );
} );

describe( 'escapeAttr', () => {
	it( 'replaces & < > and double quotes with entities', () => {
		expect( escapeAttr( '& < > "' ) ).toBe( '&amp; &lt; &gt; &quot;' );
	} );

	it( 'treats null and undefined as empty', () => {
		expect( escapeAttr( null ) ).toBe( '' );
		expect( escapeAttr( undefined ) ).toBe( '' );
	} );
} );

describe( 'resolveAlt', () => {
	it( 'prefers a non-empty alt', () => {
		expect( resolveAlt( 'alt', 'caption' ) ).toBe( 'alt' );
	} );

	it( 'falls back to the caption when the alt is blank', () => {
		expect( resolveAlt( '   ', 'caption' ) ).toBe( 'caption' );
		expect( resolveAlt( undefined, 'caption' ) ).toBe( 'caption' );
	} );

	it( 'returns an empty string when both are blank', () => {
		expect( resolveAlt( '', '  ' ) ).toBe( '' );
	} );
} );
