import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createPost, updatePost, uploadMedia, getMediaUrl } from './api.js';
import TagInput from './TagInput.jsx';
import { generateTitle } from './useAutoTitle.js';

const config = window.quickpostrConfig ?? {};
const MAX_BYTES = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

/**
 * Build serialized gallery block content as a core/gallery block with the
 * QuickPostr Slider block style. The output matches core/gallery save() for
 * WP 6.7+ (nested-images format) so the block editor validates cleanly.
 * @param {Array<{id: number, source_url: string}>} mediaItems
 * @param {string} captionText
 * @returns {string}
 */
function buildGalleryContent( mediaItems, captionText ) {
	const innerBlocks = mediaItems
		.map(
			( m ) =>
				`<!-- wp:image {"id":${ m.id },"sizeSlug":"large","linkDestination":"none"} -->\n` +
				`<figure class="wp-block-image size-large"><img src="${ m.source_url }" alt="" class="wp-image-${ m.id }"/></figure>\n` +
				`<!-- /wp:image -->`
		)
		.join( '\n' );

	const gallery =
		`<!-- wp:gallery {"linkTo":"none","imageCrop":false,"className":"is-style-quickpostr-slider"} -->\n` +
		`<figure class="wp-block-gallery has-nested-images columns-default is-style-quickpostr-slider">` +
		innerBlocks +
		`</figure>\n` +
		`<!-- /wp:gallery -->`;

	if ( captionText.trim() ) {
		return (
			gallery +
			`\n<!-- wp:paragraph --><p>${ captionText }</p><!-- /wp:paragraph -->`
		);
	}
	return gallery;
}

/**
 * Extract { id, source_url } pairs from a serialised gallery block string.
 * @param {string} content
 * @returns {Array<{id: number, source_url: string}>}
 */
function parseGalleryImages( content ) {
	const images = [];
	const re =
		/<!-- wp:image ({[^}]+}) -->[\s\S]*?<img[^>]+src="([^"]+)"[^>]*\/?>/g;
	let m;
	while ( ( m = re.exec( content ) ) !== null ) {
		try {
			const attrs = JSON.parse( m[ 1 ] );
			if ( attrs.id ) {
				images.push( { id: attrs.id, source_url: m[ 2 ] } );
			}
		} catch ( e ) {}
	}
	return images;
}

/**
 * Extract the plain-text caption from a serialised gallery block string.
 * The caption is stored as a trailing wp:paragraph block.
 * @param {string} content
 * @returns {string}
 */
function parseGalleryCaption( content ) {
	const match = content.match(
		/<!-- wp:paragraph --><p>([\s\S]*?)<\/p><!-- \/wp:paragraph -->/
	);
	return match ? match[ 1 ] : '';
}

/**
 * Validate a file: must be image/*, under MAX_BYTES.
 * Returns an error string or null.
 * @param {File} f
 * @returns {string|null}
 */
function validateImageFile( f ) {
	if ( ! f.type.startsWith( 'image/' ) ) {
		return __( 'Please select image files only.', 'quickpostr' );
	}
	if ( f.size > MAX_BYTES ) {
		const mb = Math.round( MAX_BYTES / 1024 / 1024 );
		return sprintf(
			/* translators: %d: maximum file size in MB */
			__( 'File too large — maximum size is %d MB.', 'quickpostr' ),
			mb
		);
	}
	return null;
}

/**
 * Photo post composer.
 *
 * Flow: pick/drop one or more images → optional caption → upload → create post.
 * Single image → format:image + featured_media.
 * Multiple images (2+) → format:gallery + quickpostr/media-gallery block content.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 * @param {Object}           root0
 * @param {Function}         root0.onSuccess
 * @param {object|undefined} root0.editPost
 */
export default function PhotoComposer( { onSuccess, editPost } ) {
	const [ files, setFiles ] = useState( [] );
	const [ previews, setPreviews ] = useState( [] );
	const [ existingPhotoUrl, setExistingPhotoUrl ] = useState( null );
	const [ libraryMediaItems, setLibraryMediaItems ] = useState( [] );
	const [ caption, setCaption ] = useState( '' );
	const [ dragging, setDragging ] = useState( false );
	const [ selectedTags, setSelectedTags ] = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory
			? [ config.settings.defaultCategory ]
			: []
	);
	const [ loadingExisting, setLoadingExisting ] = useState(
		!! ( editPost?.featured_media )
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ flash, setFlash ] = useState( false );

	const fileInputRef = useRef( null );
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Revoke blob object URLs when previews change or component unmounts.
	useEffect( () => {
		return () => {
			previews.forEach( ( url ) => {
				if ( url.startsWith( 'blob:' ) ) {
					URL.revokeObjectURL( url );
				}
			} );
		};
	}, [ previews ] );

	// Pre-fill caption, terms, and load existing photo/gallery from editPost.
	useEffect( () => {
		if ( ! editPost ) {
			return;
		}
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

		if ( editPost.format === 'gallery' ) {
			// Gallery: parse image items and caption from block content.
			const raw = editPost.content?.raw ?? '';
			const galleryImages = parseGalleryImages( raw );
			if ( galleryImages.length ) {
				setLibraryMediaItems( galleryImages );
				setPreviews( galleryImages.map( ( g ) => g.source_url ) );
			}
			setCaption( parseGalleryCaption( raw ) );
		} else {
			setCaption( editPost.content?.raw ?? '' );
			if ( editPost.featured_media ) {
				getMediaUrl( editPost.featured_media )
					.then( ( url ) => {
						setExistingPhotoUrl( url );
						setLoadingExisting( false );
					} )
					.catch( () => setLoadingExisting( false ) );
			}
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	function pickFiles( fileList ) {
		if ( ! fileList || fileList.length === 0 ) {
			return;
		}
		const incoming = Array.from( fileList );

		for ( const f of incoming ) {
			const validationError = validateImageFile( f );
			if ( validationError ) {
				setError( validationError );
				return;
			}
		}

		setError( null );
		setExistingPhotoUrl( null );
		setFiles( incoming );
		setPreviews( incoming.map( ( f ) => URL.createObjectURL( f ) ) );
	}

	function handleInputChange( e ) {
		pickFiles( e.target.files );
	}

	function handleDrop( e ) {
		e.preventDefault();
		setDragging( false );
		const imageFiles = Array.from( e.dataTransfer.files ).filter( ( f ) =>
			f.type.startsWith( 'image/' )
		);
		pickFiles( imageFiles );
	}

	function handleDragOver( e ) {
		e.preventDefault();
		setDragging( true );
	}

	function handleDragLeave() {
		setDragging( false );
	}

	function clearFiles() {
		setFiles( [] );
		setPreviews( [] );
		setExistingPhotoUrl( null );
		setLibraryMediaItems( [] );
		if ( fileInputRef.current ) {
			fileInputRef.current.value = '';
		}
	}

	function openMediaLibrary() {
		const frame = window.wp?.media( {
			title: __( 'Select Photos', 'quickpostr' ),
			button: { text: __( 'Use selected photos', 'quickpostr' ) },
			multiple: true,
			library: { type: 'image' },
		} );

		if ( ! frame ) {
			return;
		}

		frame.on( 'select', () => {
			const attachments = frame
				.state()
				.get( 'selection' )
				.toJSON();
			setError( null );
			setFiles( [] );
			setExistingPhotoUrl( null );
			setLibraryMediaItems(
				attachments.map( ( a ) => ( {
					id: a.id,
					source_url: a.url,
				} ) )
			);
			setPreviews(
				attachments.map( ( a ) => a.sizes?.large?.url ?? a.url )
			);
		} );

		frame.open();
	}

	async function handleSubmit() {
		if ( ! editPost && files.length === 0 && libraryMediaItems.length === 0 ) {
			return;
		}
		if ( submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;

			if (
				editPost &&
				editPost.format === 'gallery' &&
				files.length === 0 &&
				libraryMediaItems.length === 0
			) {
				setError(
					__(
						'Please add at least two photos to update the gallery, or cancel editing.',
						'quickpostr'
					)
				);
				setSubmitting( false );
				return;
			} else if ( editPost && files.length === 0 && libraryMediaItems.length === 0 ) {
				// Edit mode: update caption/tags only, keep existing featured media.
				wpPost = await updatePost( editPost.id, {
					content: caption,
					status: defaultStatus,
					tags: selectedTags,
					categories: selectedCategories,
				} );
				onSuccess?.( wpPost, '' );
			} else if ( files.length >= 2 ) {
				// Gallery: upload all files, then create or update post.
				const mediaItems = await Promise.all(
					files.map( ( f ) => uploadMedia( f ) )
				);
				const galleryPayload = {
					title: generateTitle( 'gallery', '', caption ),
					content: buildGalleryContent( mediaItems, caption ),
					status: defaultStatus,
					format: 'gallery',
					tags: selectedTags,
					categories: selectedCategories,
				};
				if ( editPost ) {
					wpPost = await updatePost( editPost.id, galleryPayload );
				} else {
					wpPost = await createPost( {
						...galleryPayload,
						meta: { _quickpostr_post: '1' },
					} );
				}
				onSuccess?.( wpPost, mediaItems[ 0 ]?.source_url ?? '' );
			} else if ( libraryMediaItems.length >= 2 ) {
				// Gallery from library: media already uploaded, create or update post.
				const galleryPayload = {
					title: generateTitle( 'gallery', '', caption ),
					content: buildGalleryContent( libraryMediaItems, caption ),
					status: defaultStatus,
					format: 'gallery',
					tags: selectedTags,
					categories: selectedCategories,
				};
				if ( editPost ) {
					wpPost = await updatePost( editPost.id, galleryPayload );
				} else {
					wpPost = await createPost( {
						...galleryPayload,
						meta: { _quickpostr_post: '1' },
					} );
				}
				onSuccess?.( wpPost, previews[ 0 ] ?? '' );
			} else {
				// Single image: library pick or file upload.
				let mediaId;
				let mediaUrl;

				if ( libraryMediaItems.length === 1 ) {
					mediaId = libraryMediaItems[ 0 ].id;
					mediaUrl = previews[ 0 ] ?? '';
				} else {
					const media = await uploadMedia( files[ 0 ] );
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
			setFiles( [] );
			setPreviews( [] ); // useEffect cleanup revokes blob URLs
			setLibraryMediaItems( [] );
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
			setError(
				err.message ??
					__( 'Failed to publish. Please try again.', 'quickpostr' )
			);
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

	const showDropzone =
		files.length === 0 &&
		libraryMediaItems.length === 0 &&
		previews.length === 0 &&
		! existingPhotoUrl &&
		! loadingExisting;

	const showSinglePreview =
		previews.length === 1 ||
		( previews.length === 0 && !! existingPhotoUrl );

	const showStrip = files.length >= 2 || libraryMediaItems.length >= 2;

	return (
		<div className="qp-photo-composer">
			{ showDropzone && (
				<div
					className={ dropzoneClass }
					onDrop={ handleDrop }
					onDragOver={ handleDragOver }
					onDragLeave={ handleDragLeave }
					onClick={ () => fileInputRef.current?.click() }
					onKeyDown={ handleDropzoneKeyDown }
					role="button"
					tabIndex={ 0 }
					aria-label={ __( 'Choose photos to upload', 'quickpostr' ) }
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
						{ __( 'Drop photos here,', 'quickpostr' ) }{ ' ' }
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
						multiple
						className="qp-photo-dropzone__input"
						onChange={ handleInputChange }
						aria-hidden="true"
						tabIndex={ -1 }
					/>
				</div>
			) }

			{ loadingExisting && (
				<p className="qp-composer-loading">
					{ __( 'Loading…', 'quickpostr' ) }
				</p>
			) }

			{ showSinglePreview && (
				<div className="qp-photo-preview">
					<img
						src={ previews[ 0 ] ?? existingPhotoUrl }
						alt={ __( 'Preview', 'quickpostr' ) }
						className="qp-photo-preview__img"
					/>
					<button
						type="button"
						className="qp-photo-preview__remove"
						onClick={ clearFiles }
						aria-label={ __( 'Remove photo', 'quickpostr' ) }
						disabled={ submitting }
					>
						&#x2715;
					</button>
				</div>
			) }

			{ showStrip && (
				<div className="qp-photo-strip">
					{ previews.map( ( src, i ) => (
						<img
							key={ i }
							src={ src }
							alt=""
							className="qp-photo-strip__thumb"
						/>
					) ) }
					<button
						type="button"
						className="qp-photo-strip__clear"
						onClick={ clearFiles }
						aria-label={ __( 'Clear all photos', 'quickpostr' ) }
						disabled={ submitting }
					>
						{ __( 'Clear', 'quickpostr' ) }
					</button>
				</div>
			) }

			{ ( files.length > 0 ||
				libraryMediaItems.length > 0 ||
				( editPost && ! loadingExisting ) ) && (
				<>
					<textarea
						className="qp-photo-caption"
						placeholder={ __(
							'Add a caption… (optional)',
							'quickpostr'
						) }
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
						( ! editPost &&
							files.length === 0 &&
							libraryMediaItems.length === 0 ) ||
						submitting
					}
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
