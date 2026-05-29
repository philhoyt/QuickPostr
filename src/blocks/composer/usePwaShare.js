import { useState, useEffect } from '@wordpress/element';
import { getMedia } from './api.js';

/**
 * Hydrate the composer from a PWA-shared photo.
 *
 * After a photo is shared to QuickPostr, the share handler uploads it and
 * redirects to the composer page with ?qp_share=ATTACHMENT_ID. This hook reads
 * that param on mount, fetches the attachment, and returns a photo object in
 * the same shape PhotoComposer uses for library picks
 * ({ file, preview, mediaId, sourceUrl }), or null when there is nothing shared.
 *
 * The ?qp_share param is stripped from the URL immediately (whether or not it
 * resolves) so a refresh never re-triggers the hydration.
 *
 * @return {object|null} The shared photo object, or null.
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

		const id = parseInt( raw, 10 );
		if ( ! Number.isInteger( id ) || id <= 0 ) {
			return undefined;
		}

		let cancelled = false;
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

		return () => {
			cancelled = true;
		};
	}, [] );

	return sharedPhoto;
}
