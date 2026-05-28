import { useState, useRef, useCallback } from '@wordpress/element';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const DEBOUNCE_MS = 300;

/**
 * Debounced Nominatim forward geocode hook.
 *
 * Returns { results, loading, search, clearResults } where:
 *  - search(query) triggers a debounced fetch (300 ms)
 *  - results is an array of { lat, lng, place, address }
 *  - clearResults() resets results to []
 */
export default function useNominatimSearch() {
	const [ results, setResults ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const timerRef = useRef( null );

	const search = useCallback( ( query ) => {
		clearTimeout( timerRef.current );

		if ( ! query.trim() ) {
			setResults( [] );
			return;
		}

		timerRef.current = setTimeout( async () => {
			setLoading( true );
			try {
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
			} catch ( _ ) {
				setResults( [] );
			} finally {
				setLoading( false );
			}
		}, DEBOUNCE_MS );
	}, [] );

	const clearResults = useCallback( () => setResults( [] ), [] );

	return { results, loading, search, clearResults };
}
