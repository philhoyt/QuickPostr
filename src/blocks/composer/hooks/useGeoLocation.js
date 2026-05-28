import { useState } from '@wordpress/element';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/**
 * Hook wrapping the browser Geolocation API + Nominatim reverse geocode.
 *
 * Returns { detect, loading } where detect() is an async function that:
 *  - Requests the user's current position
 *  - Reverse-geocodes it via Nominatim
 *  - Returns { lat, lng, place, address } on success
 *  - Throws a GeolocationPositionError (with .code) on denial/failure
 */
export default function useGeoLocation() {
	const [ loading, setLoading ] = useState( false );

	async function detect() {
		if ( ! navigator.geolocation ) {
			throw new Error( 'geolocation-unavailable' );
		}

		setLoading( true );

		try {
			const position = await new Promise( ( resolve, reject ) => {
				navigator.geolocation.getCurrentPosition( resolve, reject, {
					timeout: 10000,
					maximumAge: 60000,
				} );
			} );

			const { latitude: lat, longitude: lng } = position.coords;

			const qs = new URLSearchParams( { lat, lon: lng, format: 'json' } );
			const res = await fetch( `${ NOMINATIM }/reverse?${ qs }` );
			const data = await res.json();

			const place =
				data.name ||
				( data.display_name
					? data.display_name.split( ',' )[ 0 ].trim()
					: '' );

			return {
				lat,
				lng,
				place,
				address: data.display_name || '',
			};
		} finally {
			setLoading( false );
		}
	}

	return { detect, loading };
}
