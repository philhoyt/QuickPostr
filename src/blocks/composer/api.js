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

/**
 * Fetch a single post in edit context (raw content).
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getPost( id ) {
	const qs = new URLSearchParams( { context: 'edit', _fields: 'id,title,content,format,status' } );
	return request( 'GET', `/wp/v2/posts/${ id }?${ qs }` );
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
 * Move a published post to the trash.
 *
 * @param {number} id
 * @returns {Promise<object>}
 */
export function deletePost( id ) {
	return request( 'DELETE', `/wp/v2/posts/${ id }` );
}

/**
 * Fetch a page of the current user's published posts.
 *
 * Returns `{ posts, totalPages }` where each post is normalized for PostCard.
 * Passes `format` to the REST API for server-side filtering when not 'all'.
 *
 * @param {object} opts
 * @param {string} [opts.format]   'all' | 'status' | 'photo'
 * @param {number} [opts.page]
 * @param {number} [opts.perPage]
 * @returns {Promise<{posts: Array, totalPages: number}>}
 */
export async function getFeed( { format = 'all', page = 1, perPage = 20 } = {} ) {
	const user = config.currentUser ?? {};
	const qs   = new URLSearchParams( {
		author:   String( user.id ?? '' ),
		per_page: String( perPage ),
		page:     String( page ),
		_embed:   'wp:featuredmedia',
	} );

	if ( format !== 'all' ) {
		qs.set( 'format', format === 'photo' ? 'image' : format );
	}

	const url = ( config.restUrl ?? '' ).replace( /\/$/, '' ) + '/wp/v2/posts?' + qs;

	const res = await fetch( url, {
		headers:     { 'X-WP-Nonce': config.nonce ?? '' },
		credentials: 'include',
	} );

	if ( ! res.ok ) {
		let message = `HTTP ${ res.status }`;
		try {
			const errData = await res.json();
			message = errData.message ?? message;
		} catch ( _ ) {}
		throw new Error( message );
	}

	const totalPages = parseInt( res.headers.get( 'X-WP-TotalPages' ) ?? '1', 10 );
	const raw        = await res.json();

	const posts = raw.map( ( post ) => ( {
		id:                 post.id,
		title:              post.title?.rendered ?? '',
		content:            post.content?.rendered ?? '',
		date_gmt:           post.date_gmt ?? '',
		status:             post.status,
		format:             post.format ?? 'standard',
		link:               post.link ?? '',
		featured_media_url: post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]?.source_url ?? '',
	} ) );

	return { posts, totalPages };
}
