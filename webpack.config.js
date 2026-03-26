const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path          = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: async () => {
		const discovered =
			typeof defaultConfig.entry === 'function'
				? await defaultConfig.entry()
				: defaultConfig.entry ?? {};

		return {
			...discovered,
			index:           path.resolve( __dirname, 'blocks/composer/src/index.js' ),
			'composer-view': path.resolve( __dirname, 'blocks/composer/src/composer-view.js' ),
		};
	},
	output: {
		...defaultConfig.output,
		// Output to blocks/composer/build/ so block.json file:./build/* paths work.
		path:  path.resolve( __dirname, 'blocks/composer/build' ),
		clean: false,
	},
};
