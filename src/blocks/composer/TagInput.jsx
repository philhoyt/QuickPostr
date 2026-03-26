import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchTags, createTag, searchCategories, createCategory, getCategory } from './api.js';

const config = window.quickpostrConfig ?? {};

/**
 * Tag + category input with typeahead and inline creation.
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
	// Tags state
	const [ tagInput,       setTagInput ]       = useState( '' );
	const [ tagSuggestions, setTagSuggestions ] = useState( [] );
	const [ tagNames,       setTagNames ]       = useState( {} ); // id → name
	const [ tagOpen,        setTagOpen ]        = useState( false );
	const [ creatingTag,    setCreatingTag ]    = useState( false );

	// Categories state
	const [ catInput,       setCatInput ]       = useState( '' );
	const [ catSuggestions, setCatSuggestions ] = useState( [] );
	const [ catNames,       setCatNames ]       = useState( {} ); // id → name
	const [ catOpen,        setCatOpen ]        = useState( false );
	const [ creatingCat,    setCreatingCat ]    = useState( false );

	const tagTimer   = useRef( null );
	const catTimer   = useRef( null );
	const wrapperRef = useRef( null );

	// Resolve names for any pre-selected categories (e.g. default category).
	useEffect( () => {
		selectedCategories.forEach( ( id ) => {
			if ( ! catNames[ id ] ) {
				getCategory( id )
					.then( ( cat ) => setCatNames( ( prev ) => ( { ...prev, [ cat.id ]: cat.name } ) ) )
					.catch( () => {} );
			}
		} );
	}, [ selectedCategories ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Close dropdowns on outside click.
	useEffect( () => {
		function handleClick( e ) {
			if ( wrapperRef.current && ! wrapperRef.current.contains( e.target ) ) {
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
	}

	async function handleCreateTag( name ) {
		if ( creatingTag ) return;
		setCreatingTag( true );
		try {
			const tag = await createTag( name );
			addTag( tag );
		} catch ( _ ) {} finally {
			setCreatingTag( false );
		}
	}

	function handleTagKeyDown( e ) {
		if ( e.key !== 'Enter' ) return;
		const trimmed = tagInput.trim();
		if ( ! trimmed ) return;
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
	}

	async function handleCreateCategory( name ) {
		if ( creatingCat ) return;
		setCreatingCat( true );
		try {
			const cat = await createCategory( name );
			addCategory( cat );
		} catch ( _ ) {} finally {
			setCreatingCat( false );
		}
	}

	function handleCatKeyDown( e ) {
		if ( e.key !== 'Enter' ) return;
		const trimmed = catInput.trim();
		if ( ! trimmed ) return;
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
						onKeyDown={ handleTagKeyDown }
						placeholder="Add tags…"
						aria-label="Search tags"
						aria-autocomplete="list"
						aria-expanded={ tagOpen }
						disabled={ creatingTag }
					/>
					{ tagOpen && (
						<ul className="qp-tag-input__suggestions" role="listbox">
							{ tagSuggestions
								.filter( ( tag ) => ! selectedTags.includes( tag.id ) )
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
							{ ! tagSuggestions.some(
								( t ) => t.name.toLowerCase() === tagInput.trim().toLowerCase()
							) && (
								<li
									role="option"
									aria-selected={ false }
									className="qp-tag-input__suggestion qp-tag-input__suggestion--create"
									onMouseDown={ () => handleCreateTag( tagInput.trim() ) }
								>
									{ creatingTag ? 'Creating…' : `Create "${ tagInput.trim() }"` }
								</li>
							) }
						</ul>
					) }
				</div>
			</div>

			{ /* Categories */ }
			<div className="qp-tag-input__tags">
				{ selectedCategories.map( ( id ) => (
					<span key={ id } className="qp-tag-input__tag qp-tag-input__tag--cat">
						{ catNames[ id ] ?? `#${ id }` }
						<button
							type="button"
							className="qp-tag-input__tag-remove"
							aria-label={ `Remove category ${ catNames[ id ] ?? id }` }
							onClick={ () => removeCategory( id ) }
						>
							×
						</button>
					</span>
				) ) }
				<div className="qp-tag-input__search-wrap">
					<input
						type="text"
						className="qp-tag-input__search"
						value={ catInput }
						onChange={ handleCatInput }
						onKeyDown={ handleCatKeyDown }
						placeholder="Add categories…"
						aria-label="Search categories"
						aria-autocomplete="list"
						aria-expanded={ catOpen }
						disabled={ creatingCat }
					/>
					{ catOpen && (
						<ul className="qp-tag-input__suggestions" role="listbox">
							{ catSuggestions
								.filter( ( cat ) => ! selectedCategories.includes( cat.id ) )
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
							{ ! catSuggestions.some(
								( c ) => c.name.toLowerCase() === catInput.trim().toLowerCase()
							) && (
								<li
									role="option"
									aria-selected={ false }
									className="qp-tag-input__suggestion qp-tag-input__suggestion--create"
									onMouseDown={ () => handleCreateCategory( catInput.trim() ) }
								>
									{ creatingCat ? 'Creating…' : `Create "${ catInput.trim() }"` }
								</li>
							) }
						</ul>
					) }
				</div>
			</div>

		</div>
	);
}
