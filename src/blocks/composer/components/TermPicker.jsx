import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Typeahead picker for one flat taxonomy, with inline term creation.
 *
 * Tags and categories behave identically — the only differences are which REST
 * endpoints they hit and what the labels say — so both are this component with
 * different props rather than two copies of the same 160 lines.
 *
 * Selected ids are owned by the caller; the id → name map is resolved here,
 * from whatever the user picks plus a lookup for ids that arrive pre-selected
 * (the default category, or an existing post's terms).
 *
 * Props:
 *   selected  {number[]}          — selected term ids
 *   onChange  (ids: number[]) => void
 *   api       { search, create, get, getPopular } — the taxonomy's REST calls
 *   labels    { placeholder, searchLabel, removeLabel } — removeLabel is a
 *             printf format taking the term name, so it stays one literal
 *             string per taxonomy for translators
 *   chipModifier {string}         — extra class for the selected-term chips
 * @param {Object}   root0
 * @param {number[]} root0.selected
 * @param {Function} root0.onChange
 * @param {Object}   root0.api
 * @param {Object}   root0.labels
 * @param {string}   root0.chipModifier
 */
export default function TermPicker( {
	selected,
	onChange,
	api,
	labels,
	chipModifier = '',
} ) {
	const [ input, setInput ] = useState( '' );
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ names, setNames ] = useState( {} ); // id → name
	const [ open, setOpen ] = useState( false );
	const [ creating, setCreating ] = useState( false );
	const [ popular, setPopular ] = useState( [] );

	const timer = useRef( null );
	const wrapperRef = useRef( null );
	const inputRef = useRef( null );

	const { search, create, get, getPopular } = api;

	// Fetch the popular terms once on mount.
	useEffect( () => {
		getPopular()
			.then( ( results ) => setPopular( results ) )
			.catch( () => {} );
	}, [ getPopular ] );

	// Resolve names for any pre-selected ids.
	useEffect( () => {
		selected.forEach( ( id ) => {
			if ( ! names[ id ] ) {
				get( id )
					.then( ( term ) =>
						setNames( ( prev ) => ( {
							...prev,
							[ term.id ]: term.name,
						} ) )
					)
					.catch( () => {} );
			}
		} );
	}, [ selected ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Close the dropdown on an outside click. Clicking the sibling picker counts
	// as outside, so only one list is ever open.
	useEffect( () => {
		function handleClick( event ) {
			if (
				wrapperRef.current &&
				! wrapperRef.current.contains( event.target )
			) {
				setOpen( false );
			}
		}
		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [] );

	function handleFocus() {
		if ( input.trim().length < 2 && popular.length > 0 ) {
			setOpen( true );
		}
	}

	const handleInput = useCallback(
		( event ) => {
			const value = event.target.value;
			setInput( value );
			clearTimeout( timer.current );

			if ( value.trim().length < 2 ) {
				setSuggestions( [] );
				setOpen( popular.length > 0 );
				return;
			}

			setOpen( true );
			timer.current = setTimeout( async () => {
				try {
					setSuggestions( await search( value.trim() ) );
				} catch ( _ ) {}
			}, 250 );
		},
		[ popular, search ]
	);

	function addTerm( term ) {
		if ( ! selected.includes( term.id ) ) {
			setNames( ( prev ) => ( { ...prev, [ term.id ]: term.name } ) );
			onChange( [ ...selected, term.id ] );
		}
		setInput( '' );
		setSuggestions( [] );
		setOpen( false );
		setTimeout( () => inputRef.current?.focus(), 0 );
	}

	async function handleCreate( name ) {
		if ( creating ) {
			return;
		}
		setCreating( true );
		try {
			addTerm( await create( name ) );
		} catch ( _ ) {
		} finally {
			setCreating( false );
		}
	}

	function handleKeyDown( event ) {
		if ( event.key !== 'Enter' ) {
			return;
		}
		const trimmed = input.trim();
		if ( ! trimmed ) {
			return;
		}
		event.preventDefault();
		const exact = suggestions.find(
			( term ) => term.name.toLowerCase() === trimmed.toLowerCase()
		);
		if ( exact ) {
			addTerm( exact );
		} else if ( trimmed.length >= 2 ) {
			handleCreate( trimmed );
		}
	}

	function removeTerm( id ) {
		onChange( selected.filter( ( termId ) => termId !== id ) );
	}

	/**
	 * The trailing row of the search results: either "Already added" or a
	 * "Create" affordance, depending on what the typed text matches.
	 */
	function renderCreateRow() {
		const typed = input.trim();
		const lc = typed.toLowerCase();
		const exact = suggestions.find(
			( term ) => term.name.toLowerCase() === lc
		);
		const already = exact
			? selected.includes( exact.id )
			: Object.values( names ).some(
					( name ) => name.toLowerCase() === lc
			  );

		if ( already ) {
			return (
				<li
					role="option"
					aria-selected={ false }
					className="qp-tag-input__suggestion qp-tag-input__suggestion--already"
				>
					{ __( 'Already added', 'quickpostr' ) }
				</li>
			);
		}

		if ( exact ) {
			return null;
		}

		return (
			<li
				role="option"
				aria-selected={ false }
				className="qp-tag-input__suggestion qp-tag-input__suggestion--create"
				onMouseDown={ () => handleCreate( typed ) }
			>
				{ creating
					? __( 'Creating…', 'quickpostr' )
					: sprintf(
							/* translators: %s: the term name typed by the user */
							__( 'Create "%s"', 'quickpostr' ),
							typed
					  ) }
			</li>
		);
	}

	const showPopular = input.trim().length < 2;
	const shown = ( showPopular ? popular : suggestions ).filter(
		( term ) => ! selected.includes( term.id )
	);

	return (
		<div className="qp-tag-input__tags" ref={ wrapperRef }>
			{ selected.map( ( id ) => (
				<span key={ id } className={ `qp-tag-input__tag${ chipModifier }` }>
					{ names[ id ] ?? `#${ id }` }
					<button
						type="button"
						className="qp-tag-input__tag-remove"
						aria-label={ sprintf(
							labels.removeLabel,
							names[ id ] ?? id
						) }
						onClick={ () => removeTerm( id ) }
					>
						×
					</button>
				</span>
			) ) }
			<div className="qp-tag-input__search-wrap">
				<input
					ref={ inputRef }
					type="text"
					className="qp-tag-input__search"
					value={ input }
					onChange={ handleInput }
					onKeyDown={ handleKeyDown }
					onFocus={ handleFocus }
					onBlur={ () => setOpen( false ) }
					placeholder={ labels.placeholder }
					aria-label={ labels.searchLabel }
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={ open }
					disabled={ creating }
				/>
				{ open && (
					<ul
						className={ `qp-tag-input__suggestions${
							showPopular
								? ' qp-tag-input__suggestions--popular'
								: ''
						}` }
						role="listbox"
					>
						{ showPopular && (
							<li
								className="qp-tag-input__suggestion-header"
								role="presentation"
							>
								{ __( 'Popular', 'quickpostr' ) }
							</li>
						) }
						{ shown.map( ( term ) => (
							<li
								key={ term.id }
								role="option"
								aria-selected={ false }
								className="qp-tag-input__suggestion"
								onMouseDown={ () => addTerm( term ) }
							>
								{ term.name }
							</li>
						) ) }
						{ ! showPopular && renderCreateRow() }
					</ul>
				) }
			</div>
		</div>
	);
}
