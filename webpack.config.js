const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

const outputPath = path.resolve( __dirname, 'blocks/composer/build' );

// Editor bundle — React and all @wordpress/* packages are externalized as WP globals.
// This is the block registration + edit.jsx entry, loaded only in the block editor.
const editorConfig = {
	...defaultConfig,
	entry: {
		index: path.resolve( __dirname, 'blocks/composer/src/index.js' ),
	},
	output: {
		...defaultConfig.output,
		path: outputPath,
	},
};

// View bundle — React and @wordpress/rich-text are bundled (not available as WP
// globals on the front end). All other @wordpress/* packages remain externalized.
const viewPlugins = ( defaultConfig.plugins ?? [] ).filter(
	( plugin ) => plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
);

const viewConfig = {
	...defaultConfig,
	entry: {
		'composer-view': path.resolve( __dirname, 'blocks/composer/src/composer-view.js' ),
	},
	output: {
		...defaultConfig.output,
		path: outputPath,
	},
	plugins: viewPlugins,
	// Bundle everything — no WP globals available on the front end for this entry.
	externals: {},
};

module.exports = [ editorConfig, viewConfig ];
