/**
 * QuickPostr service worker.
 *
 * Two jobs:
 *
 * 1. PWA installability — a service worker with a fetch handler is required for
 *    the app to be installable and for the Web Share Target to activate.
 *
 * 2. Web Share Target receiver — intercepts the multipart POST the share sheet
 *    sends to /quickpostr-share/, stashes the shared image in the Cache API
 *    (client-side, nothing is uploaded), and redirects to the composer with
 *    ?qp_share=pending. The composer reads the file back, previews it, and
 *    uploads it to the media library ONLY when the user publishes — so a shared
 *    photo that is never posted never lands in the library.
 *
 * Served from the site root (/quickpostr-sw.js) so its scope covers the whole
 * site, which the share target needs to control the start_url.
 */

const SHARE_CACHE = 'quickpostr-share';
const SHARE_KEY = '/quickpostr-shared-file';

self.addEventListener( 'install', () => {
	self.skipWaiting();
} );

self.addEventListener( 'activate', ( event ) => {
	event.waitUntil( self.clients.claim() );
} );

self.addEventListener( 'fetch', ( event ) => {
	const { request } = event;

	// Only the share-target POST is handled; everything else passes through.
	if ( request.method !== 'POST' ) {
		return;
	}

	const url = new URL( request.url );
	if (
		! url.pathname.replace( /\/+$/, '' ).endsWith( '/quickpostr-share' )
	) {
		return;
	}

	event.respondWith( handleShare( request, url ) );
} );

/**
 * Stash the shared file in the cache and redirect to the composer.
 *
 * @param {Request} request The incoming share POST.
 * @param {URL}     url     The parsed request URL (carries the ?to= target).
 * @return {Promise<Response>} A redirect to the composer page.
 */
async function handleShare( request, url ) {
	const dest = buildDestination( url.searchParams.get( 'to' ) );

	try {
		const formData = await request.formData();
		const file = formData.get( 'media' );

		if ( file && file.size ) {
			const cache = await caches.open( SHARE_CACHE );
			const headers = new Headers();
			headers.set(
				'Content-Type',
				file.type || 'application/octet-stream'
			);
			headers.set(
				'X-QP-Filename',
				encodeURIComponent( file.name || 'shared-image' )
			);
			await cache.put( SHARE_KEY, new Response( file, { headers } ) );
		}
	} catch ( e ) {
		// Fall through to the redirect — the composer just opens empty.
	}

	return Response.redirect( dest, 303 );
}

/**
 * Build the same-origin composer URL to redirect to, flagged for hydration.
 *
 * The ?to= target comes from the manifest's share_target action. It is forced
 * same-origin to avoid an open redirect, falling back to the site root.
 *
 * @param {string|null} to The intended composer URL.
 * @return {string} An absolute URL with ?qp_share=pending appended.
 */
function buildDestination( to ) {
	let target;
	try {
		target = new URL( to || '/', self.location.origin );
		if ( target.origin !== self.location.origin ) {
			target = new URL( '/', self.location.origin );
		}
	} catch ( e ) {
		target = new URL( '/', self.location.origin );
	}
	target.searchParams.set( 'qp_share', 'pending' );
	return target.href;
}
