import React, { useState, useEffect } from 'react';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';
import { getPost } from './api.js';

const config = window.quickpostrConfig ?? {};

/**
 * Normalize a WP REST post object to the shape expected by PostCard / Feed.
 *
 * @param {object} wpPost
 * @returns {object}
 */
function shapePost( wpPost ) {
	return {
		id:                 wpPost.id,
		title:              wpPost.title?.rendered ?? '',
		content:            wpPost.content?.rendered ?? '',
		date_gmt:           wpPost.date_gmt ?? new Date().toISOString().replace( 'Z', '' ),
		status:             wpPost.status,
		format:             wpPost.format ?? 'standard',
		link:               wpPost.link ?? '',
		featured_media_url: '',
	};
}

/**
 * Front-end composer root.
 *
 * Renders the mode bar (Status / Photo) and the active composer.
 * On success, prepends the new post to the Feed via feedRef (no page reload).
 *
 * Edit mode: when ?qp-edit={id} is present in the URL, fetches the post,
 * pre-fills the correct composer, and submits as an update instead of a create.
 *
 * Props:
 *   feedRef {React.RefObject} — ref pointing to Feed's { prepend } handle
 */
export default function Composer( { feedRef } ) {
	const initialMode = config.blockAttrs?.defaultMode ?? 'status';
	const [ mode,        setMode ]        = useState( initialMode );
	const [ editPost,    setEditPost ]    = useState( null );
	const [ editLoading, setEditLoading ] = useState( false );

	// Listen for 'quickpostr:edit-post' from the Edit Post block view script.
	useEffect( () => {
		function handleEditEvent( e ) {
			e.preventDefault(); // Signal to view.js that we handled it.
			const post = e.detail?.post;
			if ( ! post ) {
				return;
			}
			setEditPost( post );
			setMode( post.format === 'image' ? 'photo' : 'status' );
		}

		document.addEventListener( 'quickpostr:edit-post', handleEditEvent );
		return () => document.removeEventListener( 'quickpostr:edit-post', handleEditEvent );
	}, [] );

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
				setEditPost( post );
				setMode( post.format === 'image' ? 'photo' : 'status' );
			} )
			.catch( () => {} )
			.finally( () => setEditLoading( false ) );
	}, [] );

	const user      = config.currentUser ?? {};
	const avatarUrl = user.avatarUrls?.[ '48' ];
	const initials  = ( user.name ?? '?' )
		.split( ' ' )
		.map( ( w ) => w[ 0 ] )
		.slice( 0, 2 )
		.join( '' )
		.toUpperCase();

	function handleSuccess( wpPost, mediaUrl ) {
		// Remove qp-edit param.
		const url = new URL( window.location.href );
		url.searchParams.delete( 'qp-edit' );
		window.history.replaceState( {}, '', url );

		if ( editPost ) {
			// Edit mode: exit edit, post already exists in the feed.
			setEditPost( null );
			setMode( initialMode );
		} else if ( wpPost ) {
			// New post: prepend to Feed optimistically.
			const shaped = shapePost( wpPost );
			if ( mediaUrl ) {
				shaped.featured_media_url = mediaUrl;
			}
			feedRef?.current?.prepend( shaped );
		}
	}

	function handleCancelEdit() {
		const url = new URL( window.location.href );
		url.searchParams.delete( 'qp-edit' );
		window.history.replaceState( {}, '', url );
		setEditPost( null );
		setMode( initialMode );
	}

	if ( editLoading ) {
		return (
			<div className="qp-composer">
				<p className="qp-composer__loading">Loading…</p>
			</div>
		);
	}

	return (
		<div className="qp-composer">
			<header className="qp-composer__header">
				<div className="qp-composer__identity">
					<div className="qp-composer__avatar" aria-hidden="true">
						{ avatarUrl
							? <img src={ avatarUrl } alt="" width="32" height="32" />
							: <span>{ initials }</span>
						}
					</div>
					<span className="qp-composer__user-name">{ user.name }</span>
				</div>

				{ editPost && (
					<button
						type="button"
						className="qp-composer__cancel-edit"
						onClick={ handleCancelEdit }
					>
						&#x2715; Cancel edit
					</button>
				) }
			</header>

			{ ! editPost && (
				<div className="qp-composer__mode-bar" role="tablist" aria-label="Post type">
					{ [ 'status', 'photo' ].map( ( m ) => (
						<button
							key={ m }
							role="tab"
							aria-selected={ mode === m }
							className={ `qp-composer__mode-btn${ mode === m ? ' qp-composer__mode-btn--active' : '' }` }
							onClick={ () => setMode( m ) }
							type="button"
						>
							{ m === 'status' ? 'Status' : 'Photo' }
						</button>
					) ) }
				</div>
			) }

			{ editPost && (
				<div className="qp-composer__edit-bar" role="status">
					Editing post
				</div>
			) }

			<div className="qp-composer__body">
				{ mode === 'status' && (
					<TextComposer
						onSuccess={ handleSuccess }
						editPost={ editPost ?? undefined }
					/>
				) }
				{ mode === 'photo' && (
					<PhotoComposer
						onSuccess={ handleSuccess }
						editPost={ editPost ?? undefined }
					/>
				) }
			</div>
		</div>
	);
}
