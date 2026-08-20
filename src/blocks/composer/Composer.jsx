import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';
import VideoComposer from './VideoComposer.jsx';
import LinkComposer from './LinkComposer.jsx';
import DateChip from './components/DateChip.jsx';
import { formatForDisplay } from './postDate.js';
import GeoTagButton from './components/GeoTagButton.jsx';
import LocationChip from './components/LocationChip.jsx';
import usePwaShare from './usePwaShare.js';

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
	const sharedPhoto = usePwaShare();

	// A photo shared into QuickPostr (via the PWA share target) forces photo mode.
	useEffect( () => {
		if ( sharedPhoto ) {
			setMode( 'photo' );
		}
	}, [ sharedPhoto ] );
	const [ geoData, setGeoData ] = useState( {
		lat: null,
		lng: null,
		place: '',
		address: '',
		active: false,
	} );
	const [ geoError, setGeoError ] = useState( '' );

	// '' means "now" — no date param is sent unless the user picks one.
	const [ postDate, setPostDate ] = useState( '' );

	// A draft with a future date is not scheduled, so the chip must not imply it.
	const canSchedule = ( config.settings?.defaultStatus ?? 'publish' ) === 'publish';

	// Set when WordPress schedules the post instead of publishing it.
	const [ scheduledPost, setScheduledPost ] = useState( null );
	const scheduledNoticeRef = useRef( null );

	// Move focus to the notice so the outcome is announced rather than silently
	// replacing the composer.
	useEffect( () => {
		if ( scheduledPost ) {
			scheduledNoticeRef.current?.focus();
		}
	}, [ scheduledPost ] );

	const user = config.currentUser ?? {};
	const avatarUrl = user.avatarUrls?.[ '48' ];
	const initials = ( user.name ?? '?' )
		.split( ' ' )
		.map( ( w ) => w[ 0 ] )
		.slice( 0, 2 )
		.join( '' )
		.toUpperCase();

	function handleSuccess( wpPost ) {
		// Never carry a chosen date over to the next post.
		setPostDate( '' );

		// A scheduled post will not appear in the theme's Query Loop yet, so
		// reloading would look like the post vanished. Say what happened instead.
		if ( wpPost?.status === 'future' ) {
			setScheduledPost( wpPost );
			return;
		}

		// Reload so the theme's Query Loop reflects the new post.
		window.location.reload();
	}

	function handleSelectMode( nextMode ) {
		// Switching tabs must never be a dead end behind the notice.
		setScheduledPost( null );
		setMode( nextMode );
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

			<div className="qp-composer__meta-bar">
				<DateChip
					value={ postDate }
					onChange={ setPostDate }
					canSchedule={ canSchedule }
				/>
				{ config.geoTagrActive && ! geoData.active && (
					<GeoTagButton
						onGeoDetected={ handleGeoDetected }
						onGeoError={ handleGeoError }
					/>
				) }
				{ config.geoTagrActive && geoData.active && (
					<LocationChip
						geoData={ geoData }
						errorMsg={ geoError }
						onDismiss={ handleGeoDismiss }
						onLocationSelect={ handleGeoLocationSelect }
					/>
				) }
			</div>

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
						onClick={ () => handleSelectMode( m ) }
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

			{ scheduledPost && (
				<div
					className="qp-composer-scheduled"
					role="status"
					ref={ scheduledNoticeRef }
					tabIndex={ -1 }
				>
					<p className="qp-composer-scheduled__text">
						{ sprintf(
							/* translators: %s: the date and time the post is scheduled for. */
							__( 'Scheduled for %s.', 'quickpostr' ),
							formatForDisplay( scheduledPost.date )
						) }
					</p>
					<button
						type="button"
						className="qp-composer-scheduled__again"
						onClick={ () => setScheduledPost( null ) }
					>
						{ __( 'Write another', 'quickpostr' ) }
					</button>
				</div>
			) }

			<div
				className="qp-composer__body"
				hidden={ !! scheduledPost }
			>
				{ mode === 'status' && (
					<TextComposer
						onSuccess={ handleSuccess }
						geoData={ geoData }
						postDate={ postDate }
					/>
				) }
				{ mode === 'photo' && (
					<PhotoComposer
						onSuccess={ handleSuccess }
						geoData={ geoData }
						postDate={ postDate }
						initialPhoto={ sharedPhoto }
					/>
				) }
				{ mode === 'video' && (
					<VideoComposer
						onSuccess={ handleSuccess }
						geoData={ geoData }
						postDate={ postDate }
					/>
				) }
				{ mode === 'link' && (
					<LinkComposer
						onSuccess={ handleSuccess }
						geoData={ geoData }
						postDate={ postDate }
					/>
				) }
			</div>
		</div>
	);
}
