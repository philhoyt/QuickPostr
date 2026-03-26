import React, { useState, useRef, useCallback, useEffect } from 'react';
import { create, toHTMLString } from '@wordpress/rich-text';
import { generateTitle } from './useAutoTitle.js';
import { createPost } from './api.js';
import SlugPreview from './SlugPreview.jsx';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};

/**
 * Minimal rich-text toolbar button.
 */
function ToolbarButton( { label, onMouseDown, children } ) {
	return (
		<button
			type="button"
			className="qp-rich-editor__toolbar-btn"
			aria-label={ label }
			onMouseDown={ ( e ) => {
				// Prevent blur on the contenteditable before command runs.
				e.preventDefault();
				onMouseDown();
			} }
		>
			{ children }
		</button>
	);
}

/**
 * Lightweight contenteditable rich text editor.
 * Uses @wordpress/rich-text for HTML normalization on read.
 * Uses document.execCommand for format toggling (broad browser support).
 *
 * Props:
 *   placeholder {string}
 *   disabled    {boolean}
 *   editorRef   {React.RefObject} — forwarded ref to the contenteditable div
 *   onChange    (html: string) => void
 */
function RichEditor( { placeholder, disabled, editorRef, onChange } ) {
	const [ isEmpty, setIsEmpty ] = useState( true );

	function handleInput() {
		const el = editorRef.current;
		if ( ! el ) return;
		const empty = el.innerText.trim() === '';
		setIsEmpty( empty );
		// Read normalized HTML via @wordpress/rich-text.
		const rawHtml = empty ? '' : el.innerHTML;
		const value   = create( { html: rawHtml } );
		onChange( toHTMLString( { value } ) );
	}

	function handleKeyDown( e ) {
		// Prevent Enter from creating <div> wrappers in some browsers.
		if ( e.key === 'Enter' && ! e.shiftKey ) {
			e.preventDefault();
			document.execCommand( 'insertLineBreak' );
		}
	}

	function execFormat( command ) {
		editorRef.current?.focus();
		document.execCommand( command, false );
		handleInput();
	}

	function handleLink() {
		const url = window.prompt( 'Enter URL:' );
		if ( url ) {
			editorRef.current?.focus();
			document.execCommand( 'createLink', false, url );
			handleInput();
		}
	}

	return (
		<div className="qp-rich-editor">
			<div className="qp-rich-editor__toolbar" role="toolbar" aria-label="Formatting">
				<ToolbarButton label="Bold" onMouseDown={ () => execFormat( 'bold' ) }>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton label="Italic" onMouseDown={ () => execFormat( 'italic' ) }>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton label="Link" onMouseDown={ handleLink }>
					&#128279;
				</ToolbarButton>
			</div>

			<div
				ref={ editorRef }
				contentEditable={ ! disabled }
				suppressContentEditableWarning
				onInput={ handleInput }
				onKeyDown={ handleKeyDown }
				className="qp-rich-editor__content"
				data-placeholder={ isEmpty ? placeholder : undefined }
				role="textbox"
				aria-multiline="true"
				aria-label="Post content"
				aria-placeholder={ placeholder }
			/>
		</div>
	);
}

/**
 * Status / text post composer.
 *
 * Props:
 *   onSuccess (wpPost) => void
 */
export default function TextComposer( { onSuccess } ) {
	const editorRef = useRef( null );
	const [ html,               setHtml ]               = useState( '' );
	const [ selectedTags,       setSelectedTags ]       = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory ? [ config.settings.defaultCategory ] : []
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error,      setError ]      = useState( null );
	const [ flash,      setFlash ]      = useState( false );

	const placeholder   = config.blockAttrs?.placeholderText ?? "What's on your mind?";
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Plain-text content for title preview and character count.
	const plainText = editorRef.current?.innerText?.trim() ?? '';
	const title     = generateTitle( 'text', plainText, '' );

	// Autofocus on mount.
	useEffect( () => {
		editorRef.current?.focus();
	}, [] );

	const handleSubmit = useCallback( async () => {
		const plain = editorRef.current?.innerText?.trim() ?? '';
		if ( ! plain || submitting ) return;

		setSubmitting( true );
		setError( null );

		try {
			const wpPost = await createPost( {
				title:      '',  // PHP generates the authoritative title server-side.
				content:    html,
				status:     defaultStatus,
				format:     'status',
				tags:       selectedTags,
				categories: selectedCategories,
				meta:       { _quickpostr_post: '1' },
			} );

			onSuccess?.( wpPost );

			// Reset.
			if ( editorRef.current ) {
				editorRef.current.innerHTML = '';
			}
			setHtml( '' );
			setSelectedTags( [] );
			setSelectedCategories(
				config.settings?.defaultCategory ? [ config.settings.defaultCategory ] : []
			);
			setFlash( true );
			setTimeout( () => setFlash( false ), 2500 );
		} catch ( err ) {
			setError( err.message ?? 'Failed to publish. Please try again.' );
		} finally {
			setSubmitting( false );
		}
	}, [ html, selectedTags, selectedCategories, submitting, defaultStatus, onSuccess ] );

	function handleKeyDown( e ) {
		if ( ( e.ctrlKey || e.metaKey ) && e.key === 'Enter' ) {
			handleSubmit();
		}
	}

	const hasContent = ( editorRef.current?.innerText?.trim() ?? '' ).length > 0;

	return (
		<div className="qp-text-composer" onKeyDown={ handleKeyDown }>
			<RichEditor
				placeholder={ placeholder }
				disabled={ submitting }
				editorRef={ editorRef }
				onChange={ setHtml }
			/>

			<SlugPreview title={ title } />

			<TagInput
				selectedTags={ selectedTags }
				selectedCategories={ selectedCategories }
				onTagsChange={ setSelectedTags }
				onCategoriesChange={ setSelectedCategories }
			/>

			{ error && (
				<p className="qp-composer-error" role="alert">{ error }</p>
			) }

			<footer className="qp-text-composer__footer">
				<span className="qp-text-composer__char-count" aria-live="polite">
					{ editorRef.current?.innerText?.length ?? 0 }
				</span>
				<button
					className="qp-composer-submit"
					onClick={ handleSubmit }
					disabled={ ! hasContent || submitting }
					aria-label={ submitting ? 'Publishing…' : 'Publish post' }
					type="button"
				>
					{ submitting
						? 'Publishing…'
						: defaultStatus === 'draft' ? 'Save Draft' : 'Post'
					}
				</button>
			</footer>

			{ flash && (
				<div className="qp-composer-flash" role="status" aria-live="assertive">
					Posted!
				</div>
			) }
		</div>
	);
}
