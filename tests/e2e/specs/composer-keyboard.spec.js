/**
 * Keyboard-only use of the composer: mode bar and formatting toolbar.
 *
 * The audit found the toolbar buttons only listened to mousedown and the
 * mode bar was half an ARIA tabs pattern. These specs hold the fixes in place.
 */
const { test, expect } = require( '../fixtures' );

test.describe( 'Composer: keyboard', () => {
	test( 'mode buttons are reachable with Tab and toggle with Space', async ( {
		page,
		composerPage,
	} ) => {
		await page.goto( composerPage.link );

		const modeBar = page.getByRole( 'group', { name: 'Post type' } );
		const status = modeBar.getByRole( 'button', { name: 'Status' } );
		const photo = modeBar.getByRole( 'button', { name: 'Photo' } );

		await expect( status ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( photo ).toHaveAttribute( 'aria-pressed', 'false' );

		// Land on the first mode button, then stay on the keyboard.
		await status.focus();
		await page.keyboard.press( 'Tab' );
		await expect( photo ).toBeFocused();

		await page.keyboard.press( 'Space' );
		await expect( photo ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( status ).toHaveAttribute( 'aria-pressed', 'false' );

		// No tab semantics: arrow keys are not required and nothing claims them.
		await expect( modeBar.locator( '[role="tab"]' ) ).toHaveCount( 0 );
	} );

	test( 'Bold applies from the toolbar button with Enter and reports aria-pressed', async ( {
		page,
		composerPage,
	} ) => {
		await page.goto( composerPage.link );

		const root = page.locator( '.quickpostr-composer-root' );
		const editor = root.locator( '.qp-rich-editor__content' );
		const bold = root.getByRole( 'button', { name: 'Bold' } );

		await editor.click();
		await page.keyboard.type( 'make me bold' );
		await page.keyboard.press( 'ControlOrMeta+A' );

		await expect( bold ).toHaveAttribute( 'aria-pressed', 'false' );

		// The toolbar sits before the editor in the tab order: Link, Italic,
		// Bold. Walk back to Bold with Shift+Tab, keeping the selection.
		await page.keyboard.press( 'Shift+Tab' );
		await page.keyboard.press( 'Shift+Tab' );
		await page.keyboard.press( 'Shift+Tab' );
		await expect( bold ).toBeFocused();
		await page.keyboard.press( 'Enter' );

		await expect( bold ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( editor ).toContainText( 'make me bold' );
		const html = await editor.innerHTML();
		expect( html ).toMatch( /<(strong|b)>/ );
	} );
} );
