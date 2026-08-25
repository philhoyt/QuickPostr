import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useId,
} from '@wordpress/element';
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
 * Keyboard: the input is a combobox following the ARIA pattern — Down/Up move
 * through the list, Home/End jump to its ends, Enter takes the highlighted
 * option, Escape closes. Creating a term is always an explicit choice: Enter
 * with nothing highlighted commits only an exact existing match, never a new
 * term, because a typo followed by Enter used to add one permanently.
 *
 * Props:
 *   selected  {number[]}          — selected term ids
 *   onChange  (ids: number[]) => void
 *   api       { search, create, get, getPopular } — the taxonomy's REST calls
 *   labels    { label, placeholder, removeLabel } — removeLabel is a printf
 *             format taking the term name, so it stays one literal string per
 *             taxonomy for translators
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
	const [ searching, setSearching ] = useState( false );
	const [ popular, setPopular ] = useState( [] );
	const [ activeIndex, setActiveIndex ] = useState( -1 );

	const timer = useRef( null );
	const wrapperRef = useRef( null );
	const inputRef = useRef( null );
	const listRef = useRef( null );
	// Bumped per search so a slow response can't overwrite a newer one.
	const requestRef = useRef( 0 );

	const inputId = useId();
	const listId = useId();

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
				close();
			}
		}
		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [] );

	// ── What the list shows ───────────────────────────────────────────────────

	const typed = input.trim();
	const typedLc = typed.toLowerCase();

	// Below the search threshold the list is the popular terms, narrowed by
	// whatever has been typed so far — otherwise a single character left the
	// full unfiltered list sitting there.
	const showPopular = typed.length < 2;
	const source = showPopular
		? popular.filter( ( term ) =>
				term.name.toLowerCase().includes( typedLc )
		  )
		: suggestions;
	const available = source.filter( ( term ) => ! selected.includes( term.id ) );

	const exactMatch = showPopular
		? null
		: suggestions.find( ( term ) => term.name.toLowerCase() === typedLc );
	const alreadyAdded =
		! showPopular &&
		( exactMatch
			? selected.includes( exactMatch.id )
			: Object.values( names ).some(
					( name ) => name.toLowerCase() === typedLc
			  ) );
	const canCreate =
		! showPopular && ! searching && ! alreadyAdded && ! exactMatch;

	// The navigable rows, in render order. The header and the "Already added"
	// notice are not in here — neither can be chosen.
	const options = [
		...available.map( ( term ) => ( { type: 'term', term } ) ),
		...( canCreate ? [ { type: 'create' } ] : [] ),
	];

	const hasRows =
		options.length > 0 || ( ! showPopular && ( alreadyAdded || searching ) );
	const listOpen = open && hasRows;
	// Guards the gap between a keystroke shrinking the list and the next render.
	const active = activeIndex < options.length ? activeIndex : -1;

	// Keep the highlighted option in view when arrowing past the visible edge.
	useEffect( () => {
		if ( active < 0 ) {
			return;
		}
		listRef.current
			?.querySelectorAll( '[data-option]' )
			[ active ]?.scrollIntoView( { block: 'nearest' } );
	}, [ active ] );

	// ── Actions ───────────────────────────────────────────────────────────────

	function close() {
		setOpen( false );
		setActiveIndex( -1 );
	}

	function handleFocus() {
		setOpen( true );
	}

	const handleInput = useCallback(
		( event ) => {
			const value = event.target.value;
			setInput( value );
			setOpen( true );
			setActiveIndex( -1 );
			clearTimeout( timer.current );

			if ( value.trim().length < 2 ) {
				// Abandon any in-flight search so its result cannot land after
				// the field has already dropped back to the popular list.
				requestRef.current += 1;
				setSuggestions( [] );
				setSearching( false );
				return;
			}

			setSearching( true );
			timer.current = setTimeout( async () => {
				const requestId = ( requestRef.current += 1 );
				try {
					const results = await search( value.trim() );
					if ( requestId === requestRef.current ) {
						setSuggestions( results );
					}
				} catch ( _ ) {
				} finally {
					if ( requestId === requestRef.current ) {
						setSearching( false );
					}
				}
			}, 250 );
		},
		[ search ]
	);

	function addTerm( term ) {
		if ( ! selected.includes( term.id ) ) {
			setNames( ( prev ) => ( { ...prev, [ term.id ]: term.name } ) );
			onChange( [ ...selected, term.id ] );
		}
		setInput( '' );
		setSuggestions( [] );
		close();
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

	function activate( index ) {
		const option = options[ index ];
		if ( ! option ) {
			return;
		}
		if ( option.type === 'create' ) {
			handleCreate( typed );
		} else {
			addTerm( option.term );
		}
	}

	function handleKeyDown( event ) {
		switch ( event.key ) {
			case 'ArrowDown':
			case 'ArrowUp': {
				event.preventDefault();
				if ( ! listOpen ) {
					setOpen( true );
					return;
				}
				if ( options.length === 0 ) {
					return;
				}
				const step = event.key === 'ArrowDown' ? 1 : -1;
				setActiveIndex( ( current ) => {
					const next = ( current < 0 ? -1 : current ) + step;
					if ( next < 0 ) {
						return options.length - 1;
					}
					if ( next >= options.length ) {
						return 0;
					}
					return next;
				} );
				break;
			}
			case 'Home':
				if ( listOpen && options.length > 0 ) {
					event.preventDefault();
					setActiveIndex( 0 );
				}
				break;
			case 'End':
				if ( listOpen && options.length > 0 ) {
					event.preventDefault();
					setActiveIndex( options.length - 1 );
				}
				break;
			case 'Escape':
				if ( open ) {
					event.stopPropagation();
					close();
				}
				break;
			case 'Enter': {
				// Checked before anything else: arrowing through the popular
				// list and pressing Enter has to work with the field empty.
				if ( active >= 0 ) {
					event.preventDefault();
					activate( active );
					return;
				}
				if ( ! typed ) {
					return;
				}
				// Nothing highlighted: commit an exact existing match, but never
				// create. A new term takes choosing the "Create" row.
				if ( exactMatch && ! selected.includes( exactMatch.id ) ) {
					event.preventDefault();
					addTerm( exactMatch );
				}
				break;
			}
			default:
				break;
		}
	}

	function removeTerm( id ) {
		onChange( selected.filter( ( termId ) => termId !== id ) );
	}

	const optionId = ( index ) => `${ listId }-option-${ index }`;

	return (
		<div className="qp-tag-input__field" ref={ wrapperRef }>
			<label className="qp-tag-input__label" htmlFor={ inputId }>
				{ labels.label }
			</label>
			<div className="qp-tag-input__tags">
				{ selected.map( ( id ) => (
					<span
						key={ id }
						className={ `qp-tag-input__tag${ chipModifier }` }
					>
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
						id={ inputId }
						ref={ inputRef }
						type="text"
						className="qp-tag-input__search"
						value={ input }
						onChange={ handleInput }
						onKeyDown={ handleKeyDown }
						onFocus={ handleFocus }
						onBlur={ close }
						placeholder={ labels.placeholder }
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={ listOpen }
						aria-controls={ listId }
						aria-activedescendant={
							active >= 0 ? optionId( active ) : undefined
						}
						disabled={ creating }
					/>
					{ listOpen && (
						<ul
							id={ listId }
							ref={ listRef }
							className={ `qp-tag-input__suggestions${
								showPopular
									? ' qp-tag-input__suggestions--popular'
									: ''
							}` }
							role="listbox"
							aria-label={ labels.label }
						>
							{ showPopular && (
								<li
									className="qp-tag-input__suggestion-header"
									role="presentation"
								>
									{ __( 'Popular', 'quickpostr' ) }
								</li>
							) }
							{ options.map( ( option, index ) => {
								const isActive = index === active;
								const className = [
									'qp-tag-input__suggestion',
									option.type === 'create'
										? 'qp-tag-input__suggestion--create'
										: '',
									isActive
										? 'qp-tag-input__suggestion--active'
										: '',
								]
									.filter( Boolean )
									.join( ' ' );
								return (
									<li
										key={
											option.type === 'create'
												? 'create'
												: option.term.id
										}
										id={ optionId( index ) }
										data-option
										role="option"
										aria-selected={ isActive }
										className={ className }
										onMouseDown={ () => activate( index ) }
										onMouseEnter={ () =>
											setActiveIndex( index )
										}
									>
										{ option.type === 'create'
											? sprintf(
													/* translators: %s: the term name typed by the user */
													__(
														'Create "%s"',
														'quickpostr'
													),
													typed
											  )
											: option.term.name }
									</li>
								);
							} ) }
							{ searching && ! showPopular && (
								<li
									className="qp-tag-input__suggestion qp-tag-input__suggestion--status"
									role="presentation"
								>
									{ __( 'Searching…', 'quickpostr' ) }
								</li>
							) }
							{ creating && (
								<li
									className="qp-tag-input__suggestion qp-tag-input__suggestion--status"
									role="presentation"
								>
									{ __( 'Creating…', 'quickpostr' ) }
								</li>
							) }
							{ alreadyAdded && (
								<li
									className="qp-tag-input__suggestion qp-tag-input__suggestion--already"
									role="presentation"
								>
									{ __( 'Already added', 'quickpostr' ) }
								</li>
							) }
						</ul>
					) }
				</div>
			</div>
		</div>
	);
}
