const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path          = require( 'path' );
const CopyPlugin    = require( 'copy-webpack-plugin' );

/**
 * Multi-block webpack config.
 *
 * Extends @wordpress/scripts defaults, which auto-discover block entry points
 * by scanning src/ for block.json files and compiling editorScript / viewScript
 * references into build/blocks/<block-name>/.
 *
 * We add entries that auto-discovery won't pick up:
 *   - composer/view.js  — the front-end React app (named handle, not file:)
 *   - delete-post/view.js, edit-post/view.js — vanilla JS view scripts (named handle)
 *
 * CSS files referenced as file: in block.json are copied via CopyPlugin (plain CSS,
 * no PostCSS transforms needed) so they land at build/blocks/<name>/<file>.css.
 */

// Extend the default CopyPlugin patterns to also copy block CSS files.
const defaultPlugins   = defaultConfig.plugins ?? [];
const defaultCopyIndex = defaultPlugins.findIndex( ( p ) => p.constructor?.name === 'CopyPlugin' );
const defaultPatterns  = defaultCopyIndex >= 0 ? defaultPlugins[ defaultCopyIndex ].patterns : [];
const extendedPlugins  = [ ...defaultPlugins ];

if ( defaultCopyIndex >= 0 ) {
	extendedPlugins[ defaultCopyIndex ] = new CopyPlugin( {
		patterns: [
			...defaultPatterns,
			{
				from: '**/*.css',
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
			'blocks/composer/view':    path.resolve( __dirname, 'src/blocks/composer/view.js' ),
			'blocks/delete-post/view': path.resolve( __dirname, 'src/blocks/delete-post/view.js' ),
			'blocks/edit-post/view':   path.resolve( __dirname, 'src/blocks/edit-post/view.js' ),
			'blocks/share-post/view':  path.resolve( __dirname, 'src/blocks/share-post/view.js' ),
		};
	},
};
