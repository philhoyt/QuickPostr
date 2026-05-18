/**
 * Share Post — front-end view script.
 *
 * Uses the Web Share API where available (mobile, Safari on macOS).
 * Falls back to a social-links popover (X, Facebook, copy to clipboard)
 * on browsers that do not support navigator.share (Chrome/Firefox on macOS desktop).
 */
( function () {
	'use strict';

	const X_ICON =
		'<svg class="qp-share-post__icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
	const FB_ICON =
		'<svg class="qp-share-post__icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
	const LINK_ICON =
		'<svg class="qp-share-post__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
	const COPY_LABEL = 'Copy link';
	const COPIED_LABEL = 'Copied!';

	let openPopover = null;

	function closePopover() {
		if ( openPopover ) {
			openPopover.hidden = true;
			openPopover = null;
		}
	}

	function buildPopover( title, url ) {
		const xUrl =
			'https://x.com/intent/tweet?' +
			new URLSearchParams( { url, text: title } ).toString();
		const fbUrl =
			'https://www.facebook.com/sharer/sharer.php?' +
			new URLSearchParams( { u: url } ).toString();

		const popover = document.createElement( 'div' );
		popover.className = 'qp-share-post__popover';
		popover.hidden = true;
		popover.setAttribute( 'role', 'menu' );
		popover.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
		} );

		const xLink = document.createElement( 'a' );
		xLink.href = xUrl;
		xLink.target = '_blank';
		xLink.rel = 'noopener noreferrer';
		xLink.className = 'qp-share-post__social-link';
		xLink.setAttribute( 'role', 'menuitem' );
		xLink.innerHTML = X_ICON + ' X / Twitter';
		xLink.addEventListener( 'click', closePopover );

		const fbLink = document.createElement( 'a' );
		fbLink.href = fbUrl;
		fbLink.target = '_blank';
		fbLink.rel = 'noopener noreferrer';
		fbLink.className = 'qp-share-post__social-link';
		fbLink.setAttribute( 'role', 'menuitem' );
		fbLink.innerHTML = FB_ICON + ' Facebook';
		fbLink.addEventListener( 'click', closePopover );

		const copyBtn = document.createElement( 'button' );
		copyBtn.type = 'button';
		copyBtn.className = 'qp-share-post__social-link';
		copyBtn.setAttribute( 'role', 'menuitem' );
		copyBtn.innerHTML = LINK_ICON + ' ' + COPY_LABEL;
		copyBtn.addEventListener( 'click', function () {
			navigator.clipboard
				.writeText( url )
				.then( function () {
					copyBtn.textContent = COPIED_LABEL;
					setTimeout( function () {
						copyBtn.innerHTML = LINK_ICON + ' ' + COPY_LABEL;
					}, 2000 );
				} )
				.catch( function () {} );
		} );

		popover.appendChild( xLink );
		popover.appendChild( fbLink );
		popover.appendChild( copyBtn );

		return popover;
	}

	function init() {
		document.querySelectorAll( '.qp-share-post' ).forEach( function ( el ) {
			const btn = el.querySelector( '.qp-share-post__btn' );
			const title = el.dataset.title || '';
			const url = el.dataset.url || window.location.href;

			if ( ! btn ) {
				return;
			}

			btn.hidden = false;

			if ( navigator.share ) {
				btn.addEventListener( 'click', function () {
					navigator.share( { title, url } ).catch( function () {} );
				} );
				return;
			}

			const popover = buildPopover( title, url );
			el.appendChild( popover );

			btn.addEventListener( 'click', function ( e ) {
				e.stopPropagation();
				if ( openPopover && openPopover !== popover ) {
					closePopover();
				}
				const isNowOpen = popover.hidden;
				popover.hidden = ! isNowOpen;
				openPopover = isNowOpen ? popover : null;
			} );
		} );

		document.addEventListener( 'click', closePopover );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) {
				closePopover();
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
