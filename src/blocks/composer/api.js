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
 * Create a new tag.
 *
 * @param {string} name
 * @returns {Promise<{id: number, name: string}>}
 */
export function createTag( name ) {
	return request( 'POST', '/wp/v2/tags', { name } );
}

/**
 * Search categories by name.
 *
 *
 * @param {string} search
 * @returns {Promise<Array>}
 */
export function searchCategories( search ) {
	const qs = new URLSearchParams( { search, per_page: '10', _fields: 'id,name' } );
	return request( 'GET', `/wp/v2/categories?${ qs }` );
}

/**
 * Create a new category.
 *
 * @param {string} name
 * @returns {Promise<{id: number, name: string}>}
 */
export function createCategory( name ) {
	return request( 'POST', '/wp/v2/categories', { name } );
}

/**
 * Fetch a single category by ID.
 *
 * @param {number} id
 * @returns {Promise<{id: number, name: string}>}
 */
export function getCategory( id ) {
	return request( 'GET', `/wp/v2/categories/${ id }?_fields=id,name` );
}

/**
 * Fetch a single post in edit context (raw content).
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getPost( id ) {
	const qs = new URLSearchParams( { context: 'edit', _fields: 'id,title,content,format,status,featured_media,tags,categories' } );
	return request( 'GET', `/wp/v2/posts/${ id }?${ qs }` );
}

/**
 * Fetch a single tag by ID.
 *
 * @param {number} id
 * @returns {Promise<{id: number, name: string}>}
 */
export function getTag( id ) {
	return request( 'GET', `/wp/v2/tags/${ id }?_fields=id,name` );
}

/**
 * Fetch the source URL for a media item.
 *
 * @param {number} id
 * @returns {Promise<string>}
 */
export async function getMediaUrl( id ) {
	const data = await request( 'GET', `/wp/v2/media/${ id }?_fields=source_url` );
	return data.source_url ?? '';
}

/**
 * Update an existing post.
 *
 * @param {number} id
 * @param {object} fields
 * @returns {Promise<object>}
 */
export function updatePost( id, fields ) {
	return request( 'PUT', `/wp/v2/posts/${ id }`, fields );
}

/**
 * Return the current user's latest QuickPostr draft, or null if none.
 *
 * @returns {Promise<object|null>}
 */
export function getDraft() {
	return request( 'GET', '/quickpostr/v1/draft' );
}

/**
 * Permanently delete a draft post (move to trash).
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
export function discardDraft( id ) {
	return request( 'DELETE', `/wp/v2/posts/${ id }` );
}

/**
 * Fetch Open Graph preview data via the Better Bookmarks REST endpoint.
 * Requires Better Bookmarks to be installed and active.
 *
 * @param {string} url
 * @returns {Promise<{url, title, description, image, domain}>}
 */
export function fetchLinkPreview( url ) {
	const qs = new URLSearchParams( { url } );
	return request( 'GET', `/better-bookmarks/v1/preview?${ qs }` );
}

