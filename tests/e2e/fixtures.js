/**
 * Shared Playwright fixtures.
 *
 * Every fixture creates exactly what it needs over REST, remembers the IDs,
 * and deletes only those records afterwards. The E2E site doubles as the
 * manual-check site, so nothing here calls the destructive deleteAll* helpers.
 */
const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

const COMPOSER_BLOCK = '<!-- wp:quickpostr/composer /-->';

/**
 * A Query Loop in the shape of the quickpostr/post-feed pattern: each post
 * renders its actions menu, like button and share button. Kept minimal so a
 * theme change does not move the blocks the specs target.
 */
const FEED_BLOCKS = `<!-- wp:query {"queryId":1,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
<div class="wp-block-query"><!-- wp:post-template -->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:post-date /-->

<!-- wp:quickpostr/post-actions /--></div>
<!-- /wp:group -->

<!-- wp:post-content /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:quickpostr/like-post /-->

<!-- wp:quickpostr/share-post /--></div>
<!-- /wp:group -->
<!-- /wp:post-template --></div>
<!-- /wp:query -->`;

/**
 * Force-delete a post of any type by ID. Comments (likes) cascade.
 *
 * @param {import('@wordpress/e2e-test-utils-playwright').RequestUtils} requestUtils
 * @param {string}                                                      type         REST collection, e.g. 'posts' or 'pages'.
 * @param {number}                                                      id
 */
async function forceDelete( requestUtils, type, id ) {
	await requestUtils.rest( {
		method: 'DELETE',
		path: `/wp/v2/${ type }/${ id }`,
		params: { force: true },
	} );
}

const test = base.extend( {
	/**
	 * A published page containing only the composer block.
	 *
	 * @type {{ id: number, link: string }}
	 */
	composerPage: async ( { requestUtils }, provide ) => {
		// The composer autosaves a draft while typing and offers to resume it
		// on the next visit. A spec that failed mid-way leaves one behind, and
		// the banner then changes what the next spec sees. Clear only drafts
		// the suite itself created (their text starts with "E2E").
		const drafts = await requestUtils.rest( {
			path: '/wp/v2/posts',
			params: {
				status: 'draft',
				search: 'E2E',
				per_page: 100,
				context: 'edit',
			},
		} );
		for ( const draft of drafts ) {
			await forceDelete( requestUtils, 'posts', draft.id );
		}

		const page = await requestUtils.createPage( {
			title: 'E2E composer',
			content: COMPOSER_BLOCK,
			status: 'publish',
		} );

		await provide( { id: page.id, link: page.link } );

		await forceDelete( requestUtils, 'pages', page.id );
	},

	/**
	 * A published post plus a page rendering it through the feed blocks.
	 * `post.link` is the post, `page.link` is the feed.
	 *
	 * @type {{ post: { id: number, link: string }, page: { id: number, link: string } }}
	 */
	feedPage: async ( { requestUtils }, provide ) => {
		const post = await requestUtils.createPost( {
			title: 'E2E feed post',
			content:
				'<!-- wp:paragraph --><p>A post to like.</p><!-- /wp:paragraph -->',
			status: 'publish',
		} );
		const page = await requestUtils.createPage( {
			title: 'E2E feed',
			content: FEED_BLOCKS,
			status: 'publish',
		} );

		await provide( {
			post: { id: post.id, link: post.link },
			page: { id: page.id, link: page.link },
		} );

		await forceDelete( requestUtils, 'pages', page.id );
		await forceDelete( requestUtils, 'posts', post.id );
	},
} );

module.exports = { test, expect, COMPOSER_BLOCK, FEED_BLOCKS, forceDelete };
