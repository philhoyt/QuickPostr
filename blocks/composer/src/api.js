/**
 * WordPress REST API wrapper.
 *
 * All requests are authenticated via the WP nonce injected by render.php.
 * No Application Passwords — the user is already logged in.
 */

const config = window.quickpostrConfig ?? {};

/**
 * @param {string} method
 * @param {string} path    — relative to restUrl, e.g. '/wp/v2/posts'
 * @param {object|null} body
 * @returns {Promise<any>}
 */
async function request( method, path, body = null ) {
	const url = ( config.restUrl ?? '' ).replace( /\/$/, '' ) + path;

	const headers = {
		'X-WP-Nonce': config.nonce ?? '',
	};

	const init = { method, headers, credentials: 'include' };

	if ( body !== null ) {
		headers[ 'Content-Type' ] = 'application/json';
		init.body = JSON.stringify( body );
	}

	const res = await fetch( url, init );

	if ( ! res.ok ) {
		let message = `HTTP ${ res.status }`;
		try {
			const data = await res.json();
			message = data.message ?? message;
		} catch ( _ ) {}
		throw new Error( message );
	}

	return res.json();
}

/**
 * Create a new post.
 *
 * @param {object} fields — post fields matching the WP REST posts schema.
 * @returns {Promise<object>} The created post object.
 */
export function createPost( fields ) {
	return request( 'POST', '/wp/v2/posts', fields );
}

/**
 * Upload a media file.
 *
 * @param {File} file
 * @returns {Promise<object>} The created media object (includes source_url).
 */
export async function uploadMedia( file ) {
	const url = ( config.restUrl ?? '' ).replace( /\/$/, '' ) + '/wp/v2/media';

	const res = await fetch( url, {
		method: 'POST',
		headers: {
			'X-WP-Nonce':        config.nonce ?? '',
			'Content-Disposition': `attachment; filename="${ encodeURIComponent( file.name ) }"`,
			'Content-Type':      file.type,
		},
		credentials: 'include',
		body: file,
	} );

	if ( ! res.ok ) {
		let message = `HTTP ${ res.status }`;
		try {
			const data = await res.json();
			message = data.message ?? message;
		} catch ( _ ) {}
		throw new Error( message );
	}

	return res.json();
}

/**
 * Search tags by name.
 *
 * @param {string} search
 * @returns {Promise<Array>}
 */
export function searchTags( search ) {
	const qs = new URLSearchParams( { search, per_page: '10', _fields: 'id,name' } );
	return request( 'GET', `/wp/v2/tags?${ qs }` );
}

/**
 * Fetch all categories.
 *
 * @returns {Promise<Array>}
 */
export function getCategories() {
	const qs = new URLSearchParams( { per_page: '100', _fields: 'id,name,parent' } );
	return request( 'GET', `/wp/v2/categories?${ qs }` );
}
