/**
 * Publishing a status post through the front-end composer.
 */
const { test, expect, forceDelete } = require( '../fixtures' );
const { wp } = require( '../wp-cli' );

test.describe( 'Composer: status post', () => {
	test( 'publishes typed text as a post with a generated title and source terms', async ( {
		page,
		requestUtils,
		composerPage,
	} ) => {
		const text = `E2E status ${ Date.now() }`;
		let createdId = null;

		try {
			await page.goto( composerPage.link );

			const root = page.locator( '.quickpostr-composer-root' );
			await expect( root ).toBeVisible();

			const editor = root.locator( '.qp-rich-editor__content' );
			await editor.click();
			await page.keyboard.type( text );

			// exact: the title and date chips are also named "…post…".
			const submit = root.getByRole( 'button', {
				name: 'Post',
				exact: true,
			} );
			await expect( submit ).toBeEnabled();
			await submit.click();

			// The composer reloads the page once the post is created; the
			// REST lookup is the authoritative signal.
			await expect
				.poll(
					async () => {
						const posts = await requestUtils.rest( {
							path: '/wp/v2/posts',
							params: {
								search: text,
								per_page: 1,
								context: 'edit',
							},
						} );
						if ( posts.length ) {
							createdId = posts[ 0 ].id;
						}
						return posts.length;
					},
					{ timeout: 20_000 }
				)
				.toBe( 1 );

			const post = await requestUtils.rest( {
				path: `/wp/v2/posts/${ createdId }`,
				params: { context: 'edit' },
			} );

			expect( post.status ).toBe( 'publish' );
			expect( post.content.raw ).toContain( text );
			// Content under 55 characters becomes the title verbatim.
			expect( post.title.raw ).toBe( text );

			// The private quickpostr_source taxonomy has no REST surface.
			const terms = wp( [
				'post',
				'term',
				'list',
				String( createdId ),
				'quickpostr_source',
				'--field=slug',
			] ).split( /\s+/ );
			expect( terms ).toEqual(
				expect.arrayContaining( [ 'app', 'status' ] )
			);
		} finally {
			if ( createdId ) {
				await forceDelete( requestUtils, 'posts', createdId );
			}
		}
	} );
} );
