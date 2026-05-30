/**
 * QuickPostr service worker.
 *
 * Intentionally minimal: a service worker with a fetch handler is required for
 * PWA installability and for the Web Share Target to activate. QuickPostr has
 * no offline strategy — the fetch handler is a pass-through no-op. The shared
 * image itself is uploaded and handed off server-side (see class-manifest.php),
 * so the worker plays no part in moving the file.
 *
 * Served from the site root (/quickpostr-sw.js) so its scope covers the whole
 * site, which the share target needs to control the start_url.
 */

self.addEventListener( 'install', () => {
	self.skipWaiting();
} );

self.addEventListener( 'activate', ( event ) => {
	event.waitUntil( self.clients.claim() );
} );

// Pass-through fetch handler — present only to satisfy installability.
self.addEventListener( 'fetch', () => {} );
