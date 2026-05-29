import { useState, useEffect } from '@wordpress/element';
import { getMedia } from './api.js';

const SHARE_CACHE = 'quickpostr-share';
const SHARE_KEY = '/quickpostr-shared-file';

/**
 * Read the file the service worker stashed for a PWA share, then remove it
 * from the cache so it is consumed exactly once. Nothing is uploaded here —
 * the File rides along until the user publishes.
 *
 * @return {Promise<File|null>} The shared file, or null if none is stashed.
 */
async function readStashedFile() {
	if ( ! ( 'caches' in window ) ) {
		return null;
	}
	const cache = await caches.open( SHARE_CACHE );
	const res = await cache.match( SHARE_KEY );
	if ( ! res ) {
		return null;
	}
	await cache.delete( SHARE_KEY );
	const blob = await res.blob();
	const name = decodeURIComponent(
		res.headers.get( 'X-QP-Filename' ) || 'shared-image'
	);
	return new File( [ blob ], name, { type: blob.type } );
}

/**
 * Hydrate the composer from a PWA-shared photo.
 *
 * Two arrival paths, both flagged by the ?qp_share URL param:
 *
 *   ?qp_share=pending — the service worker stashed the shared file client-side
 *     (the normal path). The file is read from the cache and held for upload on
 *     publish, exactly like a file the user picked themselves
 *     ({ file, preview, mediaId: null, sourceUrl: null }).
 *
 *   ?qp_share=<id>    — the PHP fallback already uploaded the file (used only
 *     when no service worker was controlling the request). The attachment is
 *     fetched and shown like a media-library pick
 *     ({ file: null, preview, mediaId, sourceUrl }).
 *
 * The ?qp_share param is stripped immediately so a refresh never re-triggers.
 *
 * @return {object|null} The shared photo object, or null when nothing is shared.
 */
export default function usePwaShare() {
	const [ sharedPhoto, setSharedPhoto ] = useState( null );

	useEffect( () => {
		const params = new URLSearchParams( window.location.search );
		const raw = params.get( 'qp_share' );

		if ( raw === null ) {
			return undefined;
		}

		// Strip the param up front so a refresh can't re-trigger the load.
		params.delete( 'qp_share' );
		const qs = params.toString();
		const newUrl =
			window.location.pathname +
			( qs ? `?${ qs }` : '' ) +
			window.location.hash;
		window.history.replaceState( {}, '', newUrl );

		let cancelled = false;

		if ( raw === 'pending' ) {
			// Service-worker path: read the stashed file, upload on publish.
			readStashedFile()
				.then( ( file ) => {
					if ( cancelled || ! file ) {
						return;
					}
					setSharedPhoto( {
						file,
						preview: URL.createObjectURL( file ),
						mediaId: null,
						sourceUrl: null,
					} );
				} )
				.catch( () => {} );
		} else {
			// PHP fallback path: the attachment is already in the library.
			const id = parseInt( raw, 10 );
			if ( ! Number.isInteger( id ) || id <= 0 ) {
				return undefined;
			}
			getMedia( id )
				.then( ( media ) => {
					if ( cancelled ) {
						return;
					}
					const preview =
						media?.media_details?.sizes?.large?.source_url ??
						media?.source_url;
					if ( ! preview ) {
						return;
					}
					setSharedPhoto( {
						file: null,
						preview,
						mediaId: media.id,
						sourceUrl: media.source_url,
					} );
				} )
				.catch( () => {} );
		}

		return () => {
			cancelled = true;
		};
	}, [] );

	return sharedPhoto;
}
