import React, { useState, useRef, useEffect } from 'react';
import { createPost, updatePost, uploadMedia } from './api.js';
import TagInput from './TagInput.jsx';

const config      = window.quickpostrConfig ?? {};
const MAX_BYTES   = config.maxUploadSize ?? 10 * 1024 * 1024; // 10 MB fallback

/**
 * Photo post composer.
 *
 * Flow: pick/drop image → optional caption → upload media → create post.
 *
 * Props:
 *   onSuccess (wpPost, mediaUrl) => void
 *   editPost  {object|undefined} — when set, the composer is in edit mode
 */
export default function PhotoComposer( { onSuccess, editPost } ) {
	const [ file,               setFile ]               = useState( null );
	const [ preview,            setPreview ]            = useState( null );
	const [ caption,            setCaption ]            = useState( '' );
	const [ dragging,           setDragging ]           = useState( false );
	const [ selectedTags,       setSelectedTags ]       = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory ? [ config.settings.defaultCategory ] : []
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error,      setError ]      = useState( null );
	const [ flash,      setFlash ]      = useState( false );

	const fileInputRef  = useRef( null );
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	// Pre-fill caption from editPost.
	useEffect( () => {
		if ( editPost ) {
			setCaption( editPost.content?.raw ?? '' );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	function pickFile( f ) {
		if ( ! f ) return;

		if ( ! f.type.startsWith( 'image/' ) ) {
			setError( 'Please select an image file.' );
			return;
		}

		if ( f.size > MAX_BYTES ) {
			const mb = Math.round( MAX_BYTES / 1024 / 1024 );
			setError( `File too large — maximum size is ${ mb } MB.` );
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
		if ( preview ) URL.revokeObjectURL( preview );
		setFile( null );
		setPreview( null );
		if ( fileInputRef.current ) {
			fileInputRef.current.value = '';
		}
	}

	async function handleSubmit() {
		// In edit mode without a new file, we can still update the caption.
		if ( ! editPost && ! file ) return;
		if ( submitting ) return;

		setSubmitting( true );
		setError( null );

		// Capture preview URL before async state changes.
		const previewUrl = preview;

		try {
			let wpPost;

			if ( editPost && ! file ) {
				// Edit mode: update caption only, keep existing featured media.
				wpPost = await updatePost( editPost.id, {
					content:    caption,
					status:     defaultStatus,
					tags:       selectedTags,
					categories: selectedCategories,
				} );
				onSuccess?.( wpPost, '' );
			} else {
				// New file: upload media then create/update post.
				const media = await uploadMedia( file );

				if ( editPost ) {
					wpPost = await updatePost( editPost.id, {
						content:        caption,
						status:         defaultStatus,
						featured_media: media.id,
						tags:           selectedTags,
						categories:     selectedCategories,
					} );
				} else {
					wpPost = await createPost( {
						title:          '',
						content:        caption,
						status:         defaultStatus,
						format:         'image',
						featured_media: media.id,
						tags:           selectedTags,
						categories:     selectedCategories,
						meta:           { _quickpostr_post: '1' },
					} );
				}

				onSuccess?.( wpPost, media.source_url );
			}

			// Reset form.
			if ( previewUrl ) URL.revokeObjectURL( previewUrl );
			setFile( null );
			setPreview( null );
			if ( fileInputRef.current ) fileInputRef.current.value = '';
			setCaption( '' );
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
	].filter( Boolean ).join( ' ' );

	return (
		<div className="qp-photo-composer">
			{ ! file && (
				<div
					className={ dropzoneClass }
					onDrop={ handleDrop }
					onDragOver={ handleDragOver }
					onDragLeave={ handleDragLeave }
					onClick={ () => fileInputRef.current?.click() }
					onKeyDown={ handleDropzoneKeyDown }
					role="button"
					tabIndex={ 0 }
					aria-label="Choose a photo to upload"
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
						<rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
					<span className="qp-photo-dropzone__label">
						Drop a photo here or <span className="qp-photo-dropzone__browse">browse</span>
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

			{ file && (
				<div className="qp-photo-preview">
					<img
						src={ preview }
						alt="Selected photo preview"
						className="qp-photo-preview__img"
					/>
					<button
						type="button"
						className="qp-photo-preview__remove"
						onClick={ clearFile }
						aria-label="Remove photo"
						disabled={ submitting }
					>
						&#x2715;
					</button>
				</div>
			) }

			{ file && (
				<>
					<textarea
						className="qp-photo-caption"
						placeholder="Add a caption… (optional)"
						value={ caption }
						onChange={ ( e ) => setCaption( e.target.value ) }
						disabled={ submitting }
						rows={ 3 }
						aria-label="Photo caption"
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
				<p className="qp-composer-error" role="alert">{ error }</p>
			) }

			<footer className="qp-photo-composer__footer">
				<button
					className="qp-composer-submit"
					onClick={ handleSubmit }
					disabled={ ( ! editPost && ! file ) || submitting }
					aria-label={ submitting ? 'Publishing…' : ( editPost ? 'Update' : 'Publish photo' ) }
					type="button"
				>
					{ submitting
						? 'Publishing…'
						: editPost ? 'Update' : ( defaultStatus === 'draft' ? 'Save Draft' : 'Post' )
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
