/**
 * WordPress REST API wrapper.
 *
 * All requests are authenticated via the WP nonce injected by render.php.
 * No Application Passwords — the user is already logged in.
 */

const config = window.quickpostrConfig ?? {};

/**
 * @param {string}      method
 * @param {string}      path   — relative to restUrl, e.g. '/wp/v2/posts'
 * @param {object|null} body
 * @return {Promise<any>} Parsed JSON response.
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
 * @param {Object} fields — post fields matching the WP REST posts schema.
 * @return {Promise<object>} The created post object.
 */
export function createPost( fields ) {
	return request( 'POST', '/wp/v2/posts', fields );
}

/**
 * Upload a media file.
 *
 * @param {File} file
 * @return {Promise<object>} The created media object (includes source_url).
 */
export async function uploadMedia( file ) {
	const url = ( config.restUrl ?? '' ).replace( /\/$/, '' ) + '/wp/v2/media';

	const res = await fetch( url, {
		method: 'POST',
		headers: {
			'X-WP-Nonce': config.nonce ?? '',
			'Content-Disposition': `attachment; filename="${ encodeURIComponent(
				file.name
			) }"`,
			'Content-Type': file.type,
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
 * Fetch the most-used tags, ordered by post count descending.
 *
 * @return {Promise<Array>} Popular tags.
 */
export function getPopularTags() {
	const qs = new URLSearchParams( {
		orderby: 'count',
		order: 'desc',
		per_page: '8',
		_fields: 'id,name',
	} );
	return request( 'GET', `/wp/v2/tags?${ qs }` );
}

/**
 * Fetch the most-used categories, ordered by post count descending.
 *
 * @return {Promise<Array>} Popular categories.
 */
export function getPopularCategories() {
	const qs = new URLSearchParams( {
		orderby: 'count',
		order: 'desc',
		per_page: '8',
		_fields: 'id,name',
	} );
	return request( 'GET', `/wp/v2/categories?${ qs }` );
}

/**
 * Search tags by name.
 *
 * @param {string} search
 * @return {Promise<Array>} Matching tags.
 */
export function searchTags( search ) {
	const qs = new URLSearchParams( {
		search,
		per_page: '10',
		_fields: 'id,name',
	} );
	return request( 'GET', `/wp/v2/tags?${ qs }` );
}

/**
 * Create a new tag.
 *
 * @param {string} name
 * @return {Promise<{id: number, name: string}>} Created tag.
 */
export function createTag( name ) {
	return request( 'POST', '/wp/v2/tags', { name } );
}

/**
 * Search categories by name.
 *
 *
 * @param {string} search
 * @return {Promise<Array>} Matching categories.
 */
export function searchCategories( search ) {
	const qs = new URLSearchParams( {
		search,
		per_page: '10',
		_fields: 'id,name',
	} );
	return request( 'GET', `/wp/v2/categories?${ qs }` );
}

/**
 * Create a new category.
 *
 * @param {string} name
 * @return {Promise<{id: number, name: string}>} Created category.
 */
export function createCategory( name ) {
	return request( 'POST', '/wp/v2/categories', { name } );
}

/**
 * Fetch a single category by ID.
 *
 * @param {number} id
 * @return {Promise<{id: number, name: string}>} Category object.
 */
export function getCategory( id ) {
	return request( 'GET', `/wp/v2/categories/${ id }?_fields=id,name` );
}

/**
 * Fetch a single post in edit context (raw content).
 *
 * @param {number} id
 * @return {Promise<object>} Post object in edit context.
 */
export function getPost( id ) {
	const qs = new URLSearchParams( {
		context: 'edit',
		_fields:
			'id,title,content,format,status,featured_media,tags,categories',
	} );
	return request( 'GET', `/wp/v2/posts/${ id }?${ qs }` );
}

/**
 * Fetch a single tag by ID.
 *
 * @param {number} id
 * @return {Promise<{id: number, name: string}>} Tag object.
 */
export function getTag( id ) {
	return request( 'GET', `/wp/v2/tags/${ id }?_fields=id,name` );
}

/**
 * Fetch the source URL for a media item.
 *
 * @param {number} id
 * @return {Promise<string>} Source URL of the media item.
 */
export async function getMediaUrl( id ) {
	const data = await request(
		'GET',
		`/wp/v2/media/${ id }?_fields=source_url`
	);
	return data.source_url ?? '';
}

/**
 * Update an existing post.
 *
 * @param {number} id
 * @param {Object} fields
 * @return {Promise<object>} Updated post object.
 */
export function updatePost( id, fields ) {
	return request( 'PUT', `/wp/v2/posts/${ id }`, fields );
}

/**
 * Return the current user's latest QuickPostr draft, or null if none.
 *
 * @return {Promise<object|null>} Draft post or null.
 */
export function getDraft() {
	return request( 'GET', '/quickpostr/v1/draft' );
}

/**
 * Permanently delete a draft post (move to trash).
 *
 * @param {number} id
 * @return {Promise<object>} Trashed post object.
 */
export function discardDraft( id ) {
	return request( 'DELETE', `/wp/v2/posts/${ id }` );
}

/**
 * Fetch Open Graph preview data via the Better Bookmarks REST endpoint.
 * Requires Better Bookmarks to be installed and active.
 *
 * @param {string} url
 * @return {Promise<{url, title, description, image, domain}>} Open Graph preview data.
 */
export function fetchLinkPreview( url ) {
	const qs = new URLSearchParams( { url } );
	return request( 'GET', `/better-bookmarks/v1/preview?${ qs }` );
}
