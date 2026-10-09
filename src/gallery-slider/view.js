/**
 * Gallery Slider — front-end script for core/gallery + QuickPostr Slider style.
 *
 * DOM after this script runs:
 *   .qp-gallery-wrapper
 *     figure.wp-block-gallery.is-style-quickpostr-slider  ← scroll container
 *       figure.wp-block-image (slide)
 *       figure.wp-block-image (slide)
 *     .qp-media-gallery__arrow--prev (injected — absolute)
 *     .qp-media-gallery__arrow--next (injected — absolute)
 *     .qp-media-gallery__pill        (injected — absolute)
 *   nav.qp-media-gallery__dots       (injected — sibling after wrapper)
 */
import { __, sprintf } from '@wordpress/i18n';

( function () {
	const CHEVRON_LEFT =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
	const CHEVRON_RIGHT =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

	// Used to build unique ids for the per-gallery instructions element.
	let galleryCount = 0;

	function slideLabel( index, total ) {
		return sprintf(
			/* translators: 1: current image number, 2: total number of images */
			__( 'Image %1$d of %2$d', 'quickpostr' ),
			index + 1,
			total
		);
	}

	function initCoreGallery( gallery ) {
		const slides = Array.from(
			gallery.querySelectorAll( ':scope > figure.wp-block-image' )
		);
		const total = slides.length;

		if ( total <= 1 ) {
			return;
		}

		let current = 0;
		let pillTimer = null;
		let scrollTimer = null;

		// Touch-drag state. We take over horizontal swipes so each gesture
		// follows the finger without native momentum and advances at most one
		// slide — a fast flick can no longer skip past the photos in between.
		let touchStartX = 0;
		let touchStartY = 0;
		let touchStartScroll = 0;
		let dragging = false;
		let isHorizontal = null;

		// Wrap the gallery in a positioning context so arrows/pill are
		// positioned relative to it rather than the scroll container.
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'qp-gallery-wrapper';
		gallery.parentNode.insertBefore( wrapper, gallery );
		wrapper.appendChild( gallery );

		// Pill counter — injected into the wrapper (absolutely positioned).
		// Visual only; the live region below carries the screen-reader text.
		const pill = document.createElement( 'div' );
		pill.className = 'qp-media-gallery__pill';
		pill.setAttribute( 'aria-hidden', 'true' );
		pill.textContent = '1/' + total;
		wrapper.appendChild( pill );

		// Visually-hidden live region announcing the current slide.
		const liveRegion = document.createElement( 'div' );
		liveRegion.className = 'qp-media-gallery__sr-only';
		liveRegion.setAttribute( 'aria-live', 'polite' );
		liveRegion.setAttribute( 'aria-atomic', 'true' );
		liveRegion.textContent = slideLabel( 0, total );
		wrapper.appendChild( liveRegion );

		// Prev / next arrows — injected into the wrapper. They use
		// aria-disabled rather than `disabled` so a focused arrow does not
		// drop focus when it becomes unavailable at either end.
		const prevBtn = document.createElement( 'button' );
		prevBtn.type = 'button';
		prevBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--prev';
		prevBtn.setAttribute(
			'aria-label',
			__( 'Previous image', 'quickpostr' )
		);
		prevBtn.innerHTML = CHEVRON_LEFT;
		prevBtn.setAttribute( 'aria-disabled', 'true' );
		prevBtn.addEventListener( 'click', function () {
			if ( prevBtn.getAttribute( 'aria-disabled' ) === 'true' ) {
				return;
			}
			goTo( current - 1 );
		} );
		wrapper.appendChild( prevBtn );

		const nextBtn = document.createElement( 'button' );
		nextBtn.type = 'button';
		nextBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--next';
		nextBtn.setAttribute( 'aria-label', __( 'Next image', 'quickpostr' ) );
		nextBtn.innerHTML = CHEVRON_RIGHT;
		nextBtn.setAttribute( 'aria-disabled', 'false' );
		nextBtn.addEventListener( 'click', function () {
			if ( nextBtn.getAttribute( 'aria-disabled' ) === 'true' ) {
				return;
			}
			goTo( current + 1 );
		} );
		wrapper.appendChild( nextBtn );

		// Dots nav — injected after the wrapper as a sibling.
		const dotsNav = document.createElement( 'nav' );
		dotsNav.className = 'qp-media-gallery__dots';
		dotsNav.setAttribute(
			'aria-label',
			__( 'Gallery navigation', 'quickpostr' )
		);
		wrapper.insertAdjacentElement( 'afterend', dotsNav );

		slides.forEach( function ( _, i ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className =
				'qp-media-gallery__dot' +
				( i === 0 ? ' qp-media-gallery__dot--active' : '' );
			btn.setAttribute( 'aria-label', slideLabel( i, total ) );
			if ( i === 0 ) {
				btn.setAttribute( 'aria-current', 'true' );
			}
			btn.addEventListener( 'click', function () {
				goTo( i );
			} );
			dotsNav.appendChild( btn );
		} );

		function updateControls() {
			const dots = dotsNav.querySelectorAll( '.qp-media-gallery__dot' );
			dots.forEach( function ( dot, i ) {
				const isActive = i === current;
				dot.classList.toggle(
					'qp-media-gallery__dot--active',
					isActive
				);
				if ( isActive ) {
					dot.setAttribute( 'aria-current', 'true' );
				} else {
					dot.removeAttribute( 'aria-current' );
				}
			} );

			prevBtn.setAttribute(
				'aria-disabled',
				current === 0 ? 'true' : 'false'
			);
			nextBtn.setAttribute(
				'aria-disabled',
				current === total - 1 ? 'true' : 'false'
			);

			liveRegion.textContent = slideLabel( current, total );
			pill.textContent = current + 1 + '/' + total;
			pill.classList.add( 'qp-media-gallery__pill--visible' );
			clearTimeout( pillTimer );
			pillTimer = setTimeout( function () {
				pill.classList.remove( 'qp-media-gallery__pill--visible' );
			}, 1500 );
		}

		function goTo( index ) {
			current = Math.max( 0, Math.min( index, total - 1 ) );
			gallery.scrollTo( {
				left: current * gallery.offsetWidth,
				behavior: window.matchMedia(
					'(prefers-reduced-motion: reduce)'
				).matches
					? 'auto'
					: 'smooth',
			} );
			updateControls();
		}

		// Sync active dot when the user swipes (CSS scroll-snap drives the animation).
		gallery.addEventListener(
			'scroll',
			function () {
				// While a touch drag is in progress we drive scrollLeft and
				// `current` ourselves; ignore native scroll events so the two
				// don't fight.
				if ( dragging ) {
					return;
				}
				clearTimeout( scrollTimer );
				scrollTimer = setTimeout( function () {
					const snapped = Math.round(
						gallery.scrollLeft / gallery.offsetWidth
					);
					if ( snapped !== current ) {
						current = snapped;
						updateControls();
					}
				}, 50 );
			},
			{ passive: true }
		);

		// Touch handling — one slide per swipe, no momentum fling.
		gallery.addEventListener(
			'touchstart',
			function ( e ) {
				if ( e.touches.length !== 1 ) {
					return;
				}
				touchStartX = e.touches[ 0 ].clientX;
				touchStartY = e.touches[ 0 ].clientY;
				touchStartScroll = gallery.scrollLeft;
				dragging = true;
				isHorizontal = null;
				// Disable native snapping so our manual scrollLeft isn't fought.
				gallery.style.scrollSnapType = 'none';
			},
			{ passive: true }
		);

		gallery.addEventListener(
			'touchmove',
			function ( e ) {
				if ( ! dragging ) {
					return;
				}
				const dx = e.touches[ 0 ].clientX - touchStartX;
				const dy = e.touches[ 0 ].clientY - touchStartY;

				// Lock the gesture axis on first move. A mostly-vertical
				// gesture is left to the page (normal scrolling).
				if ( isHorizontal === null ) {
					isHorizontal = Math.abs( dx ) > Math.abs( dy );
				}
				if ( ! isHorizontal ) {
					return;
				}

				// Take over horizontal scrolling so there is no native
				// momentum to carry past the neighbouring photo.
				e.preventDefault();

				const width = gallery.offsetWidth;
				// Clamp the drag to one slide either side of the current photo
				// so even a long, fast swipe can only ever reach the neighbour.
				const min = ( current - 1 ) * width;
				const max = ( current + 1 ) * width;
				gallery.scrollLeft = Math.max(
					min,
					Math.min( max, touchStartScroll - dx )
				);
			},
			{ passive: false }
		);

		gallery.addEventListener(
			'touchend',
			function () {
				if ( ! dragging ) {
					return;
				}
				dragging = false;
				// Restore CSS-driven snapping.
				gallery.style.scrollSnapType = '';
				if ( ! isHorizontal ) {
					return;
				}

				const width = gallery.offsetWidth;
				const moved = gallery.scrollLeft - current * width;
				// Need to drag at least 20% of the width to commit to a move;
				// anything less snaps back to the current photo.
				const threshold = width * 0.2;
				if ( moved > threshold ) {
					goTo( current + 1 );
				} else if ( moved < -threshold ) {
					goTo( current - 1 );
				} else {
					goTo( current );
				}
			},
			{ passive: true }
		);

		// Keyboard navigation. The gallery is a focusable, named carousel
		// region with visually-hidden instructions for the arrow keys.
		galleryCount++;
		const instructions = document.createElement( 'span' );
		instructions.id = 'qp-media-gallery-instructions-' + galleryCount;
		instructions.className = 'qp-media-gallery__sr-only';
		instructions.textContent = __(
			'Use the left and right arrow keys to change slides.',
			'quickpostr'
		);
		wrapper.appendChild( instructions );

		gallery.setAttribute( 'tabindex', '0' );
		gallery.setAttribute( 'role', 'region' );
		gallery.setAttribute(
			'aria-roledescription',
			/* translators: screen-reader description of the gallery widget type */
			__( 'carousel', 'quickpostr' )
		);
		gallery.setAttribute(
			'aria-label',
			__( 'Image gallery', 'quickpostr' )
		);
		gallery.setAttribute( 'aria-describedby', instructions.id );
		gallery.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'ArrowRight' ) {
				e.preventDefault();
				goTo( current + 1 );
			} else if ( e.key === 'ArrowLeft' ) {
				e.preventDefault();
				goTo( current - 1 );
			}
		} );
	}

	function init() {
		document
			.querySelectorAll( '.wp-block-gallery.is-style-quickpostr-slider' )
			.forEach( initCoreGallery );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
