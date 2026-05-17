import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createPost, updatePost, uploadMedia, getMediaUrl } from './api.js';
import TagInput from './TagInput.jsx';
import { generateTitle } from './useAutoTitle.js';

const config = window.quickpostrConfig ?? {};
const MAX_BYTES = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

/**
 * Photo post composer.
 *
 * Flow: pick/drop image → optional caption → upload media → create post.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
export default function PhotoComposer( { onSuccess, editPost } ) {
	const [ file, setFile ] = useState( null );
	const [ preview, setPreview ] = useState( null );
	const [ existingPhotoUrl, setExistingPhotoUrl ] = useState( null );
	const [ libraryMediaId, setLibraryMediaId ] = useState( null );
	const [ caption, setCaption ] = useState( '' );
	const [ dragging, setDragging ] = useState( false );
	const [ selectedTags, setSelectedTags ] = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory
			? [ config.settings.defaultCategory ]
			: []
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ flash, setFlash ] = useState( false );

	const fileInputRef = useRef( null );
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Pre-fill caption, terms, and load existing photo from editPost.
	useEffect( () => {
		if ( ! editPost ) {
			return;
		}
		setCaption( editPost.content?.raw ?? '' );
		setSelectedTags( editPost.tags ?? [] );
		let defaultCats;
		if ( editPost.categories?.length ) {
			defaultCats = editPost.categories;
		} else if ( config.settings?.defaultCategory ) {
			defaultCats = [ config.settings.defaultCategory ];
		} else {
			defaultCats = [];
		}
		setSelectedCategories( defaultCats );
		if ( editPost.featured_media ) {
			getMediaUrl( editPost.featured_media )
				.then( ( url ) => setExistingPhotoUrl( url ) )
				.catch( () => {} );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	function pickFile( f ) {
		if ( ! f ) {
			return;
		}

		if ( ! f.type.startsWith( 'image/' ) ) {
			setError( __( 'Please select an image file.', 'quickpostr' ) );
			return;
		}

		if ( f.size > MAX_BYTES ) {
			const mb = Math.round( MAX_BYTES / 1024 / 1024 );
			setError(
				sprintf(
					/* translators: %d: maximum file size in MB */
					__( 'File too large — maximum size is %d MB.', 'quickpostr' ),
					mb
				)
			);
			return;
		}

		setError( null );
		setFile( f );
		setPreview( URL.createObjectURL( f ) );
	}

	function handleInputChange( e ) {
		pickFile( e.target.files?.[ 0 ] ?? null );
	}

	function handleDrop( e ) {
		e.preventDefault();
		setDragging( false );
		pickFile( e.dataTransfer.files?.[ 0 ] ?? null );
	}

	function handleDragOver( e ) {
		e.preventDefault();
		setDragging( true );
	}

	function handleDragLeave() {
		setDragging( false );
	}

	function clearFile() {
		if ( file && preview ) {
			URL.revokeObjectURL( preview );
		}
		setFile( null );
		setPreview( null );
		setExistingPhotoUrl( null );
		setLibraryMediaId( null );
		if ( fileInputRef.current ) {
			fileInputRef.current.value = '';
		}
	}

	function openMediaLibrary() {
		const frame = window.wp?.media( {
			title: __( 'Select a Photo', 'quickpostr' ),
			button: { text: __( 'Use this photo', 'quickpostr' ) },
			multiple: false,
			library: { type: 'image' },
		} );

		if ( ! frame ) {
			return;
		}

		frame.on( 'select', () => {
			const attachment = frame
				.state()
				.get( 'selection' )
				.first()
				.toJSON();
			setError( null );
			setFile( null );
			setLibraryMediaId( attachment.id );
			setPreview( attachment.sizes?.large?.url ?? attachment.url );
		} );

		frame.open();
	}

	async function handleSubmit() {
		// In edit mode without a new file or library pick, we can still update the caption.
		if ( ! editPost && ! file && ! libraryMediaId ) {
			return;
		}
		if ( submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;

			if ( editPost && ! file && ! libraryMediaId ) {
				// Edit mode: update caption/tags only, keep existing featured media.
				wpPost = await updatePost( editPost.id, {
					content: caption,
					status: defaultStatus,
					tags: selectedTags,
					categories: selectedCategories,
				} );
				onSuccess?.( wpPost, '' );
			} else {
				// Resolve the media ID — either from library pick or a fresh upload.
				let mediaId;
				let mediaUrl;

				if ( libraryMediaId ) {
					mediaId = libraryMediaId;
					mediaUrl = preview;
				} else {
					const media = await uploadMedia( file );
					mediaId = media.id;
					mediaUrl = media.source_url;
				}

				if ( editPost ) {
					wpPost = await updatePost( editPost.id, {
						content: caption,
						status: defaultStatus,
						featured_media: mediaId,
						tags: selectedTags,
						categories: selectedCategories,
					} );
				} else {
					wpPost = await createPost( {
						title: generateTitle( 'photo', '', caption ),
						content: caption,
						status: defaultStatus,
						format: 'image',
						featured_media: mediaId,
						tags: selectedTags,
						categories: selectedCategories,
						meta: { _quickpostr_post: '1' },
					} );
				}

				onSuccess?.( wpPost, mediaUrl );
			}

			// Reset form.
			setFile( null );
			setPreview( null );
			setLibraryMediaId( null );
			if ( fileInputRef.current ) {
				fileInputRef.current.value = '';
			}
			setCaption( '' );
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
	}

	function handleDropzoneKeyDown( e ) {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			fileInputRef.current?.click();
		}
	}

	const dropzoneClass = [
		'qp-photo-dropzone',
		dragging ? 'qp-photo-dropzone--active' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className="qp-photo-composer">
			{ ! file &&
				! preview &&
				! existingPhotoUrl &&
				! ( editPost && editPost.featured_media ) && (
					<div
						className={ dropzoneClass }
						onDrop={ handleDrop }
						onDragOver={ handleDragOver }
						onDragLeave={ handleDragLeave }
						onClick={ () => fileInputRef.current?.click() }
						onKeyDown={ handleDropzoneKeyDown }
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Choose a photo to upload', 'quickpostr' ) }
					>
						<svg
							className="qp-photo-dropzone__icon"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
						>
							<rect
								x="3"
								y="3"
								width="18"
								height="18"
								rx="3"
								ry="3"
							/>
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
						<span className="qp-photo-dropzone__label">
							{ __( 'Drop a photo here,', 'quickpostr' ) }{ ' ' }
							<span className="qp-photo-dropzone__browse">
								{ __( 'browse', 'quickpostr' ) }
							</span>
							{ window.wp?.media && (
								<>
									{ __( ', or', 'quickpostr' ) }{ ' ' }
									<button
										type="button"
										className="qp-photo-dropzone__library"
										onClick={ ( e ) => {
											e.stopPropagation();
											openMediaLibrary();
										} }
									>
										{ __( 'choose from library', 'quickpostr' ) }
									</button>
								</>
							) }
						</span>
						<input
							ref={ fileInputRef }
							type="file"
							accept="image/*"
							className="qp-photo-dropzone__input"
							onChange={ handleInputChange }
							aria-hidden="true"
							tabIndex={ -1 }
						/>
					</div>
				) }

			{ ( file || preview || existingPhotoUrl ) && (
				<div className="qp-photo-preview">
					<img
						src={ preview ?? existingPhotoUrl }
						alt={ __( 'Preview', 'quickpostr' ) }
						className="qp-photo-preview__img"
					/>
					<button
						type="button"
						className="qp-photo-preview__remove"
						onClick={ clearFile }
						aria-label={ __( 'Remove photo', 'quickpostr' ) }
						disabled={ submitting }
					>
						&#x2715;
					</button>
				</div>
			) }

			{ ( file || libraryMediaId || editPost ) && (
				<>
					<textarea
						className="qp-photo-caption"
						placeholder={ __( 'Add a caption… (optional)', 'quickpostr' ) }
						value={ caption }
						onChange={ ( e ) => setCaption( e.target.value ) }
						disabled={ submitting }
						rows={ 3 }
						aria-label={ __( 'Photo caption', 'quickpostr' ) }
					/>

					<TagInput
						selectedTags={ selectedTags }
						selectedCategories={ selectedCategories }
						onTagsChange={ setSelectedTags }
						onCategoriesChange={ setSelectedCategories }
					/>
				</>
			) }

			{ error && (
				<p className="qp-composer-error" role="alert">
					{ error }
				</p>
			) }

			<footer className="qp-photo-composer__footer">
				<button
					className="qp-composer-submit"
					onClick={ handleSubmit }
					disabled={
						( ! editPost && ! file && ! libraryMediaId ) ||
						submitting
					}
					aria-label={ submitting ? __( 'Publishing…', 'quickpostr' ) : __( 'Submit', 'quickpostr' ) }
					type="button"
				>
					{ ( () => {
						if ( submitting ) {
							return __( 'Publishing…', 'quickpostr' );
						}
						if ( editPost ) {
							return __( 'Update', 'quickpostr' );
						}
						return defaultStatus === 'draft'
							? __( 'Save Draft', 'quickpostr' )
							: __( 'Post', 'quickpostr' );
					} )() }
				</button>
			</footer>

			{ flash && (
				<div
					className="qp-composer-flash"
					role="status"
					aria-live="assertive"
				>
					{ __( 'Posted!', 'quickpostr' ) }
				</div>
			) }
		</div>
	);
}
