const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const CopyPlugin = require( 'copy-webpack-plugin' );

/**
 * Multi-block webpack config.
 *
 * Extends @wordpress/scripts defaults, which auto-discover block entry points
 * by scanning src/ for block.json files and compiling editorScript / viewScript
 * references into build/blocks/<block-name>/.
 *
 * We add entries that auto-discovery won't pick up:
 *   - composer/view.js     — the front-end React app (named handle, not file:)
 *   - post-actions/view.js — vanilla JS view script (named handle)
 *   - share-post/view.js   — vanilla JS view script (named handle)
 *
 * CSS files referenced as file: in block.json are copied via CopyPlugin (plain CSS,
 * no PostCSS transforms needed) so they land at build/blocks/<name>/<file>.css.
 */

// Extend the default CopyPlugin patterns to also copy block CSS files.
const defaultPlugins = defaultConfig.plugins ?? [];
const defaultCopyIndex = defaultPlugins.findIndex(
	( p ) => p.constructor?.name === 'CopyPlugin'
);
const defaultPatterns =
	defaultCopyIndex >= 0 ? defaultPlugins[ defaultCopyIndex ].patterns : [];
const extendedPlugins = [ ...defaultPlugins ];

if ( defaultCopyIndex >= 0 ) {
	extendedPlugins[ defaultCopyIndex ] = new CopyPlugin( {
		patterns: [
			...defaultPatterns,
			{
				from: '**/*.css',
				context: 'src',
				noErrorOnMissing: true,
			},
			{
				// Service worker — copied verbatim (no bundling) so it lands at
				// build/pwa/quickpostr-sw.js and is served from the site root.
				from: 'pwa/*.js',
				context: 'src',
				noErrorOnMissing: true,
			},
		],
	} );
}

module.exports = {
	...defaultConfig,
	plugins: extendedPlugins,
	entry: async () => {
		const discovered =
			typeof defaultConfig.entry === 'function'
				? await defaultConfig.entry()
				: defaultConfig.entry ?? {};

		return {
			...discovered,
			'blocks/composer/view': path.resolve(
				__dirname,
				'src/blocks/composer/view.js'
			),
			'blocks/like-post/view': path.resolve(
				__dirname,
				'src/blocks/like-post/view.js'
			),
			'blocks/post-actions/view': path.resolve(
				__dirname,
				'src/blocks/post-actions/view.js'
			),
			'blocks/share-post/view': path.resolve(
				__dirname,
				'src/blocks/share-post/view.js'
			),
			'gallery-slider/view': path.resolve(
				__dirname,
				'src/gallery-slider/view.js'
			),
		};
	},
};
