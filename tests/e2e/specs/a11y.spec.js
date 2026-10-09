/**
 * Automated WCAG 2.1 A/AA checks with axe, scoped to the plugin's own markup.
 *
 * Scans are limited to the plugin's block wrappers and dialog so a theme
 * issue outside the plugin's control cannot fail the suite.
 */
const { AxeBuilder } = require( '@axe-core/playwright' );
const { test, expect } = require( '../fixtures' );

const TAGS = [ 'wcag2a', 'wcag2aa' ];

/**
 * Format violations so a failure names the rule and the offending node.
 *
 * @param {Array} violations axe violations.
 * @return {string} One line per violation with its offending nodes beneath.
 */
function describeViolations( violations ) {
	return violations
		.map(
			( v ) =>
				`${ v.id } (${ v.impact }): ${ v.help }\n` +
				v.nodes
					.map( ( n ) => `  - ${ n.target.join( ' ' ) }` )
					.join( '\n' )
		)
		.join( '\n' );
}

test.describe( 'Accessibility: composer (author)', () => {
	test( 'the composer block has no WCAG A/AA violations', async ( {
		page,
		composerPage,
	} ) => {
		await page.goto( composerPage.link );
		await expect(
			page.locator( '.quickpostr-composer-root' )
		).toBeVisible();

		const results = await new AxeBuilder( { page } )
			.withTags( TAGS )
			.include( '.wp-block-quickpostr-composer' )
			.analyze();

		expect(
			results.violations,
			describeViolations( results.violations )
		).toEqual( [] );
	} );
} );

test.describe( 'Accessibility: feed (visitor)', () => {
	test.use( { storageState: { cookies: [], origins: [] } } );

	test( 'the like and share blocks have no WCAG A/AA violations', async ( {
		page,
		feedPage,
	} ) => {
		await page.goto( feedPage.page.link );
		await expect(
			page.locator( '.wp-block-quickpostr-like-post' ).first()
		).toBeVisible();

		const results = await new AxeBuilder( { page } )
			.withTags( TAGS )
			.include( '.wp-block-quickpostr-like-post' )
			.include( '.wp-block-quickpostr-share-post' )
			.analyze();

		expect(
			results.violations,
			describeViolations( results.violations )
		).toEqual( [] );
	} );

	test( 'the open like dialog has no WCAG A/AA violations', async ( {
		page,
		feedPage,
	} ) => {
		await page.goto( feedPage.page.link );

		await page
			.locator( `.qp-like-post[data-post-id="${ feedPage.post.id }"]` )
			.getByRole( 'button', { name: 'Like this post' } )
			.click();
		await expect(
			page.getByRole( 'dialog', { name: 'Like this post' } )
		).toBeVisible();

		const results = await new AxeBuilder( { page } )
			.withTags( TAGS )
			.include( '.qp-like-modal' )
			.analyze();

		expect(
			results.violations,
			describeViolations( results.violations )
		).toEqual( [] );
	} );
} );
