/**
 * Run WP-CLI inside the E2E wp-env environment.
 *
 * For server-side assertions that have no REST surface, such as the private
 * quickpostr_source taxonomy. Output is returned trimmed; a non-zero exit
 * throws with WP-CLI's stderr.
 */
const { execFileSync } = require( 'node:child_process' );

/**
 * @param {string[]} args WP-CLI arguments, e.g. [ 'post', 'term', 'list', '12', 'quickpostr_source', '--field=slug' ].
 * @return {string} Trimmed stdout.
 */
function wp( args ) {
	return execFileSync( 'npx', [ 'wp-env', 'run', 'cli', 'wp', ...args ], {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} ).trim();
}

module.exports = { wp };
