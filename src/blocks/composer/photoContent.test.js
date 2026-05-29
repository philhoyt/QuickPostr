/**
 * Unit tests for the single-photo content build/parse helpers.
 */
import {
	buildSinglePhotoContent,
	parseSinglePhotoContent,
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
} );

describe( 'parseSinglePhotoContent', () => {
	it( 'round-trips a built image-only post', () => {
		const built = buildSinglePhotoContent( 7, 'https://x/a.png', '' );
		expect( parseSinglePhotoContent( built ) ).toEqual( {
			mediaId: 7,
			mediaUrl: 'https://x/a.png',
			caption: '',
		} );
	} );

	it( 'round-trips a built image + caption post', () => {
		const built = buildSinglePhotoContent(
			9,
			'https://x/b.png',
			'Hello world'
		);
		expect( parseSinglePhotoContent( built ) ).toEqual( {
			mediaId: 9,
			mediaUrl: 'https://x/b.png',
			caption: 'Hello world',
		} );
	} );

	it( 'returns null when no image block is present', () => {
		expect(
			parseSinglePhotoContent(
				'<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->'
			)
		).toBeNull();
		expect( parseSinglePhotoContent( '' ) ).toBeNull();
		expect( parseSinglePhotoContent( null ) ).toBeNull();
	} );
} );
