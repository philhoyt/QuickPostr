/* eslint-disable import/no-extraneous-dependencies */
const wpPlugin = require( '@wordpress/eslint-plugin' );
const globals = require( 'globals' );
/* eslint-enable import/no-extraneous-dependencies */

module.exports = [
	{
		ignores: [ 'build/**', 'vendor/**', 'node_modules/**', 'lib/**' ],
	},
	...wpPlugin.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		rules: {
			// @wordpress/* packages are WordPress runtime externals — provided by WP, not locally installed
			'import/no-unresolved': [ 'error', { ignore: [ '^@wordpress/' ] } ],
			// Allow _ as catch variable in silent-catch blocks
			'no-unused-vars': [ 'error', { caughtErrors: 'none' } ],
		},
	},
	{
		// Jest unit tests run in Node with the jest preset's globals.
		files: [ '**/*.test.js' ],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
	},
];
