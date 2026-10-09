/**
 * A logged-out visitor likes a post through the like dialog.
 */
const { test, expect } = require( '../fixtures' );

test.describe( 'Like: anonymous visitor', () => {
	// No admin cookies: this is the only public write path the plugin has.
	test.use( { storageState: { cookies: [], origins: [] } } );

	test( 'opens the dialog, validates the name, records one like', async ( {
		page,
		feedPage,
	} ) => {
		await page.goto( feedPage.page.link );

		const block = page.locator(
			`.qp-like-post[data-post-id="${ feedPage.post.id }"]`
		);
		const button = block.getByRole( 'button', { name: 'Like this post' } );
		const count = block.locator( '.qp-like-post__count' );

		await expect( count ).toHaveText( '0' );
		await expect( button ).toHaveAttribute( 'aria-haspopup', 'dialog' );
		await expect( button ).not.toHaveAttribute( 'aria-pressed', /.*/ );

		await button.click();

		const dialog = page.getByRole( 'dialog', { name: 'Like this post' } );
		await expect( dialog ).toBeVisible();

		// MicroModal moves focus into the dialog (its first control is the
		// close button); nothing outside it may keep focus.
		const focusInsideDialog = () =>
			page.evaluate( () => {
				const el = document.querySelector( '.qp-like-modal__dialog' );
				return !! el && el.contains( el.ownerDocument.activeElement );
			} );
		await expect.poll( focusInsideDialog ).toBe( true );

		// Submitting without a name sends nothing and puts focus on the field.
		await dialog.getByRole( 'button', { name: 'Like this post' } ).click();
		await expect( dialog.getByLabel( 'Name' ) ).toBeFocused();
		await expect( dialog ).toBeVisible();
		await expect( count ).toHaveText( '0' );

		await dialog.getByLabel( 'Name' ).fill( 'E2E Visitor' );
		await dialog.getByRole( 'button', { name: 'Like this post' } ).click();

		await expect( dialog ).toBeHidden();
		await expect( count ).toHaveText( '1' );
		await expect( button ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( button ).not.toHaveAttribute( 'aria-haspopup', /.*/ );

		// Dedupe: the same visitor cannot inflate the count by reloading.
		await page.reload();
		await expect( count ).toHaveText( '1' );
		await expect( button ).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );
