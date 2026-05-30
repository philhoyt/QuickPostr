import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createPost, createGeoPost, uploadMedia } from './api.js';
import TagInput from './TagInput.jsx';
import { generateTitle } from './useAutoTitle.js';
import { buildSinglePhotoContent } from './photoContent.js';

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
 * Single image → format:image + a core/image block in content (no featured image).
 * Multiple images (2+) → format:gallery + core/gallery block content.
 *
 * Each photo is tracked as a unified object:
 *   { file: File|null, preview: string, mediaId: number|null, sourceUrl: string|null }
 *
 * Props:
 *   onSuccess    (wpPost, mediaUrl) => void
 *   geoData      {object} — location data from Composer root
 *   initialPhoto {object|null} — a pre-loaded photo (e.g. a PWA-shared image),
 *                in the library-pick shape { file, preview, mediaId, sourceUrl }
 * @param {Object}        root0
 * @param {Function}      root0.onSuccess
 * @param {object}        root0.geoData
 * @param {object|null}   root0.initialPhoto
 */
export default function PhotoComposer( { onSuccess, geoData, initialPhoto } ) {
	// Unified per-photo state: { file, preview, mediaId, sourceUrl }
	const [ photos, setPhotos ] = useState(
		initialPhoto ? [ initialPhoto ] : []
	);
	const [ caption, setCaption ] = useState( '' );
	const [ dragging, setDragging ] = useState( false );
	const [ dragOverIndex, setDragOverIndex ] = useState( null );
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
	const dragIndexRef = useRef( null );
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Seed a pre-loaded photo (e.g. a PWA share) that resolves after mount.
	// Only fills an empty composer so it never clobbers a user's own pick.
	useEffect( () => {
		if ( initialPhoto ) {
			setPhotos( ( prev ) => ( prev.length === 0 ? [ initialPhoto ] : prev ) );
		}
	}, [ initialPhoto ] );

	// Revoke blob object URLs on photos change or unmount.
	useEffect( () => {
		return () => {
			photos.forEach( ( p ) => {
				if ( p.preview.startsWith( 'blob:' ) ) {
					URL.revokeObjectURL( p.preview );
				}
			} );
		};
	}, [ photos ] );

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
		setPhotos(
			incoming.map( ( f ) => ( {
				file: f,
				preview: URL.createObjectURL( f ),
				mediaId: null,
				sourceUrl: null,
			} ) )
		);
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
		setPhotos( [] );
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
			setPhotos(
				attachments.map( ( a ) => ( {
					file: null,
					preview: a.sizes?.large?.url ?? a.url,
					mediaId: a.id,
					sourceUrl: a.url,
				} ) )
			);
		} );

		frame.open();
	}

	function movePhoto( fromIndex, toIndex ) {
		if ( fromIndex === toIndex ) {
			return;
		}
		setPhotos( ( prev ) => {
			const next = [ ...prev ];
			const [ item ] = next.splice( fromIndex, 1 );
			next.splice( toIndex, 0, item );
			return next;
		} );
	}

	async function handleSubmit() {
		if ( photos.length === 0 || submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			let wpPost;
			const isGallery = photos.length >= 2;
			const isFromFiles = photos.length > 0 && photos[ 0 ].file !== null;

			if ( isGallery ) {
				// Gallery: use uploaded files or already-uploaded library items.
				const mediaItems = isFromFiles
					? await Promise.all(
							photos.map( ( p ) => uploadMedia( p.file ) )
					  )
					: photos.map( ( p ) => ( {
							id: p.mediaId,
							source_url: p.sourceUrl,
					  } ) );

				const baseFields = {
					title: generateTitle( 'gallery', '', caption ),
					content: buildGalleryContent( mediaItems, caption ),
					status: defaultStatus,
					format: 'gallery',
					tags: selectedTags,
					categories: selectedCategories,
					meta: { _quickpostr_post: '1' },
				};
				wpPost = await ( geoData?.active && geoData?.lat !== null
					? createGeoPost( { ...baseFields, geo_lat: geoData.lat, geo_lng: geoData.lng, geo_place: geoData.place, geo_address: geoData.address } )
					: createPost( baseFields ) );

				onSuccess?.(
					wpPost,
					mediaItems[ 0 ]?.source_url ?? photos[ 0 ]?.preview ?? ''
				);
			} else {
				// Single image: upload the file or use the library item.
				let mediaId, mediaUrl;

				if ( isFromFiles ) {
					const media = await uploadMedia( photos[ 0 ].file );
					mediaId = media.id;
					mediaUrl = media.source_url;
				} else {
					mediaId = photos[ 0 ].mediaId;
					mediaUrl = photos[ 0 ].sourceUrl;
				}

				const baseFields = {
					title: generateTitle( 'photo', '', caption ),
					content: buildSinglePhotoContent( mediaId, mediaUrl, caption ),
					status: defaultStatus,
					format: 'image',
					tags: selectedTags,
					categories: selectedCategories,
					meta: { _quickpostr_post: '1' },
				};
				wpPost = await ( geoData?.active && geoData?.lat !== null
					? createGeoPost( { ...baseFields, geo_lat: geoData.lat, geo_lng: geoData.lng, geo_place: geoData.place, geo_address: geoData.address } )
					: createPost( baseFields ) );

				onSuccess?.( wpPost, mediaUrl );
			}

			// Reset form.
			setPhotos( [] ); // useEffect cleanup revokes blob URLs
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

	const showDropzone = photos.length === 0;
	const showSinglePreview = photos.length === 1;
	const showStrip = photos.length >= 2;

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

			{ showSinglePreview && (
				<div className="qp-photo-preview">
					<img
						src={ photos[ 0 ].preview }
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
					{ photos.map( ( photo, i ) => (
						<div
							key={ photo.preview }
							className={ [
								'qp-photo-strip__item',
								dragOverIndex === i
									? 'qp-photo-strip__item--drag-over'
									: '',
							]
								.filter( Boolean )
								.join( ' ' ) }
							draggable={ ! submitting }
							onDragStart={ () => {
								dragIndexRef.current = i;
							} }
							onDragOver={ ( e ) => {
								e.preventDefault();
								setDragOverIndex( i );
							} }
							onDrop={ () => {
								if ( dragIndexRef.current !== null ) {
									movePhoto( dragIndexRef.current, i );
								}
								setDragOverIndex( null );
							} }
							onDragEnd={ () => {
								dragIndexRef.current = null;
								setDragOverIndex( null );
							} }
						>
							<img
								src={ photo.preview }
								alt=""
								className="qp-photo-strip__thumb"
							/>
							{ i > 0 && (
								<button
									type="button"
									className="qp-photo-strip__move qp-photo-strip__move--prev"
									onClick={ () => movePhoto( i, i - 1 ) }
									aria-label={ __( 'Move photo left', 'quickpostr' ) }
									disabled={ submitting }
								>
									&#x2039;
								</button>
							) }
							{ i < photos.length - 1 && (
								<button
									type="button"
									className="qp-photo-strip__move qp-photo-strip__move--next"
									onClick={ () => movePhoto( i, i + 1 ) }
									aria-label={ __( 'Move photo right', 'quickpostr' ) }
									disabled={ submitting }
								>
									&#x203a;
								</button>
							) }
						</div>
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

			{ photos.length > 0 && (
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
					disabled={ photos.length === 0 || submitting }
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
