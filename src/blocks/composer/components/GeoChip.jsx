import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import useGeoLocation from '../hooks/useGeoLocation.js';
import useNominatimSearch from '../hooks/useNominatimSearch.js';

/**
 * Location control for the composer meta bar.
 *
 * The button is always mounted and acts purely as a toggle: click to open the
 * panel, click again to close it. It never unmounts, and opening it does not
 * commit anything — the attached location only changes when the user detects,
 * picks a result, or clears it.
 *
 * Detection lives inside the panel rather than on the button, so a failed or
 * blocked detect leaves the button exactly where it was. Note that browsers
 * refuse geolocation outside a secure context, so on an http:// site detect
 * always fails instantly with a permission error.
 *
 * Props:
 *   geoData          { lat, lng, place, address, active }
 *   onLocationSelect ({ lat, lng, place, address }) => void
 *   onDismiss        () => void
 * @param {Object}   root0
 * @param {object}   root0.geoData
 * @param {Function} root0.onLocationSelect
 * @param {Function} root0.onDismiss
 */
export default function GeoChip( { geoData, onLocationSelect, onDismiss } ) {
	const [ open, setOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const { detect, loading: detecting } = useGeoLocation();
	const { results, loading, hasSearched, search, clearResults } =
		useNominatimSearch();

	if ( ! window.quickpostrConfig?.geoTagrActive ) {
		return null;
	}

	const hasLocation =
		geoData?.active && ( geoData.lat !== null || !! geoData.place );
	const label = hasLocation
		? geoData.place || __( 'Location added', 'quickpostr' )
		: __( 'Location', 'quickpostr' );

	function handleToggle() {
		setOpen( ( isOpen ) => ! isOpen );
	}

	function commit( result ) {
		onLocationSelect( result );
		setQuery( '' );
		setError( '' );
		clearResults();
		setOpen( false );
	}

	async function handleDetect() {
		setError( '' );
		try {
			commit( await detect() );
		} catch ( err ) {
			let message = __(
				'Could not detect your location. Search for a place instead.',
				'quickpostr'
			);
			if ( err?.code === 1 ) {
				message = __(
					'Location permission denied. Search for a place instead.',
					'quickpostr'
				);
			} else if ( err?.code === 2 ) {
				message = __(
					'Location unavailable. Search for a place instead.',
					'quickpostr'
				);
			} else if ( err?.code === 3 ) {
				message = __(
					'Location request timed out. Search for a place instead.',
					'quickpostr'
				);
			} else if ( err?.message === 'geolocation-unavailable' ) {
				message = __(
					'Geolocation is not supported by your browser. Search for a place instead.',
					'quickpostr'
				);
			}
			setError( message );
		}
	}

	function handleSearchChange( event ) {
		const value = event.target.value;
		setQuery( value );
		const bias =
			geoData?.lat !== null && geoData?.lat !== undefined
				? { lat: geoData.lat, lng: geoData.lng }
				: null;
		search( value, bias );
	}

	function handleUseTypedName() {
		commit( {
			lat: geoData?.lat ?? null,
			lng: geoData?.lng ?? null,
			place: query.trim(),
			address: geoData?.address ?? '',
		} );
	}

	function handleClear() {
		setQuery( '' );
		setError( '' );
		clearResults();
		onDismiss();
	}

	function handleResultKeyDown( event, result ) {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			event.preventDefault();
			commit( result );
		}
	}

	return (
		<div className={ `qp-geo-chip${ open ? ' qp-geo-chip--open' : '' }` }>
			<div className="qp-geo-chip__header">
				<button
					type="button"
					className={ `qp-geo-button${
						hasLocation ? ' qp-geo-button--set' : ''
					}` }
					onClick={ handleToggle }
					aria-expanded={ open }
					aria-label={
						hasLocation
							? sprintf(
									/* translators: %s: the attached place name. */
									__( 'Location: %s. Change it.', 'quickpostr' ),
									label
							  )
							: __( 'Add location', 'quickpostr' )
					}
				>
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
					<span>{ label }</span>
				</button>
				{ hasLocation && (
					<button
						type="button"
						className="qp-geo-chip__clear"
						onClick={ handleClear }
						aria-label={ __( 'Remove location', 'quickpostr' ) }
					>
						&#x2715;
					</button>
				) }
			</div>

			{ open && (
				<div className="qp-geo-chip__panel">
					<button
						type="button"
						className="qp-geo-chip__detect"
						onClick={ handleDetect }
						disabled={ detecting }
					>
						{ detecting
							? __( 'Detecting…', 'quickpostr' )
							: __( 'Use my current location', 'quickpostr' ) }
					</button>

					{ error && (
						<p className="qp-geo-error" role="alert">
							{ error }
						</p>
					) }

					<div className="qp-geo-search">
						<input
							type="text"
							className="qp-geo-search__input"
							placeholder={ __(
								'Search for a place…',
								'quickpostr'
							) }
							value={ query }
							onChange={ handleSearchChange }
							aria-label={ __( 'Search location', 'quickpostr' ) }
						/>
					</div>

					{ loading && (
						<p className="qp-geo-search__loading" aria-live="polite">
							{ __( 'Searching…', 'quickpostr' ) }
						</p>
					) }

					{ ! loading &&
						hasSearched &&
						query.trim() &&
						results.length === 0 && (
							<p
								className="qp-geo-search__no-results"
								aria-live="polite"
							>
								{ __( 'No results found.', 'quickpostr' ) }
							</p>
						) }

					{ results.length > 0 && (
						<ul
							className="qp-geo-search__results"
							role="listbox"
							aria-label={ __(
								'Location suggestions',
								'quickpostr'
							) }
						>
							{ results.map( ( result, index ) => {
								const shortAddress = result.address
									.split( ',' )
									.slice( 0, 2 )
									.join( ',' )
									.trim();
								const optionLabel =
									result.place &&
									result.place !== shortAddress
										? `${ result.place } — ${ shortAddress }`
										: shortAddress;
								return (
									<li
										key={ index }
										className="qp-geo-search__result"
										role="option"
										aria-selected="false"
										tabIndex={ 0 }
										onClick={ () => commit( result ) }
										onKeyDown={ ( event ) =>
											handleResultKeyDown( event, result )
										}
									>
										{ optionLabel }
									</li>
								);
							} ) }
						</ul>
					) }

					{ query.trim() && (
						<button
							type="button"
							className={ `qp-geo-search__use-name${
								results.length > 0
									? ' qp-geo-search__use-name--has-results'
									: ''
							}` }
							onClick={ handleUseTypedName }
						>
							{ sprintf(
								/* translators: %s: typed place name */
								__( 'Use "%s" as place name', 'quickpostr' ),
								query.trim()
							) }
						</button>
					) }
				</div>
			) }
		</div>
	);
}
