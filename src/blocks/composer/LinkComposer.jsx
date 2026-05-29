import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createPost, createGeoPost, fetchLinkPreview } from './api.js';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};

/**
 * Serialize a Better Bookmarks link-card block.
 * Produces a self-closing dynamic block comment that render.php handles.
 *
 * @param {Object} attrs — {url, title, description, image, domain}
 * @return {string} Serialized block comment string.
 */
function serializeLinkCard( attrs ) {
	return (
		'<!-- wp:better-bookmarks/link-card ' +
		JSON.stringify( attrs ) +
		' /-->'
	);
}

/**
 * Link / bookmark composer.
 *
 * If Better Bookmarks is installed, fetches OG preview data and serializes a
 * better-bookmarks/link-card block as post content. Falls back to a plain
 * <a> paragraph if Better Bookmarks is unavailable or preview fetch fails.
 *
 * Props:
 *   onSuccess (wpPost) => void
 *   geoData   {object} — location data from the composer root
 * @param {Object}   root0
 * @param {Function} root0.onSuccess
 * @param {object}   root0.geoData
 */
export default function LinkComposer( { onSuccess, geoData } ) {
	const [ url, setUrl ] = useState( '' );
	const [ preview, setPreview ] = useState( null );
	const [ fetching, setFetching ] = useState( false );
	const [ fetchError, setFetchError ] = useState( null );
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ flash, setFlash ] = useState( false );
	const [ selectedTags, setSelectedTags ] = useState( [] );
	const [ selectedCategories, setSelectedCategories ] = useState(
		config.settings?.defaultCategory
			? [ config.settings.defaultCategory ]
			: []
	);

	const bbAvailable = config.betterBookmarks ?? false;
	const defaultStatus = config.settings?.defaultStatus ?? 'publish';

	async function handleFetch() {
		const trimmed = url.trim();
		if ( ! trimmed || fetching ) {
			return;
		}
		setFetching( true );
		setFetchError( null );
		setPreview( null );
		try {
			const data = await fetchLinkPreview( trimmed );
			setPreview( data );
		} catch {
			setFetchError(
				__( 'Could not fetch preview. Check the URL and try again.', 'quickpostr' )
			);
		} finally {
			setFetching( false );
		}
	}

	function handleUrlKeyDown( e ) {
		if ( e.key === 'Enter' ) {
			e.preventDefault();
			if ( bbAvailable ) {
				handleFetch();
			}
		}
	}

	function handleUrlChange( e ) {
		setUrl( e.target.value );
		setPreview( null );
		setFetchError( null );
	}

	const handleSubmit = useCallback( async () => {
		const trimmed = url.trim();
		if ( ! trimmed || submitting ) {
			return;
		}

		setSubmitting( true );
		setError( null );

		try {
			let content;
			if ( bbAvailable && preview ) {
				content = serializeLinkCard( preview );
			} else {
				const label = preview?.title || trimmed;
				content = `<p><a href="${ trimmed }">${ label }</a></p>`;
			}

			const fields = {
				content,
				format: 'link',
				tags: selectedTags,
				categories: selectedCategories,
			};

			const baseFields = {
				...fields,
				title: '',
				status: defaultStatus,
				meta: { _quickpostr_post: '1' },
			};
			const wpPost = await ( geoData?.active && geoData?.lat !== null
				? createGeoPost( { ...baseFields, geo_lat: geoData.lat, geo_lng: geoData.lng, geo_place: geoData.place, geo_address: geoData.address } )
				: createPost( baseFields ) );

			onSuccess?.( wpPost );

			setUrl( '' );
			setPreview( null );
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
		url,
		preview,
		selectedTags,
		selectedCategories,
		submitting,
		defaultStatus,
		onSuccess,
		bbAvailable,
		geoData,
	] );

	const canSubmit = url.trim() && ! submitting;
	const submitLabel =
		defaultStatus === 'draft'
			? __( 'Save Draft', 'quickpostr' )
			: __( 'Post', 'quickpostr' );

	return (
		<div className="qp-link-composer">
			<div className="qp-link-composer__url-row">
				<input
					type="url"
					className="qp-link-composer__url-input"
					placeholder={
						bbAvailable
							? __( 'Paste a URL and press Enter…', 'quickpostr' )
							: __( 'Paste a URL…', 'quickpostr' )
					}
					value={ url }
					onChange={ handleUrlChange }
					onKeyDown={ handleUrlKeyDown }
					disabled={ submitting }
					aria-label={ __( 'URL', 'quickpostr' ) }
				/>
				{ bbAvailable && (
					<button
						type="button"
						className="qp-link-composer__fetch-btn"
						onClick={ handleFetch }
						disabled={ ! url.trim() || fetching }
					>
						{ fetching ? '…' : __( 'Preview', 'quickpostr' ) }
					</button>
				) }
			</div>

			{ fetchError && (
				<p className="qp-composer-error" role="alert">
					{ fetchError }
				</p>
			) }

			{ preview && (
				<div className="qp-link-composer__preview">
					{ preview.image && (
						<div className="qp-link-composer__preview-image">
							<img src={ preview.image } alt="" loading="lazy" />
						</div>
					) }
					<div className="qp-link-composer__preview-body">
						{ preview.domain && (
							<span className="qp-link-composer__preview-domain">
								{ preview.domain }
							</span>
						) }
						{ preview.title && (
							<strong className="qp-link-composer__preview-title">
								{ preview.title }
							</strong>
						) }
						{ preview.description && (
							<p className="qp-link-composer__preview-description">
								{ preview.description }
							</p>
						) }
					</div>
				</div>
			) }

			<TagInput
				selectedTags={ selectedTags }
				selectedCategories={ selectedCategories }
				onTagsChange={ setSelectedTags }
				onCategoriesChange={ setSelectedCategories }
			/>

			{ error && (
				<p className="qp-composer-error" role="alert">
					{ error }
				</p>
			) }

			<footer className="qp-link-composer__footer">
				<button
					className="qp-composer-submit"
					type="button"
					onClick={ handleSubmit }
					disabled={ ! canSubmit }
				>
					{ submitting ? __( 'Saving…', 'quickpostr' ) : submitLabel }
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
