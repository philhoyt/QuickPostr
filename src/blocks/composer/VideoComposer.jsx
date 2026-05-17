import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createPost, updatePost, uploadMedia, getMediaUrl } from './api.js';
import TagInput from './TagInput.jsx';
import { generateTitle } from './useAutoTitle.js';

const config = window.quickpostrConfig ?? {};
const MAX_BYTES = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

/**
 * Video post composer.
 *
 * Flow: pick/drop video → optional caption → upload media → create post.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
export default function VideoComposer( { onSuccess, editPost } ) {
	const [ file, setFile ] = useState( null );
	const [ preview, setPreview ] = useState( null );
	const [ existingVideoUrl, setExistingVideoUrl ] = useState( null );
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

	// Revoke the object URL on unmount to avoid memory leaks.
	useEffect( () => {
		return () => {
			if ( preview ) {
				URL.revokeObjectURL( preview );
			}
		};
	}, [ preview ] );

	// Pre-fill caption, terms, and load existing video from editPost.
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
				.then( ( url ) => setExistingVideoUrl( url ) )
				.catch( () => {} );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	function pickFile( f ) {
		if ( ! f ) {
			return;
		}

		if ( ! f.type.startsWith( 'video/' ) ) {
			setError( __( 'Please select a video file.', 'quickpostr' ) );
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
		if ( preview ) {
			URL.revokeObjectURL( preview );
		}
		setFile( null );
		setPreview( null );
		setExistingVideoUrl( null );
		if ( fileInputRef.current ) {
			fileInputRef.current.value = '';
		}
	}

	async function handleSubmit() {
		if ( ! editPost && ! file ) {
			return;
		}
		if ( submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;

			if ( editPost && ! file ) {
				// Edit mode: update caption/tags only, keep existing featured media.
				wpPost = await updatePost( editPost.id, {
					content: caption,
					status: defaultStatus,
					tags: selectedTags,
					categories: selectedCategories,
				} );
				onSuccess?.( wpPost, '' );
			} else {
				const media = await uploadMedia( file );
				const mediaId = media.id;
				const mediaUrl = media.source_url;

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
						format: 'video',
						featured_media: mediaId,
						tags: selectedTags,
						categories: selectedCategories,
						meta: { _quickpostr_post: '1' },
					} );
				}

				onSuccess?.( wpPost, mediaUrl );
			}

			// Reset form.
			if ( preview ) {
				URL.revokeObjectURL( preview );
			}
			setFile( null );
			setPreview( null );
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
		'qp-video-dropzone',
		dragging ? 'qp-video-dropzone--active' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className="qp-video-composer">
			{ ! file &&
				! preview &&
				! existingVideoUrl &&
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
						aria-label={ __( 'Choose a video to upload', 'quickpostr' ) }
					>
						<svg
							className="qp-video-dropzone__icon"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
						>
							<rect x="2" y="6" width="15" height="12" rx="2" ry="2" />
							<polyline points="22 8 17 12 22 16 22 8" />
						</svg>
						<span className="qp-video-dropzone__label">
							{ __( 'Drop a video here, or', 'quickpostr' ) }{ ' ' }
							<span className="qp-video-dropzone__browse">
								{ __( 'browse', 'quickpostr' ) }
							</span>
						</span>
						<input
							ref={ fileInputRef }
							type="file"
							accept="video/*"
							className="qp-video-dropzone__input"
							onChange={ handleInputChange }
							aria-hidden="true"
							tabIndex={ -1 }
						/>
					</div>
				) }

			{ ( file || preview || existingVideoUrl ) && (
				<div className="qp-video-preview">
					{ /* eslint-disable-next-line jsx-a11y/media-has-caption -- caption is optional user content, not a required accessibility feature for the composer preview */ }
					<video
						src={ preview ?? existingVideoUrl }
						className="qp-video-preview__video"
						controls
					/>
					<button
						type="button"
						className="qp-video-preview__remove"
						onClick={ clearFile }
						aria-label={ __( 'Remove video', 'quickpostr' ) }
						disabled={ submitting }
					>
						&#x2715;
					</button>
				</div>
			) }

			{ ( file || editPost ) && (
				<>
					<textarea
						className="qp-video-caption"
						placeholder={ __( 'Add a caption… (optional)', 'quickpostr' ) }
						value={ caption }
						onChange={ ( e ) => setCaption( e.target.value ) }
						disabled={ submitting }
						rows={ 3 }
						aria-label={ __( 'Video caption', 'quickpostr' ) }
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

			<footer className="qp-video-composer__footer">
				<button
					className="qp-composer-submit"
					onClick={ handleSubmit }
					disabled={ ( ! editPost && ! file ) || submitting }
					aria-label={
						submitting
							? __( 'Publishing…', 'quickpostr' )
							: __( 'Submit', 'quickpostr' )
					}
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
