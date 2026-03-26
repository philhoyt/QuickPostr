import React, { useState } from 'react';
import TextComposer from './TextComposer.jsx';

const config = window.quickpostrConfig ?? {};

/**
 * Front-end composer root.
 *
 * Renders the mode bar (Status / Photo) and the active composer.
 * On success, reloads the page so the theme's Query Loop reflects the new post.
 *
 * Photo mode is a placeholder until Phase 3.
 */
export default function Composer() {
	const initialMode = config.blockAttrs?.defaultMode ?? 'status';
	const [ mode, setMode ] = useState( initialMode );

	const user      = config.currentUser ?? {};
	const avatarUrl = user.avatarUrls?.[ '48' ];
	const initials  = ( user.name ?? '?' )
		.split( ' ' )
		.map( ( w ) => w[ 0 ] )
		.slice( 0, 2 )
		.join( '' )
		.toUpperCase();

	function handleSuccess() {
		window.location.reload();
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
			</header>

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

			<div className="qp-composer__body">
				{ mode === 'status' && (
					<TextComposer onSuccess={ handleSuccess } />
				) }
				{ mode === 'photo' && (
					<p className="qp-composer__coming-soon">
						Photo composer coming soon.
					</p>
				) }
			</div>
		</div>
	);
}
