import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';
import VideoComposer from './VideoComposer.jsx';
import LinkComposer from './LinkComposer.jsx';
import GeoTagButton from './components/GeoTagButton.jsx';
import LocationChip from './components/LocationChip.jsx';
import { getPost } from './api.js';

const config = window.quickpostrConfig ?? {};

/**
 * Front-end composer root.
 *
 * Renders the mode bar (Status / Photo) and the active composer.
 * On success, reloads the page so the theme's Query Loop reflects the new post.
 *
 * Edit mode: when ?qp-edit={id} is present in the URL, fetches the post,
 * pre-fills the correct composer, and submits as an update instead of a create.
 */
export default function Composer() {
	const initialMode = config.blockAttrs?.defaultMode ?? 'status';
	const [ mode, setMode ] = useState( initialMode );
	const [ editPost, setEditPost ] = useState( null );
	const [ editLoading, setEditLoading ] = useState( false );
	const [ geoData, setGeoData ] = useState( {
		lat: null,
		lng: null,
		place: '',
		address: '',
		active: false,
	} );
	const [ geoError, setGeoError ] = useState( '' );

	const editableFormats = [ 'image', 'standard', '' ];

	// Listen for 'quickpostr:edit-post' from the Edit Post block view script.
	useEffect( () => {
		function handleEditEvent( e ) {
			e.preventDefault(); // Signal to view.js that we handled it.
			const post = e.detail?.post;
			if ( ! post ) {
				return;
			}
			if ( ! editableFormats.includes( post.format ) ) {
				window.location.href = `/wp-admin/post.php?post=${ post.id }&action=edit`;
				return;
			}
			setEditPost( post );
			setMode( post.format === 'image' ? 'photo' : 'status' );
		}

		document.addEventListener( 'quickpostr:edit-post', handleEditEvent );
		return () =>
			document.removeEventListener(
				'quickpostr:edit-post',
				handleEditEvent
			);
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Detect ?qp-edit param and load the post into the composer (fallback path).
	useEffect( () => {
		const params = new URLSearchParams( window.location.search );
		const editId = parseInt( params.get( 'qp-edit' ), 10 );
		if ( ! editId ) {
			return;
		}

		setEditLoading( true );
		getPost( editId )
			.then( ( post ) => {
				if ( ! editableFormats.includes( post.format ) ) {
					window.location.href = `/wp-admin/post.php?post=${ post.id }&action=edit`;
					return;
				}
				setEditPost( post );
				setMode( post.format === 'image' ? 'photo' : 'status' );
			} )
			.catch( () => {} )
			.finally( () => setEditLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const user = config.currentUser ?? {};
	const avatarUrl = user.avatarUrls?.[ '48' ];
	const initials = ( user.name ?? '?' )
		.split( ' ' )
		.map( ( w ) => w[ 0 ] )
		.slice( 0, 2 )
		.join( '' )
		.toUpperCase();

	function handleSuccess() {
		// Remove qp-edit param before reloading so we return to normal compose mode.
		const url = new URL( window.location.href );
		url.searchParams.delete( 'qp-edit' );
		window.history.replaceState( {}, '', url );
		window.location.reload();
	}

	function handleCancelEdit() {
		const url = new URL( window.location.href );
		url.searchParams.delete( 'qp-edit' );
		window.history.replaceState( {}, '', url );
		setEditPost( null );
		setMode( initialMode );
	}

	function handleGeoDetected( result ) {
		setGeoData( { ...result, active: true } );
		setGeoError( '' );
	}

	function handleGeoError( message ) {
		setGeoData( { lat: null, lng: null, place: '', address: '', active: true } );
		setGeoError( message );
	}

	function handleGeoLocationSelect( result ) {
		setGeoData( { ...result, active: true } );
		setGeoError( '' );
	}

	function handleGeoDismiss() {
		setGeoData( { lat: null, lng: null, place: '', address: '', active: false } );
		setGeoError( '' );
	}

	if ( editLoading ) {
		return (
			<div className="qp-composer">
				<p className="qp-composer__loading">{ __( 'Loading…', 'quickpostr' ) }</p>
			</div>
		);
	}

	return (
		<div className="qp-composer">
			<header className="qp-composer__header">
				<div className="qp-composer__identity">
					<div className="qp-composer__avatar" aria-hidden="true">
						{ avatarUrl ? (
							<img
								src={ avatarUrl }
								alt=""
								width="32"
								height="32"
							/>
						) : (
							<span>{ initials }</span>
						) }
					</div>
					<span className="qp-composer__user-name">
						{ user.name }
					</span>
				</div>

				{ editPost && (
					<button
						type="button"
						className="qp-composer__cancel-edit"
						onClick={ handleCancelEdit }
					>
						&#x2715; { __( 'Cancel edit', 'quickpostr' ) }
					</button>
				) }
			</header>

			{ ! editPost && (
				<div
					className="qp-composer__mode-bar"
					role="tablist"
					aria-label={ __( 'Post type', 'quickpostr' ) }
				>
					{ [ 'status', 'photo', 'video', 'link' ].map( ( m ) => (
						<button
							key={ m }
							role="tab"
							aria-selected={ mode === m }
							className={ `qp-composer__mode-btn${
								mode === m
									? ' qp-composer__mode-btn--active'
									: ''
							}` }
							onClick={ () => setMode( m ) }
							type="button"
						>
							{
								{
									status: __( 'Status', 'quickpostr' ),
									photo: __( 'Photo', 'quickpostr' ),
									video: __( 'Video', 'quickpostr' ),
									link: __( 'Link', 'quickpostr' ),
								}[ m ]
							}
						</button>
					) ) }
				</div>
			) }

			{ editPost && (
				<div className="qp-composer__edit-bar" role="status">
					{ __( 'Editing post', 'quickpostr' ) }
				</div>
			) }

			{ ! editPost && config.geoTagrActive && (
				<div className="qp-composer__geo-bar">
					{ ! geoData.active && (
						<GeoTagButton
							onGeoDetected={ handleGeoDetected }
							onGeoError={ handleGeoError }
						/>
					) }
					{ geoData.active && (
						<LocationChip
							geoData={ geoData }
							errorMsg={ geoError }
							onDismiss={ handleGeoDismiss }
							onLocationSelect={ handleGeoLocationSelect }
						/>
					) }
				</div>
			) }

			<div className="qp-composer__body">
				{ mode === 'status' && (
					<TextComposer
						onSuccess={ handleSuccess }
						editPost={ editPost ?? undefined }
						geoData={ geoData }
					/>
				) }
				{ mode === 'photo' && (
					<PhotoComposer
						onSuccess={ handleSuccess }
						editPost={ editPost ?? undefined }
						geoData={ geoData }
					/>
				) }
				{ mode === 'video' && (
					<VideoComposer
						onSuccess={ handleSuccess }
						geoData={ geoData }
					/>
				) }
				{ mode === 'link' && (
					<LinkComposer
						onSuccess={ handleSuccess }
						editPost={ editPost ?? undefined }
						geoData={ geoData }
					/>
				) }
			</div>
		</div>
	);
}
