/* eslint-disable import/no-extraneous-dependencies */
const wpPlugin = require( '@wordpress/eslint-plugin' );
const globals = require( 'globals' );
/* eslint-enable import/no-extraneous-dependencies */

module.exports = [
	{
		ignores: [ 'build/**', 'vendor/**', 'node_modules/**', 'lib/**' ],
	},
	{
		// Flat config only matches *.js / *.mjs / *.cjs by default; opt the
		// block components in so the WordPress rules and prettier apply to JSX.
		files: [ '**/*.js', '**/*.jsx' ],
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
