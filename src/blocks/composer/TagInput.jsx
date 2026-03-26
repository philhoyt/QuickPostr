import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchTags, getCategories } from './api.js';

const config = window.quickpostrConfig ?? {};

/**
 * Tag + category input with typeahead.
 *
 * Props:
 *   selectedTags       {number[]}  — array of tag IDs
 *   selectedCategories {number[]}  — array of category IDs
 *   onTagsChange       (ids) => void
 *   onCategoriesChange (ids) => void
 */
export default function TagInput( {
	selectedTags,
	selectedCategories,
	onTagsChange,
	onCategoriesChange,
} ) {
	const [ tagInput,       setTagInput ]       = useState( '' );
	const [ tagSuggestions, setTagSuggestions ] = useState( [] );
	const [ tagNames,       setTagNames ]       = useState( {} ); // id → name
	const [ categories,     setCategories ]     = useState( [] );
	const [ open,           setOpen ]           = useState( false );
	const searchTimer = useRef( null );
	const wrapperRef  = useRef( null );

	// Load all categories once.
	useEffect( () => {
		getCategories()
			.then( setCategories )
			.catch( () => {} );
	}, [] );

	// Close suggestions on outside click.
	useEffect( () => {
		function handleClick( e ) {
			if ( wrapperRef.current && ! wrapperRef.current.contains( e.target ) ) {
				setOpen( false );
			}
		}
		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [] );

	// Debounced tag search.
	const handleTagInput = useCallback( ( e ) => {
		const value = e.target.value;
		setTagInput( value );
		clearTimeout( searchTimer.current );

		if ( value.trim().length < 2 ) {
			setTagSuggestions( [] );
			setOpen( false );
			return;
		}

		searchTimer.current = setTimeout( async () => {
			try {
				const results = await searchTags( value.trim() );
				setTagSuggestions( results );
				setOpen( results.length > 0 );
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
		setOpen( false );
	}

	function removeTag( id ) {
		onTagsChange( selectedTags.filter( ( t ) => t !== id ) );
	}

	function toggleCategory( id ) {
		onCategoriesChange(
			selectedCategories.includes( id )
				? selectedCategories.filter( ( c ) => c !== id )
				: [ ...selectedCategories, id ]
		);
	}

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
							aria-label={ `Remove tag ${ tagNames[ id ] ?? id }` }
							onClick={ () => removeTag( id ) }
						>
							×
						</button>
					</span>
				) ) }
				<div className="qp-tag-input__search-wrap">
					<input
						type="text"
						className="qp-tag-input__search"
						value={ tagInput }
						onChange={ handleTagInput }
						placeholder="Add tags…"
						aria-label="Search tags"
						aria-autocomplete="list"
						aria-expanded={ open }
					/>
					{ open && (
						<ul className="qp-tag-input__suggestions" role="listbox">
							{ tagSuggestions.map( ( tag ) => (
								<li
									key={ tag.id }
									role="option"
									aria-selected={ selectedTags.includes( tag.id ) }
									className="qp-tag-input__suggestion"
									onMouseDown={ () => addTag( tag ) }
								>
									{ tag.name }
								</li>
							) ) }
						</ul>
					) }
				</div>
			</div>

			{ /* Categories */ }
			{ categories.length > 0 && (
				<div className="qp-tag-input__categories">
					<span className="qp-tag-input__cat-label">Categories</span>
					<div className="qp-tag-input__cat-list">
						{ categories.map( ( cat ) => (
							<label key={ cat.id } className="qp-tag-input__cat-item">
								<input
									type="checkbox"
									checked={ selectedCategories.includes( cat.id ) }
									onChange={ () => toggleCategory( cat.id ) }
								/>
								{ cat.name }
							</label>
						) ) }
					</div>
				</div>
			) }
		</div>
	);
}
