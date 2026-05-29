/**
 * Unit tests for the single-photo content build/parse helpers.
 */
import { buildSinglePhotoContent } from './photoContent.js';

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
