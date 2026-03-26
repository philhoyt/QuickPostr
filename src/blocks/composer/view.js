/**
 * Front-end entry point.
 *
 * Mounts the Composer + Feed app into the block's wrapper div.
 * React and @wordpress/rich-text are bundled here — they are not
 * available as WordPress globals on the front end.
 */
import { createRoot, useRef } from '@wordpress/element';
import React from 'react';
import Composer from './Composer.jsx';
import Feed from './Feed.jsx';

function App() {
	const feedRef = useRef( null );
	return (
		<>
			<Composer feedRef={ feedRef } />
			<Feed ref={ feedRef } />
		</>
	);
}

const el = document.getElementById( 'quickpostr-composer' );
if ( el ) {
	createRoot( el ).render( <App /> );
}
