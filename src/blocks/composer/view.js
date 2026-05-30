/**
 * Front-end entry point.
 *
 * Mounts the React Composer into the block's wrapper div.
 * React and @wordpress/rich-text are bundled here — they are not
 * available as WordPress globals on the front end.
 */
import { createRoot } from '@wordpress/element';
import Composer from './Composer.jsx';

const el = document.getElementById( 'quickpostr-composer' );
if ( el ) {
	createRoot( el ).render( <Composer /> );
}

// Register the service worker so QuickPostr is installable as a PWA and can
// receive shared photos. Served from the site root, so its scope is the whole
// site. Registration failures are non-fatal — the composer still works.
const swUrl = window.quickpostrConfig?.pwa?.swUrl;
if ( swUrl && 'serviceWorker' in navigator ) {
	window.addEventListener( 'load', () => {
		navigator.serviceWorker
			.register( swUrl, { scope: '/' } )
			.catch( () => {} );
	} );
}
