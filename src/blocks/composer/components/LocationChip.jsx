import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import useNominatimSearch from '../hooks/useNominatimSearch.js';

/**
 * Attached location chip — shows the resolved place name and action buttons.
 *
 * Three render states:
 *  1. Chip view  (!isManual && !editing) — place name + Change + ×
 *  2. Edit mode  (!isManual && editing)  — search pre-filled with current place, Cancel + ×
 *  3. Manual mode (isManual)             — permission-denied path, search + ×
 *
 * Props:
 *   geoData         { lat, lng, place, address, active }
 *   errorMsg        string — shown in manual mode only
 *   onDismiss       () => void
 *   onLocationSelect ({ lat, lng, place, address }) => void
 */
export default function LocationChip( { geoData, errorMsg, onDismiss, onLocationSelect } ) {
	const [ query, setQuery ] = useState( '' );
	const [ editing, setEditing ] = useState( false );
	const { results, loading, hasSearched, search, clearResults } =
		useNominatimSearch();

	const isManual = geoData.lat === null;

	function handleSearchChange( e ) {
		const value = e.target.value;
		setQuery( value );
		search( value );
	}

	function handleSelect( result ) {
		onLocationSelect( result );
		setQuery( '' );
		setEditing( false );
		clearResults();
	}

	function handleUseTypedName() {
		onLocationSelect( {
			lat: geoData.lat,
			lng: geoData.lng,
			place: query.trim(),
			address: geoData.address,
		} );
		setQuery( '' );
		setEditing( false );
		clearResults();
	}

	function handleDismiss() {
		setQuery( '' );
		setEditing( false );
		clearResults();
		onDismiss();
	}

	function handleStartEdit() {
		setQuery( geoData.place );
		setEditing( true );
		search( geoData.place );
	}

	function handleCancelEdit() {
		setQuery( '' );
		setEditing( false );
		clearResults();
	}

	function handleResultKeyDown( e, result ) {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleSelect( result );
		}
	}

	// ── State 1: chip view ───────────────────────────────────────────────────
	if ( ! isManual && ! editing ) {
		return (
			<div className="qp-location-chip">
				<svg
					className="qp-location-chip__icon"
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
				<span className={ `qp-location-chip__place${ ! geoData.place ? ' qp-location-chip__place--empty' : '' }` }>
					{ geoData.place || __( 'Add a name…', 'quickpostr' ) }
				</span>
				<button
					type="button"
					className="qp-location-chip__edit"
					onClick={ handleStartEdit }
					aria-label={ __( 'Change location', 'quickpostr' ) }
				>
					{ __( 'Change', 'quickpostr' ) }
				</button>
				<button
					type="button"
					className="qp-location-chip__dismiss"
					onClick={ handleDismiss }
					aria-label={ __( 'Remove location', 'quickpostr' ) }
				>
					&#x2715;
				</button>
			</div>
		);
	}

	// ── States 2 & 3: edit mode or manual override ───────────────────────────
	return (
		<div className="qp-location-chip qp-location-chip--manual">
			{ errorMsg && ! editing && (
				<p className="qp-geo-error" role="alert">
					{ errorMsg }
				</p>
			) }
			<div className="qp-geo-search">
				{ /* eslint-disable-next-line jsx-a11y/no-autofocus */ }
				<input
					type="text"
					className="qp-geo-search__input"
					placeholder={ __( 'Search for a place…', 'quickpostr' ) }
					value={ query }
					onChange={ handleSearchChange }
					aria-label={ __( 'Search location', 'quickpostr' ) }
					autoFocus
				/>
				{ editing && (
					<button
						type="button"
						className="qp-location-chip__edit"
						onClick={ handleCancelEdit }
						aria-label={ __( 'Cancel location change', 'quickpostr' ) }
					>
						{ __( 'Cancel', 'quickpostr' ) }
					</button>
				) }
				<button
					type="button"
					className="qp-location-chip__dismiss"
					onClick={ handleDismiss }
					aria-label={ __( 'Remove location', 'quickpostr' ) }
				>
					&#x2715;
				</button>
			</div>
			{ loading && (
				<p className="qp-geo-search__loading" aria-live="polite">
					{ __( 'Searching…', 'quickpostr' ) }
				</p>
			) }
			{ ! loading && hasSearched && query.trim() && results.length === 0 && (
				<p className="qp-geo-search__no-results" aria-live="polite">
					{ __( 'No results found.', 'quickpostr' ) }
				</p>
			) }
			{ results.length > 0 && (
				<ul
					className="qp-geo-search__results"
					role="listbox"
					aria-label={ __( 'Location suggestions', 'quickpostr' ) }
				>
					{ results.map( ( r, i ) => {
						const shortAddress = r.address
							.split( ',' )
							.slice( 0, 2 )
							.join( ',' )
							.trim();
						const label =
							r.place && r.place !== shortAddress
								? `${ r.place } — ${ shortAddress }`
								: shortAddress;
						return (
							<li
								key={ i }
								className="qp-geo-search__result"
								role="option"
								aria-selected="false"
								tabIndex={ 0 }
								onClick={ () => handleSelect( r ) }
								onKeyDown={ ( e ) => handleResultKeyDown( e, r ) }
							>
								{ label }
							</li>
						);
					} ) }
				</ul>
			) }
			{ editing && ! isManual && query.trim() && (
				<button
					type="button"
					className={ `qp-geo-search__use-name${ results.length > 0 ? ' qp-geo-search__use-name--has-results' : '' }` }
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
	);
}
