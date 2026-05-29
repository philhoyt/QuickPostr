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
 * Create a new post with geo metadata.
 *
 * Routes through /quickpostr/v1/posts which proxies to /wp/v2/posts and
 * additionally writes _geo_tagr_* post meta when GeoTagr is active.
 * Include geo_lat, geo_lng, geo_place, geo_address in fields.
 *
 * @param {Object} fields — post fields plus geo_lat, geo_lng, geo_place, geo_address.
 * @return {Promise<object>} The created post object.
 */
export function createGeoPost( fields ) {
	return request( 'POST', '/quickpostr/v1/posts', fields );
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
 * Request a Mux direct-upload URL from VideoMuxr.
 *
 * @return {Promise<{upload_id: string, upload_url: string}>} The Mux upload target.
 */
export function requestVideoMuxrUpload() {
	return request( 'POST', '/videomuxr/v1/direct-upload' );
}

/**
 * Upload a file directly to a Mux direct-upload URL via XHR PUT.
 *
 * The upload URL is a pre-signed storage endpoint — it takes the raw file body
 * and needs no WordPress auth header (auth was established when the URL was
 * created). XHR is used instead of fetch() for upload progress events.
 *
 * @param {string}   uploadUrl  The Mux direct-upload URL.
 * @param {File}     file       The video file.
 * @param {Function} onProgress Called with an integer percentage (0–100).
 * @return {Promise<void>} Resolves when the upload completes.
 */
export function uploadToMux( uploadUrl, file, onProgress ) {
	return new Promise( ( resolve, reject ) => {
		const xhr = new XMLHttpRequest();
		xhr.open( 'PUT', uploadUrl, true );
		xhr.setRequestHeader(
			'Content-Type',
			file.type || 'application/octet-stream'
		);

		xhr.upload.addEventListener( 'progress', ( e ) => {
			if ( e.lengthComputable && typeof onProgress === 'function' ) {
				onProgress( Math.round( ( e.loaded / e.total ) * 100 ) );
			}
		} );

		xhr.addEventListener( 'load', () => {
			if ( xhr.status >= 200 && xhr.status < 300 ) {
				resolve();
			} else {
				reject( new Error( `Upload failed (HTTP ${ xhr.status })` ) );
			}
		} );

		xhr.addEventListener( 'error', () =>
			reject( new Error( 'Upload failed — network error.' ) )
		);
		xhr.addEventListener( 'abort', () =>
			reject( new Error( 'Upload cancelled.' ) )
		);

		xhr.send( file );
	} );
}

/**
 * Poll VideoMuxr for the upload status until Mux finishes transcoding.
 *
 * Polls every 3 seconds, up to 60 attempts (~3 minutes), matching the
 * video-comments timeout. Resolves once the asset is ready.
 *
 * @param {string} uploadId The Mux upload ID returned by requestVideoMuxrUpload.
 * @return {Promise<{playbackId: string, assetId: string, aspectRatio: string}>} Ready asset details.
 */
export function pollVideoMuxrStatus( uploadId ) {
	const MAX_ATTEMPTS = 60;
	const INTERVAL_MS = 3000;

	return new Promise( ( resolve, reject ) => {
		let attempts = 0;

		const tick = async () => {
			attempts++;
			try {
				const qs = new URLSearchParams( { upload_id: uploadId } );
				const data = await request(
					'GET',
					`/videomuxr/v1/upload-status?${ qs }`
				);

				if ( data.status === 'errored' ) {
					reject( new Error( 'Mux could not process this video.' ) );
					return;
				}

				if ( data.status === 'ready' && data.playback_id ) {
					resolve( {
						playbackId: data.playback_id,
						assetId: data.asset_id ?? '',
						aspectRatio: data.aspect_ratio ?? '',
					} );
					return;
				}
			} catch ( err ) {
				reject( err );
				return;
			}

			if ( attempts >= MAX_ATTEMPTS ) {
				reject(
					new Error( 'Timed out waiting for the video to process.' )
				);
				return;
			}

			setTimeout( tick, INTERVAL_MS );
		};

		tick();
	} );
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
 * Update an existing post with geo metadata.
 *
 * Routes through /quickpostr/v1/posts/{id} which proxies to /wp/v2/posts/{id}
 * and additionally writes _geo_tagr_* post meta when GeoTagr is active.
 * Include geo_lat, geo_lng, geo_place, geo_address in fields.
 *
 * @param {number} id
 * @param {Object} fields — post fields plus geo_lat, geo_lng, geo_place, geo_address.
 * @return {Promise<object>} Updated post object.
 */
export function updateGeoPost( id, fields ) {
	return request( 'PUT', `/quickpostr/v1/posts/${ id }`, fields );
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
