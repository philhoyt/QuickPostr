import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useNominatimSearch from '../hooks/useNominatimSearch.js';

/**
 * Attached location chip — shows the resolved place name and a dismiss button.
 *
 * When geoData.lat is null (manual override mode) it renders an address
 * search input wired to Nominatim autocomplete instead of the place name.
 * Selecting a result calls onLocationSelect({ lat, lng, place, address }).
 *
 * Props:
 *   geoData         { lat, lng, place, address, active }
 *   errorMsg        string — shown above the search input in manual mode
 *   onDismiss       () => void
 *   onLocationSelect ({ lat, lng, place, address }) => void
 */
export default function LocationChip( { geoData, errorMsg, onDismiss, onLocationSelect } ) {
	const [ query, setQuery ] = useState( '' );
	const { results, loading, hasSearched, search, clearResults } = useNominatimSearch();

	const isManual = geoData.lat === null;

	function handleSearchChange( e ) {
		const value = e.target.value;
		setQuery( value );
		search( value );
	}

	function handleSelect( result ) {
		onLocationSelect( result );
		setQuery( '' );
		clearResults();
	}

	function handleDismiss() {
		setQuery( '' );
		clearResults();
		onDismiss();
	}

	function handleResultKeyDown( e, result ) {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			handleSelect( result );
		}
	}

	if ( ! isManual ) {
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
				<span className="qp-location-chip__place">{ geoData.place }</span>
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

	return (
		<div className="qp-location-chip qp-location-chip--manual">
			{ errorMsg && (
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
				<button
					type="button"
					className="qp-location-chip__dismiss"
					onClick={ handleDismiss }
					aria-label={ __( 'Cancel location', 'quickpostr' ) }
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
		</div>
	);
}
