import { useState, useRef, useCallback } from '@wordpress/element';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const DEBOUNCE_MS = 300;

/**
 * Provider-aware forward geocode hook (debounced 300 ms).
 *
 * Reads window.quickpostrConfig.geoTagrGeocoding to determine which
 * geocoding backend to use:
 *  - google  → GeoTagr's server-side proxy (/geotagr/v1/geocode), returns up to 5 results
 *  - others  → Nominatim /search, returns up to 5 results
 *
 * search(query, bias) accepts an optional { lat, lng } bias object. When
 * provided and the provider is google, the coordinates are forwarded to the
 * GeoTagr proxy which passes them as a locationBias to the Places API,
 * ensuring results are anchored to the user's GPS location rather than the
 * server's IP.
 *
 * Returns { results, loading, hasSearched, search, clearResults } where:
 *  - search(query, bias?) triggers a debounced geocode request
 *  - hasSearched becomes true after the first completed search (used to
 *    show "No results found" only after the user has actually searched)
 */
export default function useNominatimSearch() {
	const [ results, setResults ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ hasSearched, setHasSearched ] = useState( false );
	const timerRef = useRef( null );

	const search = useCallback( ( query, bias = null ) => {
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
					if ( bias?.lat !== undefined && bias?.lng !== undefined ) {
						url.searchParams.set( 'lat', bias.lat );
						url.searchParams.set( 'lng', bias.lng );
					}

					const res = await fetch( url.toString(), {
						headers: { 'X-WP-Nonce': geoConfig.nonce ?? '' },
					} );
					const data = await res.json();
					let items = [];
					if ( Array.isArray( data ) ) {
						items = data;
					} else if ( data?.lat !== undefined ) {
						items = [ data ];
					}

					setResults(
						items.map( ( r ) => ( {
							lat: r.lat,
							lng: r.lng,
							place: r.name || '',
							address: r.address || '',
						} ) )
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
