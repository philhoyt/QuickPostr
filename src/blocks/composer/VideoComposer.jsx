import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	createPost,
	createGeoPost,
	uploadMedia,
	requestVideoMuxrUpload,
	uploadToMux,
	pollVideoMuxrStatus,
} from './api.js';
import TagInput from './TagInput.jsx';
import { generateTitle } from './useAutoTitle.js';

const config = window.quickpostrConfig ?? {};
const MAX_BYTES = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

// VideoMuxr routes new uploads straight to Mux (no PHP upload-size limit) and
// renders them via the videomuxr/video block. Active only for fresh files —
// videos picked from the media library stay on the existing WP attachment path.
const videoMuxr = config.videoMuxr ?? null;

/**
 * Video post composer.
 *
 * Flow: pick/drop video (or choose from library) → optional caption → upload media → create post.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 * @param {Object}   root0
 * @param {Function} root0.onSuccess
 */
export default function VideoComposer( { onSuccess, geoData } ) {
	const [ file, setFile ] = useState( null );
	const [ preview, setPreview ] = useState( null );
	const [ libraryMediaItem, setLibraryMediaItem ] = useState( null );
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
	// 'idle' | 'uploading' | 'processing' — only used on the VideoMuxr path.
	const [ phase, setPhase ] = useState( 'idle' );
	const [ uploadProgress, setUploadProgress ] = useState( 0 );

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

	function pickFile( f ) {
		if ( ! f ) {
			return;
		}

		if ( ! f.type.startsWith( 'video/' ) ) {
			setError( __( 'Please select a video file.', 'quickpostr' ) );
			return;
		}

		// Mux uploads go directly to Mux storage, bypassing the PHP upload limit.
		if ( ! videoMuxr?.active && f.size > MAX_BYTES ) {
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

	function openMediaLibrary() {
		const frame = window.wp?.media( {
			title: __( 'Select Video', 'quickpostr' ),
			button: { text: __( 'Use this video', 'quickpostr' ) },
			multiple: false,
			library: { type: 'video' },
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
			if ( preview ) {
				URL.revokeObjectURL( preview );
			}
			setPreview( null );
			setLibraryMediaItem( { id: attachment.id, source_url: attachment.url } );
			if ( fileInputRef.current ) {
				fileInputRef.current.value = '';
			}
		} );

		frame.open();
	}

	function clearFile() {
		if ( preview ) {
			URL.revokeObjectURL( preview );
		}
		setFile( null );
		setPreview( null );
		setLibraryMediaItem( null );
		if ( fileInputRef.current ) {
			fileInputRef.current.value = '';
		}
	}

	async function handleSubmit() {
		if ( ! file && ! libraryMediaItem ) {
			return;
		}
		if ( submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			// New file + VideoMuxr active → upload straight to Mux.
			const useMux = videoMuxr?.active && !! file;
			let baseFields;

			if ( useMux ) {
				setPhase( 'uploading' );
				setUploadProgress( 0 );

				const { upload_id: uploadId, upload_url: uploadUrl } =
					await requestVideoMuxrUpload();
				await uploadToMux( uploadUrl, file, setUploadProgress );

				setPhase( 'processing' );
				const { playbackId, assetId, aspectRatio } =
					await pollVideoMuxrStatus( uploadId );

				baseFields = {
					title: generateTitle( 'photo', '', caption ),
					content: buildMuxVideoContent(
						playbackId,
						assetId,
						aspectRatio,
						caption
					),
					status: defaultStatus,
					format: 'video',
					tags: selectedTags,
					categories: selectedCategories,
					meta: { _quickpostr_post: '1' },
					videomuxr_playback_id: playbackId,
					videomuxr_asset_id: assetId,
				};
			} else {
				let mediaId, mediaUrl;

				if ( libraryMediaItem ) {
					mediaId = libraryMediaItem.id;
					mediaUrl = libraryMediaItem.source_url;
				} else {
					const media = await uploadMedia( file );
					mediaId = media.id;
					mediaUrl = media.source_url;
				}

				baseFields = {
					title: generateTitle( 'photo', '', caption ),
					content: buildVideoContent( mediaId, mediaUrl, caption ),
					status: defaultStatus,
					format: 'video',
					featured_media: mediaId,
					tags: selectedTags,
					categories: selectedCategories,
					meta: { _quickpostr_post: '1' },
				};
			}

			const hasGeo = geoData?.active && geoData?.lat !== null;
			let fields = baseFields;
			if ( hasGeo ) {
				fields = {
					...baseFields,
					geo_lat: geoData.lat,
					geo_lng: geoData.lng,
					geo_place: geoData.place,
					geo_address: geoData.address,
				};
			}

			// VideoMuxr meta can only be written by our own endpoint (the core
			// REST route cannot set show_in_rest:false meta), so Mux posts always
			// route through /quickpostr/v1/posts.
			const wpPost =
				hasGeo || useMux
					? await createGeoPost( fields )
					: await createPost( fields );

			onSuccess?.( wpPost );

			// Reset form.
			if ( preview ) {
				URL.revokeObjectURL( preview );
			}
			setFile( null );
			setPreview( null );
			setLibraryMediaItem( null );
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
			setPhase( 'idle' );
			setUploadProgress( 0 );
		}
	}

	function buildVideoContent( mediaId, mediaUrl, captionText ) {
		const videoBlock = `<!-- wp:video {"id":${ mediaId }} --><figure class="wp-block-video"><video controls src="${ mediaUrl }"></video></figure><!-- /wp:video -->`;
		if ( ! captionText.trim() ) {
			return videoBlock;
		}
		return `${ videoBlock }\n\n<!-- wp:paragraph --><p>${ captionText }</p><!-- /wp:paragraph -->`;
	}

	function buildMuxVideoContent( playbackId, assetId, aspectRatio, captionText ) {
		const attrs = JSON.stringify( { playbackId, assetId, aspectRatio } );
		const muxBlock = `<!-- wp:videomuxr/video ${ attrs } /-->`;
		if ( ! captionText.trim() ) {
			return muxBlock;
		}
		return `${ muxBlock }\n\n<!-- wp:paragraph --><p>${ captionText }</p><!-- /wp:paragraph -->`;
	}

	function submitButtonLabel() {
		if ( phase === 'uploading' ) {
			return __( 'Uploading…', 'quickpostr' );
		}
		if ( phase === 'processing' ) {
			return __( 'Processing…', 'quickpostr' );
		}
		if ( submitting ) {
			return __( 'Publishing…', 'quickpostr' );
		}
		return defaultStatus === 'draft'
			? __( 'Save Draft', 'quickpostr' )
			: __( 'Post', 'quickpostr' );
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
			{ ! file && ! preview && ! libraryMediaItem && (
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
						{ __( 'Drop a video here,', 'quickpostr' ) }{ ' ' }
						<span className="qp-video-dropzone__browse">
							{ __( 'browse', 'quickpostr' ) }
						</span>
						{ window.wp?.media && (
							<>
								{ __( ', or', 'quickpostr' ) }{ ' ' }
								<button
									type="button"
									className="qp-video-dropzone__library"
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
						accept="video/*"
						className="qp-video-dropzone__input"
						onChange={ handleInputChange }
						aria-hidden="true"
						tabIndex={ -1 }
					/>
				</div>
			) }

			{ ( file || preview || libraryMediaItem ) && (
				<div className="qp-video-preview">
					{ /* eslint-disable-next-line jsx-a11y/media-has-caption -- caption is optional user content, not a required accessibility feature for the composer preview */ }
					<video
						src={ preview ?? libraryMediaItem?.source_url }
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

			{ ( file || libraryMediaItem ) && (
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

			{ phase === 'uploading' && (
				<div
					className="qp-video-progress"
					role="status"
					aria-live="polite"
				>
					<div
						className="qp-video-progress__bar"
						role="progressbar"
						aria-valuenow={ uploadProgress }
						aria-valuemin={ 0 }
						aria-valuemax={ 100 }
					>
						<span
							className="qp-video-progress__fill"
							style={ { width: `${ uploadProgress }%` } }
						/>
					</div>
					<span className="qp-video-progress__label">
						{ sprintf(
							/* translators: %d: upload progress percentage */
							__( 'Uploading… %d%%', 'quickpostr' ),
							uploadProgress
						) }
					</span>
				</div>
			) }

			{ phase === 'processing' && (
				<div
					className="qp-video-processing"
					role="status"
					aria-live="polite"
				>
					<span className="qp-video-processing__spinner" aria-hidden="true" />
					<span>
						{ __(
							'Processing video… this can take a minute.',
							'quickpostr'
						) }
					</span>
				</div>
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
					disabled={ ( ! file && ! libraryMediaItem ) || submitting }
					aria-label={
						submitting
							? __( 'Publishing…', 'quickpostr' )
							: __( 'Submit', 'quickpostr' )
					}
					type="button"
				>
					{ submitButtonLabel() }
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
