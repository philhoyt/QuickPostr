import { useState, useRef, useCallback } from '@wordpress/element';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const DEBOUNCE_MS = 300;

/**
 * Provider-aware forward geocode hook (debounced 300 ms).
 *
 * Reads window.quickpostrConfig.geoTagrGeocoding to determine which
 * geocoding backend to use:
 *  - google  → GeoTagr's server-side proxy (/geotagr/v1/geocode), returns 1 result
 *  - others  → Nominatim /search, returns up to 5 results
 *
 * Returns { results, loading, hasSearched, search, clearResults } where:
 *  - search(query) triggers a debounced geocode request
 *  - hasSearched becomes true after the first completed search (used to
 *    show "No results found" only after the user has actually searched)
 */
export default function useNominatimSearch() {
	const [ results, setResults ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ hasSearched, setHasSearched ] = useState( false );
	const timerRef = useRef( null );

	const search = useCallback( ( query ) => {
		clearTimeout( timerRef.current );

		if ( ! query.trim() ) {
			setResults( [] );
			setHasSearched( false );
			return;
		}

		timerRef.current = setTimeout( async () => {
			setLoading( true );
			setHasSearched( false );

			const geoConfig = window.quickpostrConfig?.geoTagrGeocoding;
			const provider = geoConfig?.provider ?? 'nominatim';

			try {
				if ( provider === 'google' && geoConfig?.proxyUrl ) {
					const url = new URL( geoConfig.proxyUrl );
					url.searchParams.set( 'type', 'forward' );
					url.searchParams.set( 'query', query );

					const res = await fetch( url.toString(), {
						headers: { 'X-WP-Nonce': geoConfig.nonce ?? '' },
					} );
					const data = await res.json();

					setResults(
						data && data.lat !== undefined
							? [
									{
										lat: data.lat,
										lng: data.lng,
										place: data.name || '',
										address: data.address || '',
									},
							  ]
							: []
					);
				} else {
					// Nominatim (default, also used as Mapbox fallback).
					const qs = new URLSearchParams( {
						q: query,
						format: 'json',
						limit: '5',
					} );
					const res = await fetch( `${ NOMINATIM }/search?${ qs }` );
					const data = await res.json();
					setResults(
						data.map( ( r ) => ( {
							lat: parseFloat( r.lat ),
							lng: parseFloat( r.lon ),
							place:
								r.name ||
								r.display_name.split( ',' )[ 0 ].trim() ||
								'',
							address: r.display_name,
						} ) )
					);
				}
			} catch ( _ ) {
				setResults( [] );
			} finally {
				setLoading( false );
				setHasSearched( true );
			}
		}, DEBOUNCE_MS );
	}, [] );

	const clearResults = useCallback( () => {
		setResults( [] );
		setHasSearched( false );
	}, [] );

	return { results, loading, hasSearched, search, clearResults };
}
