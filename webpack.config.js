const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path          = require( 'path' );

/**
 * Multi-block webpack config.
 *
 * Output path is `blocks/` with entry names that include the subdirectory,
 * so each block's build artifacts land in its own `build/` folder:
 *   composer/build/index.js
 *   delete-post/build/index.js
 *   …
 *
 * Block.json files reference `"file:./build/index.js"` (relative to their
 * own location), which resolves correctly without any changes.
 */
module.exports = {
	...defaultConfig,
	entry: async () => {
		const discovered =
			typeof defaultConfig.entry === 'function'
				? await defaultConfig.entry()
				: defaultConfig.entry ?? {};

		return {
			...discovered,
			// Composer block (existing).
			'composer/build/index':        path.resolve( __dirname, 'blocks/composer/src/index.js' ),
			'composer/build/composer-view': path.resolve( __dirname, 'blocks/composer/src/composer-view.js' ),
			// Phase 9 blocks.
			'delete-post/build/index':        path.resolve( __dirname, 'blocks/delete-post/src/index.js' ),
			'edit-post/build/index':          path.resolve( __dirname, 'blocks/edit-post/src/index.js' ),
			'profile-edit-name/build/index':  path.resolve( __dirname, 'blocks/profile-edit-name/src/index.js' ),
			'profile-edit-bio/build/index':   path.resolve( __dirname, 'blocks/profile-edit-bio/src/index.js' ),
		};
	},
	output: {
		...defaultConfig.output,
		// Root of all block build output. Entry names supply the subdirectories.
		path:     path.resolve( __dirname, 'blocks' ),
		filename: '[name].js',
		clean:    false,
	},
};
