import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	searchTags,
	createTag,
	getTag,
	searchCategories,
	createCategory,
	getCategory,
} from './api.js';

/**
 * Tag + category input with typeahead and inline creation.
 *
 * Props:
 *   selectedTags       {number[]}  — array of tag IDs
 *   selectedCategories {number[]}  — array of category IDs
 *   onTagsChange       (ids) => void
 *   onCategoriesChange (ids) => void
 * @param {Object}   root0
 * @param {number[]} root0.selectedTags
 * @param {number[]} root0.selectedCategories
 * @param {Function} root0.onTagsChange
 * @param {Function} root0.onCategoriesChange
 */
export default function TagInput( {
	selectedTags,
	selectedCategories,
	onTagsChange,
	onCategoriesChange,
} ) {
	// Tags state
	const [ tagInput, setTagInput ] = useState( '' );
	const [ tagSuggestions, setTagSuggestions ] = useState( [] );
	const [ tagNames, setTagNames ] = useState( {} ); // id → name
	const [ tagOpen, setTagOpen ] = useState( false );
	const [ creatingTag, setCreatingTag ] = useState( false );

	// Categories state
	const [ catInput, setCatInput ] = useState( '' );
	const [ catSuggestions, setCatSuggestions ] = useState( [] );
	const [ catNames, setCatNames ] = useState( {} ); // id → name
	const [ catOpen, setCatOpen ] = useState( false );
	const [ creatingCat, setCreatingCat ] = useState( false );

	const tagTimer = useRef( null );
	const catTimer = useRef( null );
	const wrapperRef = useRef( null );
	const tagInputRef = useRef( null );
	const catInputRef = useRef( null );

	// Resolve names for any pre-selected tags (e.g. when editing a post).
	useEffect( () => {
		selectedTags.forEach( ( id ) => {
			if ( ! tagNames[ id ] ) {
				getTag( id )
					.then( ( tag ) =>
						setTagNames( ( prev ) => ( {
							...prev,
							[ tag.id ]: tag.name,
						} ) )
					)
					.catch( () => {} );
			}
		} );
	}, [ selectedTags ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Resolve names for any pre-selected categories (e.g. default category or editing a post).
	useEffect( () => {
		selectedCategories.forEach( ( id ) => {
			if ( ! catNames[ id ] ) {
				getCategory( id )
					.then( ( cat ) =>
						setCatNames( ( prev ) => ( {
							...prev,
							[ cat.id ]: cat.name,
						} ) )
					)
					.catch( () => {} );
			}
		} );
	}, [ selectedCategories ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Close dropdowns on outside click.
	useEffect( () => {
		function handleClick( e ) {
			if (
				wrapperRef.current &&
				! wrapperRef.current.contains( e.target )
			) {
				setTagOpen( false );
				setCatOpen( false );
			}
		}
		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [] );

	// ── Tags ──────────────────────────────────────────────────────────────────

	const handleTagInput = useCallback( ( e ) => {
		const value = e.target.value;
		setTagInput( value );
		clearTimeout( tagTimer.current );

		if ( value.trim().length < 2 ) {
			setTagSuggestions( [] );
			setTagOpen( false );
			return;
		}

		setTagOpen( true );
		tagTimer.current = setTimeout( async () => {
			try {
				const results = await searchTags( value.trim() );
				setTagSuggestions( results );
			} catch ( _ ) {}
		}, 250 );
	}, [] );

	function addTag( tag ) {
		if ( ! selectedTags.includes( tag.id ) ) {
			setTagNames( ( prev ) => ( { ...prev, [ tag.id ]: tag.name } ) );
			onTagsChange( [ ...selectedTags, tag.id ] );
		}
		setTagInput( '' );
		setTagSuggestions( [] );
		setTagOpen( false );
		setTimeout( () => tagInputRef.current?.focus(), 0 );
	}

	async function handleCreateTag( name ) {
		if ( creatingTag ) {
			return;
		}
		setCreatingTag( true );
		try {
			const tag = await createTag( name );
			addTag( tag );
		} catch ( _ ) {
		} finally {
			setCreatingTag( false );
		}
	}

	function handleTagKeyDown( e ) {
		if ( e.key !== 'Enter' ) {
			return;
		}
		const trimmed = tagInput.trim();
		if ( ! trimmed ) {
			return;
		}
		e.preventDefault();
		const exact = tagSuggestions.find(
			( t ) => t.name.toLowerCase() === trimmed.toLowerCase()
		);
		if ( exact ) {
			addTag( exact );
		} else if ( trimmed.length >= 2 ) {
			handleCreateTag( trimmed );
		}
	}

	function removeTag( id ) {
		onTagsChange( selectedTags.filter( ( t ) => t !== id ) );
	}

	// ── Categories ────────────────────────────────────────────────────────────

	const handleCatInput = useCallback( ( e ) => {
		const value = e.target.value;
		setCatInput( value );
		clearTimeout( catTimer.current );

		if ( value.trim().length < 2 ) {
			setCatSuggestions( [] );
			setCatOpen( false );
			return;
		}

		setCatOpen( true );
		catTimer.current = setTimeout( async () => {
			try {
				const results = await searchCategories( value.trim() );
				setCatSuggestions( results );
			} catch ( _ ) {}
		}, 250 );
	}, [] );

	function addCategory( cat ) {
		if ( ! selectedCategories.includes( cat.id ) ) {
			setCatNames( ( prev ) => ( { ...prev, [ cat.id ]: cat.name } ) );
			onCategoriesChange( [ ...selectedCategories, cat.id ] );
		}
		setCatInput( '' );
		setCatSuggestions( [] );
		setCatOpen( false );
		setTimeout( () => catInputRef.current?.focus(), 0 );
	}

	async function handleCreateCategory( name ) {
		if ( creatingCat ) {
			return;
		}
		setCreatingCat( true );
		try {
			const cat = await createCategory( name );
			addCategory( cat );
		} catch ( _ ) {
		} finally {
			setCreatingCat( false );
		}
	}

	function handleCatKeyDown( e ) {
		if ( e.key !== 'Enter' ) {
			return;
		}
		const trimmed = catInput.trim();
		if ( ! trimmed ) {
			return;
		}
		e.preventDefault();
		const exact = catSuggestions.find(
			( c ) => c.name.toLowerCase() === trimmed.toLowerCase()
		);
		if ( exact ) {
			addCategory( exact );
		} else if ( trimmed.length >= 2 ) {
			handleCreateCategory( trimmed );
		}
	}

	function removeCategory( id ) {
		onCategoriesChange( selectedCategories.filter( ( c ) => c !== id ) );
	}

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="qp-tag-input" ref={ wrapperRef }>
			{ /* Tags */ }
			<div className="qp-tag-input__tags">
				{ selectedTags.map( ( id ) => (
					<span key={ id } className="qp-tag-input__tag">
						{ tagNames[ id ] ?? `#${ id }` }
						<button
							type="button"
							className="qp-tag-input__tag-remove"
							aria-label={ sprintf(
								/* translators: %s: tag name */
								__( 'Remove tag %s', 'quickpostr' ),
								tagNames[ id ] ?? id
							) }
							onClick={ () => removeTag( id ) }
						>
							×
						</button>
					</span>
				) ) }
				<div className="qp-tag-input__search-wrap">
					<input
						ref={ tagInputRef }
						type="text"
						className="qp-tag-input__search"
						value={ tagInput }
						onChange={ handleTagInput }
						onKeyDown={ handleTagKeyDown }
						placeholder={ __( 'Add tags…', 'quickpostr' ) }
						aria-label={ __( 'Search tags', 'quickpostr' ) }
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={ tagOpen }
						disabled={ creatingTag }
					/>
					{ tagOpen && (
						<ul
							className="qp-tag-input__suggestions"
							role="listbox"
						>
							{ tagSuggestions
								.filter(
									( tag ) => ! selectedTags.includes( tag.id )
								)
								.map( ( tag ) => (
									<li
										key={ tag.id }
										role="option"
										aria-selected={ false }
										className="qp-tag-input__suggestion"
										onMouseDown={ () => addTag( tag ) }
									>
										{ tag.name }
									</li>
								) ) }
							{ ( () => {
								const lc = tagInput.trim().toLowerCase();
								const exact = tagSuggestions.find(
									( t ) => t.name.toLowerCase() === lc
								);
								const already = exact
									? selectedTags.includes( exact.id )
									: Object.entries( tagNames ).some(
											( [ , n ] ) =>
												n.toLowerCase() === lc
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
								if ( ! exact ) {
									return (
										<li
											role="option"
											aria-selected={ false }
											className="qp-tag-input__suggestion qp-tag-input__suggestion--create"
											onMouseDown={ () =>
												handleCreateTag(
													tagInput.trim()
												)
											}
										>
											{ creatingTag
												? __( 'Creating…', 'quickpostr' )
												: sprintf(
													/* translators: %s: tag name */
													__( 'Create "%s"', 'quickpostr' ),
													tagInput.trim()
												) }
										</li>
									);
								}
								return null;
							} )() }
						</ul>
					) }
				</div>
			</div>

			{ /* Categories */ }
			<div className="qp-tag-input__tags">
				{ selectedCategories.map( ( id ) => (
					<span
						key={ id }
						className="qp-tag-input__tag qp-tag-input__tag--cat"
					>
						{ catNames[ id ] ?? `#${ id }` }
						<button
							type="button"
							className="qp-tag-input__tag-remove"
							aria-label={ sprintf(
								/* translators: %s: category name */
								__( 'Remove category %s', 'quickpostr' ),
								catNames[ id ] ?? id
							) }
							onClick={ () => removeCategory( id ) }
						>
							×
						</button>
					</span>
				) ) }
				<div className="qp-tag-input__search-wrap">
					<input
						ref={ catInputRef }
						type="text"
						className="qp-tag-input__search"
						value={ catInput }
						onChange={ handleCatInput }
						onKeyDown={ handleCatKeyDown }
						placeholder={ __( 'Add categories…', 'quickpostr' ) }
						aria-label={ __( 'Search categories', 'quickpostr' ) }
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={ catOpen }
						disabled={ creatingCat }
					/>
					{ catOpen && (
						<ul
							className="qp-tag-input__suggestions"
							role="listbox"
						>
							{ catSuggestions
								.filter(
									( cat ) =>
										! selectedCategories.includes( cat.id )
								)
								.map( ( cat ) => (
									<li
										key={ cat.id }
										role="option"
										aria-selected={ false }
										className="qp-tag-input__suggestion"
										onMouseDown={ () => addCategory( cat ) }
									>
										{ cat.name }
									</li>
								) ) }
							{ ( () => {
								const lc = catInput.trim().toLowerCase();
								const exact = catSuggestions.find(
									( c ) => c.name.toLowerCase() === lc
								);
								const already = exact
									? selectedCategories.includes( exact.id )
									: Object.entries( catNames ).some(
											( [ , n ] ) =>
												n.toLowerCase() === lc
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
								if ( ! exact ) {
									return (
										<li
											role="option"
											aria-selected={ false }
											className="qp-tag-input__suggestion qp-tag-input__suggestion--create"
											onMouseDown={ () =>
												handleCreateCategory(
													catInput.trim()
												)
											}
										>
											{ creatingCat
												? __( 'Creating…', 'quickpostr' )
												: sprintf(
													/* translators: %s: category name */
													__( 'Create "%s"', 'quickpostr' ),
													catInput.trim()
												) }
										</li>
									);
								}
								return null;
							} )() }
						</ul>
					) }
				</div>
			</div>
		</div>
	);
}
