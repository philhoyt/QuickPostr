import { __ } from '@wordpress/i18n';
import useGeoLocation from '../hooks/useGeoLocation.js';

/**
 * Location-detect button for the composer toolbar.
 *
 * Calls navigator.geolocation → Nominatim reverse geocode on click.
 * Reports success via onGeoDetected({ lat, lng, place, address }) or
 * failure via onGeoError(message), which triggers manual override mode.
 *
 * Renders nothing when geoTagrActive is false so GeoTagr's absence is
 * completely invisible to users.
 *
 * Props:
 *   onGeoDetected ({ lat, lng, place, address }) => void
 *   onGeoError    (message: string) => void
 */
export default function GeoTagButton( { onGeoDetected, onGeoError } ) {
	const { detect, loading } = useGeoLocation();

	if ( ! window.quickpostrConfig?.geoTagrActive ) {
		return null;
	}

	async function handleClick() {
		try {
			const result = await detect();
			onGeoDetected( result );
		} catch ( err ) {
			let message = __( 'Could not detect your location. Enter an address below.', 'quickpostr' );
			if ( err?.code === 1 ) {
				message = __( 'Location permission denied. Enter an address below.', 'quickpostr' );
			} else if ( err?.code === 2 ) {
				message = __( 'Location unavailable. Enter an address below.', 'quickpostr' );
			} else if ( err?.code === 3 ) {
				message = __( 'Location request timed out. Enter an address below.', 'quickpostr' );
			} else if ( err?.message === 'geolocation-unavailable' ) {
				message = __( 'Geolocation is not supported by your browser. Enter an address below.', 'quickpostr' );
			}
			onGeoError( message );
		}
	}

	return (
		<button
			type="button"
			className="qp-geo-button"
			onClick={ handleClick }
			disabled={ loading }
			aria-label={ loading ? __( 'Detecting location…', 'quickpostr' ) : __( 'Add location', 'quickpostr' ) }
		>
			{ loading ? (
				<span className="qp-geo-button__spinner" aria-hidden="true" />
			) : (
				<svg
					className="qp-geo-button__icon"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
					<circle cx="12" cy="9" r="2.5" />
				</svg>
			) }
			<span>{ loading ? __( 'Detecting…', 'quickpostr' ) : __( 'Location', 'quickpostr' ) }</span>
		</button>
	);
}
