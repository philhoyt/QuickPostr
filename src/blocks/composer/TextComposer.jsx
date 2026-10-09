import { useState, useRef, useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { create, toHTMLString } from '@wordpress/rich-text';
import { generateTitle } from './useAutoTitle.js';
import { createPost, updatePost, getDraft, discardDraft, buildQuickpostrFields } from './api.js';
import { toRestDate, titleDateString } from './postDate.js';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};

/** Debounce delay (ms) for draft auto-save. */
const DRAFT_SAVE_DELAY = 800;

/**
 * Minimal rich-text toolbar button.
 *
 * The command runs from onClick so it fires for keyboard activation too;
 * onMouseDown only prevents the contenteditable from blurring (and losing its
 * selection) before the click lands.
 * @param {Object}         root0
 * @param {string}         root0.label
 * @param {Function}       root0.onClick
 * @param {boolean|undefined} root0.pressed
 * @param {*}              root0.children
 */
function ToolbarButton( { label, onClick, pressed, children } ) {
	return (
		<button
			type="button"
			className="qp-rich-editor__toolbar-btn"
			aria-label={ label }
			aria-pressed={ pressed }
			onMouseDown={ ( e ) => e.preventDefault() }
			onClick={ onClick }
		>
			{ children }
		</button>
	);
}

/**
 * Read the bold/italic state at the selection by walking up from the anchor
 * node to the editor root and looking for the formatting elements.
 *
 * document.queryCommandState() is not used: Chromium derives "bold" from the
 * computed font-weight, so a theme or plugin stylesheet that renders
 * <b>/<strong> below 700 makes it report false for text that is in fact bold
 * (the E2E suite caught exactly that on the default theme).
 *
 * @param {HTMLElement|null} root The contenteditable element.
 * @return {{bold: boolean, italic: boolean}} Current format state.
 */
function readFormatState( root ) {
	const off = { bold: false, italic: false };
	const selection = root?.ownerDocument.getSelection();
	const anchor = selection?.anchorNode;

	if ( ! root || ! anchor || ! root.contains( anchor ) ) {
		return off;
	}

	const state = { ...off };
	let el = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;

	while ( el && el !== root ) {
		if ( el.tagName === 'B' || el.tagName === 'STRONG' ) {
			state.bold = true;
		}
		if ( el.tagName === 'I' || el.tagName === 'EM' ) {
			state.italic = true;
		}
		el = el.parentElement;
	}

	return state;
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
 * @param {Object}          root0
 * @param {string}          root0.placeholder
 * @param {boolean}         root0.disabled
 * @param {React.RefObject} root0.editorRef
 * @param {Function}        root0.onChange
 */
function RichEditor( { placeholder, disabled, editorRef, onChange } ) {
	const [ isEmpty, setIsEmpty ] = useState( true );
	// Drives aria-pressed on the Bold / Italic buttons.
	const [ formats, setFormats ] = useState( { bold: false, italic: false } );

	// Track the selection so the toolbar reflects the formatting at the caret.
	// Only reads when the selection is inside this editor.
	useEffect( () => {
		function handleSelectionChange() {
			const el = editorRef.current;
			const selection = document.getSelection();
			if ( ! el || ! selection?.anchorNode ) {
				return;
			}
			if ( ! el.contains( selection.anchorNode ) ) {
				return;
			}
			setFormats( readFormatState( el ) );
		}
		document.addEventListener( 'selectionchange', handleSelectionChange );
		return () =>
			document.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
	}, [ editorRef ] );

	function handleInput() {
		const el = editorRef.current;
		if ( ! el ) {
			return;
		}
		const empty = el.innerText.trim() === '';
		setIsEmpty( empty );
		setFormats( readFormatState( el ) );
		// Read normalized HTML via @wordpress/rich-text.
		const rawHtml = empty ? '' : el.innerHTML;
		const value = create( { html: rawHtml } );
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
		// eslint-disable-next-line no-alert
		const url = window.prompt( __( 'Enter URL:', 'quickpostr' ) );
		if ( url ) {
			editorRef.current?.focus();
			document.execCommand( 'createLink', false, url );
			handleInput();
		}
	}

	return (
		<div className="qp-rich-editor">
			<div
				className="qp-rich-editor__toolbar"
				role="toolbar"
				aria-label={ __( 'Formatting', 'quickpostr' ) }
			>
				<ToolbarButton
					label={ __( 'Bold', 'quickpostr' ) }
					pressed={ formats.bold }
					onClick={ () => execFormat( 'bold' ) }
				>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton
					label={ __( 'Italic', 'quickpostr' ) }
					pressed={ formats.italic }
					onClick={ () => execFormat( 'italic' ) }
				>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton label={ __( 'Link', 'quickpostr' ) } onClick={ handleLink }>
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
				tabIndex={ 0 }
				aria-multiline="true"
				aria-label={ __( 'Post content', 'quickpostr' ) }
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
 *   geoData   {object} — location data from the composer root
 * @param {Object}   root0
 * @param {Function} root0.onSuccess
 * @param {object}   root0.geoData
 * @param {string}   root0.postDate
 */
export default function TextComposer( {
	onSuccess,
	geoData,
	postDate,
	title,
	onTitleChange,
	onStateChange,
} ) {
	const editorRef = useRef( null );
	const draftTimer = useRef( null );

	const [ html, setHtml ] = useState( '' );
	const [ selectedTags, setSelectedTags ] = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory
			? [ config.settings.defaultCategory ]
			: []
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ flash, setFlash ] = useState( false );
	const [ draftId, setDraftId ] = useState( null );
	const [ draftBanner, setDraftBanner ] = useState( false );
	const [ draftPost, setDraftPost ] = useState( null );

	const placeholder =
		config.blockAttrs?.placeholderText ?? "What's on your mind?";
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Plain-text content for title preview and character count.
	const plainText = editorRef.current?.innerText?.trim() ?? '';
	const autoTitle = generateTitle(
		'text',
		plainText,
		'',
		titleDateString( postDate )
	);

	// Keep the meta bar's title chip showing what PHP would generate, and let
	// it disable itself while a submit is in flight.
	useEffect( () => {
		onStateChange?.( { autoTitle, busy: submitting } );
	}, [ autoTitle, submitting, onStateChange ] );

	// On mount: check for an existing draft.
	useEffect( () => {
		getDraft()
			.then( ( draft ) => {
				if ( draft && draft.format !== 'image' ) {
					setDraftPost( draft );
					setDraftBanner( true );
				}
			} )
			.catch( () => {} );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Schedule a debounced draft save whenever content changes.
	 * @param {string} content
	 */
	function scheduleDraftSave( content ) {
		clearTimeout( draftTimer.current );
		draftTimer.current = setTimeout( async () => {
			if ( ! content ) {
				return;
			}
			try {
				if ( draftId ) {
					await updatePost( draftId, { content, status: 'draft' } );
				} else {
					const newDraft = await createPost( {
						title: '',
						content,
						status: 'draft',
						format: 'status',
						meta: { _quickpostr_post: '1' },
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
		if ( ! plain || submitting ) {
			return;
		}

		// The guard above reads the live DOM, so the payload must too. Falling
		// back to state alone risks passing the guard on visible text while
		// posting empty content, which WordPress rejects with "Content, title,
		// and excerpt are empty."
		const content = html || editorRef.current?.innerHTML || '';

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;
			const date = toRestDate( postDate );

			if ( draftId ) {
				// Publish the auto-saved draft.
				const draftFields = {
					title: title.trim(),
					content,
					status: defaultStatus,
					format: 'status',
					tags: selectedTags,
					categories: selectedCategories,
					...buildQuickpostrFields( geoData ),
					...( date ? { date } : {} ),
				};
				wpPost = await updatePost( draftId, draftFields );
			} else {
				// No draft: create a new post.
				const postFields = {
					title: title.trim(),
					content,
					status: defaultStatus,
					format: 'status',
					tags: selectedTags,
					categories: selectedCategories,
					meta: { _quickpostr_post: '1' },
					...buildQuickpostrFields( geoData ),
					...( date ? { date } : {} ),
				};
				wpPost = await createPost( postFields );
			}

			onSuccess?.( wpPost );

			// Reset.
			clearTimeout( draftTimer.current );
			if ( editorRef.current ) {
				editorRef.current.innerHTML = '';
			}
			setHtml( '' );
			setDraftId( null );
			onTitleChange?.( '' );
			setSelectedTags( [] );
			setSelectedCategories(
				config.settings?.defaultCategory
					? [ config.settings.defaultCategory ]
					: []
			);
			setFlash( true );
			setTimeout( () => setFlash( false ), 2500 );
		} catch ( err ) {
			setError( err.message ?? __( 'Failed to publish. Please try again.', 'quickpostr' ) );
		} finally {
			setSubmitting( false );
		}
	}, [
		html,
		selectedTags,
		selectedCategories,
		submitting,
		defaultStatus,
		onSuccess,
		draftId,
		geoData,
		postDate,
		title,
		onTitleChange,
	] );

	function handleKeyDown( e ) {
		if ( ( e.ctrlKey || e.metaKey ) && e.key === 'Enter' ) {
			handleSubmit();
		}
	}

	const hasContent =
		( editorRef.current?.innerText?.trim() ?? '' ).length > 0;
	const submitLabel =
		defaultStatus === 'draft'
			? __( 'Save Draft', 'quickpostr' )
			: __( 'Post', 'quickpostr' );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div className="qp-text-composer" onKeyDown={ handleKeyDown }>
			{ draftBanner && (
				<div className="qp-draft-banner" role="status">
					<span>{ __( 'Resume your saved draft?', 'quickpostr' ) }</span>
					<div className="qp-draft-banner__actions">
						<button
							type="button"
							className="qp-draft-banner__resume"
							onClick={ resumeDraft }
						>
							{ __( 'Resume', 'quickpostr' ) }
						</button>
						<button
							type="button"
							className="qp-draft-banner__discard"
							onClick={ handleDiscardDraft }
						>
							{ __( 'Discard', 'quickpostr' ) }
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

			{ error && (
				<p className="qp-composer-error" role="alert">
					{ error }
				</p>
			) }

			<footer className="qp-composer__actions">
				<TagInput
					selectedTags={ selectedTags }
					selectedCategories={ selectedCategories }
					onTagsChange={ setSelectedTags }
					onCategoriesChange={ setSelectedCategories }
				/>
				{ /* Grouped so the count never wraps away from the button. */ }
				<div className="qp-composer__actions-end">
					<span className="qp-text-composer__char-count">
						{ editorRef.current?.innerText?.length ?? 0 }
					</span>
					<button
						className="qp-composer-submit"
						onClick={ handleSubmit }
						disabled={ ! hasContent || submitting }
						aria-label={ submitting ? __( 'Publishing…', 'quickpostr' ) : submitLabel }
						type="button"
					>
						{ submitting ? __( 'Publishing…', 'quickpostr' ) : submitLabel }
					</button>
				</div>
			</footer>

			{ flash && (
				<div className="qp-composer-flash" role="status">
					{ __( 'Posted!', 'quickpostr' ) }
				</div>
			) }
		</div>
	);
}
