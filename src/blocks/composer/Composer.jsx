import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';
import VideoComposer from './VideoComposer.jsx';
import LinkComposer from './LinkComposer.jsx';
import GeoTagButton from './components/GeoTagButton.jsx';
import LocationChip from './components/LocationChip.jsx';

const config = window.quickpostrConfig ?? {};

/**
 * Front-end composer root.
 *
 * Renders the mode bar (Status / Photo / Video / Link) and the active composer.
 * On success, reloads the page so the theme's Query Loop reflects the new post.
 *
 * Editing an existing post is handled by the WordPress editor — the Post
 * Actions block links there directly — so the composer only creates posts.
 */
export default function Composer() {
	const initialMode = config.blockAttrs?.defaultMode ?? 'status';
	const [ mode, setMode ] = useState( initialMode );
	const [ geoData, setGeoData ] = useState( {
		lat: null,
		lng: null,
		place: '',
		address: '',
		active: false,
	} );
	const [ geoError, setGeoError ] = useState( '' );

	const user = config.currentUser ?? {};
	const avatarUrl = user.avatarUrls?.[ '48' ];
	const initials = ( user.name ?? '?' )
		.split( ' ' )
		.map( ( w ) => w[ 0 ] )
		.slice( 0, 2 )
		.join( '' )
		.toUpperCase();

	function handleSuccess() {
		// Reload so the theme's Query Loop reflects the new post.
		window.location.reload();
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
			</header>

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
							mode === m ? ' qp-composer__mode-btn--active' : ''
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

			{ config.geoTagrActive && (
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
						geoData={ geoData }
					/>
				) }
				{ mode === 'photo' && (
					<PhotoComposer
						onSuccess={ handleSuccess }
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
						geoData={ geoData }
					/>
				) }
			</div>
		</div>
	);
}
