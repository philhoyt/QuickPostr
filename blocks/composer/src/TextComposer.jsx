import React, { useState, useRef, useCallback, useEffect } from 'react';
import { create, toHTMLString } from '@wordpress/rich-text';
import { generateTitle } from './useAutoTitle.js';
import { createPost, updatePost, getDraft, discardDraft } from './api.js';
import SlugPreview from './SlugPreview.jsx';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};

/** Debounce delay (ms) for draft auto-save. */
const DRAFT_SAVE_DELAY = 800;

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
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 */
export default function TextComposer( { onSuccess, editPost } ) {
	const editorRef      = useRef( null );
	const draftTimer     = useRef( null );
	const wasEditingRef  = useRef( false );

	const [ html,               setHtml ]               = useState( '' );
	const [ selectedTags,       setSelectedTags ]       = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory ? [ config.settings.defaultCategory ] : []
	);
	const [ submitting,  setSubmitting ]  = useState( false );
	const [ error,       setError ]       = useState( null );
	const [ flash,       setFlash ]       = useState( false );
	const [ draftId,     setDraftId ]     = useState( null );
	const [ draftBanner, setDraftBanner ] = useState( false );
	const [ draftPost,   setDraftPost ]   = useState( null );

	const placeholder   = config.blockAttrs?.placeholderText ?? "What's on your mind?";
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Plain-text content for title preview and character count.
	const plainText = editorRef.current?.innerText?.trim() ?? '';
	const title     = generateTitle( 'text', plainText, '' );

	// On mount: check for an existing draft.
	useEffect( () => {
		if ( editPost ) {
			return; // handled by the editPost effect below
		}

		getDraft()
			.then( ( draft ) => {
				if ( draft && draft.format !== 'image' ) {
					setDraftPost( draft );
					setDraftBanner( true );
				}
			} )
			.catch( () => {} );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Pre-fill or clear the editor when editPost changes.
	useEffect( () => {
		if ( ! editPost ) {
			// Cancel edit — reset only if we were previously editing.
			if ( wasEditingRef.current ) {
				wasEditingRef.current = false;
				setDraftId( null );
				setHtml( '' );
				if ( editorRef.current ) {
					editorRef.current.innerHTML = '';
					editorRef.current.dispatchEvent( new Event( 'input', { bubbles: true } ) );
				}
			}
			return;
		}
		wasEditingRef.current = true;
		const raw = editPost.content?.raw ?? '';
		setDraftId( editPost.id );
		setHtml( raw );
		if ( editorRef.current ) {
			editorRef.current.innerHTML = raw;
			// Trigger RichEditor's handleInput so isEmpty state clears the placeholder.
			editorRef.current.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		}
	}, [ editPost ] );

	// Autofocus (only when not loading an edit post — avoids scroll jump).
	useEffect( () => {
		if ( ! editPost ) {
			editorRef.current?.focus();
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	/** Schedule a debounced draft save whenever content changes. */
	function scheduleDraftSave( content ) {
		if ( editPost ) return; // Edit mode: no auto-save as draft.
		clearTimeout( draftTimer.current );
		draftTimer.current = setTimeout( async () => {
			if ( ! content ) return;
			try {
				if ( draftId ) {
					await updatePost( draftId, { content, status: 'draft' } );
				} else {
					const newDraft = await createPost( {
						title:   '',
						content,
						status:  'draft',
						format:  'status',
						meta:    { _quickpostr_post: '1' },
					} );
					setDraftId( newDraft.id );
				}
			} catch ( _ ) {
				// Silent: draft save failures don't interrupt the user.
			}
		}, DRAFT_SAVE_DELAY );
	}

	function handleHtmlChange( newHtml ) {
		setHtml( newHtml );
		scheduleDraftSave( newHtml );
	}

	function resumeDraft() {
		const raw = draftPost?.content?.raw ?? '';
		setDraftId( draftPost.id );
		setHtml( raw );
		if ( editorRef.current ) {
			editorRef.current.innerHTML = raw;
		}
		setDraftBanner( false );
		setDraftPost( null );
		editorRef.current?.focus();
	}

	async function handleDiscardDraft() {
		setDraftBanner( false );
		if ( draftPost?.id ) {
			try {
				await discardDraft( draftPost.id );
			} catch ( _ ) {}
		}
		setDraftPost( null );
	}

	const handleSubmit = useCallback( async () => {
		const plain = editorRef.current?.innerText?.trim() ?? '';
		if ( ! plain || submitting ) return;

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;

			if ( editPost ) {
				// Edit mode: update the existing post.
				wpPost = await updatePost( editPost.id, {
					content:    html,
					status:     defaultStatus,
					tags:       selectedTags,
					categories: selectedCategories,
				} );
			} else if ( draftId ) {
				// Publish the auto-saved draft.
				wpPost = await updatePost( draftId, {
					title:      '',
					content:    html,
					status:     defaultStatus,
					format:     'status',
					tags:       selectedTags,
					categories: selectedCategories,
				} );
			} else {
				// No draft: create a new post.
				wpPost = await createPost( {
					title:      '',
					content:    html,
					status:     defaultStatus,
					format:     'status',
					tags:       selectedTags,
					categories: selectedCategories,
					meta:       { _quickpostr_post: '1' },
				} );
			}

			onSuccess?.( wpPost );

			// Reset.
			clearTimeout( draftTimer.current );
			if ( editorRef.current ) {
				editorRef.current.innerHTML = '';
			}
			setHtml( '' );
			setDraftId( null );
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
	}, [ html, selectedTags, selectedCategories, submitting, defaultStatus, onSuccess, editPost, draftId ] );

	function handleKeyDown( e ) {
		if ( ( e.ctrlKey || e.metaKey ) && e.key === 'Enter' ) {
			handleSubmit();
		}
	}

	const hasContent = ( editorRef.current?.innerText?.trim() ?? '' ).length > 0;
	const submitLabel = editPost ? 'Update' : ( defaultStatus === 'draft' ? 'Save Draft' : 'Post' );

	return (
		<div className="qp-text-composer" onKeyDown={ handleKeyDown }>
			{ draftBanner && (
				<div className="qp-draft-banner" role="status">
					<span>Resume your saved draft?</span>
					<div className="qp-draft-banner__actions">
						<button type="button" className="qp-draft-banner__resume" onClick={ resumeDraft }>
							Resume
						</button>
						<button type="button" className="qp-draft-banner__discard" onClick={ handleDiscardDraft }>
							Discard
						</button>
					</div>
				</div>
			) }

			<RichEditor
				placeholder={ placeholder }
				disabled={ submitting }
				editorRef={ editorRef }
				onChange={ handleHtmlChange }
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
					aria-label={ submitting ? 'Publishing…' : submitLabel }
					type="button"
				>
					{ submitting ? 'Publishing…' : submitLabel }
				</button>
			</footer>

			{ flash && (
				<div className="qp-composer-flash" role="status" aria-live="assertive">
					{ editPost ? 'Updated!' : 'Posted!' }
				</div>
			) }
		</div>
	);
}
