/**
 * Front-end entry point.
 *
 * Mounts the React Composer into the block's wrapper div.
 * React and @wordpress/rich-text are bundled here — they are not
 * available as WordPress globals on the front end.
 */
import { createRoot } from 'react-dom/client';
import Composer from './Composer.jsx';

const el = document.getElementById( 'quickpostr-composer' );
if ( el ) {
	createRoot( el ).render( <Composer /> );
}
