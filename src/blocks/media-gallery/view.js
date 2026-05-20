/**
 * Media Gallery — front-end slider.
 *
 * Handles two gallery formats:
 *
 * Legacy: .qp-media-gallery (quickpostr/media-gallery block)
 *   DOM: .qp-media-gallery > .qp-media-gallery__viewport > .qp-media-gallery__track > figure
 *   Navigation: JS translateX on the track element.
 *
 * Current: .wp-block-gallery.is-style-quickpostr-slider (core/gallery + block style)
 *   DOM: figure.wp-block-gallery > figure.wp-block-image (slides)
 *   Navigation: native browser scroll-snap; view.js wraps the gallery in
 *   .qp-gallery-wrapper and injects arrows, pill, and dots nav.
 */
( function () {
	const CHEVRON_LEFT =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
	const CHEVRON_RIGHT =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

	// ── Legacy: quickpostr/media-gallery block ───────────────────────────────

	function initLegacyGallery( gallery ) {
		const viewport = gallery.querySelector( '.qp-media-gallery__viewport' );
		const track = gallery.querySelector( '.qp-media-gallery__track' );
		const dotsContainer = gallery.querySelector(
			'.qp-media-gallery__dots'
		);
		const pill = gallery.querySelector( '.qp-media-gallery__pill' );

		if ( ! viewport || ! track || ! dotsContainer || ! pill ) {
			return;
		}

		const items = Array.from( track.querySelectorAll( ':scope > figure' ) );
		const total = items.length;

		if ( total <= 1 ) {
			dotsContainer.hidden = true;
			return;
		}

		let current = 0;
		let pillTimer = null;

		const prevBtn = document.createElement( 'button' );
		prevBtn.type = 'button';
		prevBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--prev';
		prevBtn.setAttribute( 'aria-label', 'Previous image' );
		prevBtn.innerHTML = CHEVRON_LEFT;
		prevBtn.disabled = true;
		prevBtn.addEventListener( 'click', function () {
			legacyGoTo( current - 1 );
		} );

		const nextBtn = document.createElement( 'button' );
		nextBtn.type = 'button';
		nextBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--next';
		nextBtn.setAttribute( 'aria-label', 'Next image' );
		nextBtn.innerHTML = CHEVRON_RIGHT;
		nextBtn.addEventListener( 'click', function () {
			legacyGoTo( current + 1 );
		} );

		viewport.appendChild( prevBtn );
		viewport.appendChild( nextBtn );

		items.forEach( function ( _, i ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className =
				'qp-media-gallery__dot' +
				( i === 0 ? ' qp-media-gallery__dot--active' : '' );
			btn.setAttribute(
				'aria-label',
				'Image ' + ( i + 1 ) + ' of ' + total
			);
			btn.addEventListener( 'click', function () {
				legacyGoTo( i );
			} );
			dotsContainer.appendChild( btn );
		} );

		pill.textContent = '1/' + total;

		const imgs = Array.from( track.querySelectorAll( 'img' ) );

		function computeHeight() {
			const containerWidth = viewport.offsetWidth || 600;
			let maxHeight = 0;
			imgs.forEach( function ( img ) {
				if ( img.naturalWidth > 0 ) {
					const h =
						( img.naturalHeight / img.naturalWidth ) *
						containerWidth;
					if ( h > maxHeight ) {
						maxHeight = h;
					}
				}
			} );
			if ( maxHeight > 0 ) {
				gallery.style.setProperty(
					'--qp-gallery-height',
					maxHeight + 'px'
				);
			}
		}

		const unloaded = imgs.filter( function ( img ) {
			return ! img.complete;
		} );

		if ( unloaded.length === 0 ) {
			computeHeight();
		} else {
			Promise.all(
				unloaded.map( function ( img ) {
					return new Promise( function ( resolve ) {
						img.addEventListener( 'load', resolve, { once: true } );
						img.addEventListener( 'error', resolve, {
							once: true,
						} );
					} );
				} )
			).then( computeHeight );
		}

		window.addEventListener( 'resize', computeHeight );

		function legacyGoTo( index ) {
			current = Math.max( 0, Math.min( index, total - 1 ) );
			track.style.transform = 'translateX(-' + current * 100 + '%)';

			const dots = dotsContainer.querySelectorAll(
				'.qp-media-gallery__dot'
			);
			dots.forEach( function ( dot, i ) {
				dot.classList.toggle(
					'qp-media-gallery__dot--active',
					i === current
				);
			} );

			prevBtn.disabled = current === 0;
			nextBtn.disabled = current === total - 1;

			pill.textContent = current + 1 + '/' + total;
			pill.classList.add( 'qp-media-gallery__pill--visible' );
			clearTimeout( pillTimer );
			pillTimer = setTimeout( function () {
				pill.classList.remove( 'qp-media-gallery__pill--visible' );
			}, 1500 );
		}

		gallery.setAttribute( 'tabindex', '0' );
		gallery.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'ArrowRight' ) {
				e.preventDefault();
				legacyGoTo( current + 1 );
			} else if ( e.key === 'ArrowLeft' ) {
				e.preventDefault();
				legacyGoTo( current - 1 );
			}
		} );

		let dragStartX = 0;
		let isDragging = false;

		viewport.addEventListener( 'mousedown', function ( e ) {
			if ( e.target.closest( '.qp-media-gallery__arrow' ) ) {
				return;
			}
			dragStartX = e.clientX;
			isDragging = true;
			e.preventDefault();
		} );

		viewport.addEventListener( 'mouseup', function ( e ) {
			if ( ! isDragging ) {
				return;
			}
			isDragging = false;
			const delta = dragStartX - e.clientX;
			if ( Math.abs( delta ) > 40 ) {
				legacyGoTo( delta > 0 ? current + 1 : current - 1 );
			}
		} );

		viewport.addEventListener( 'mouseleave', function () {
			isDragging = false;
		} );

		let touchStartX = 0;
		viewport.addEventListener(
			'touchstart',
			function ( e ) {
				touchStartX = e.touches[ 0 ].clientX;
			},
			{ passive: true }
		);
		viewport.addEventListener(
			'touchend',
			function ( e ) {
				const delta = touchStartX - e.changedTouches[ 0 ].clientX;
				if ( Math.abs( delta ) > 40 ) {
					legacyGoTo( delta > 0 ? current + 1 : current - 1 );
				}
			},
			{ passive: true }
		);
	}

	// ── Current: core/gallery + is-style-quickpostr-slider ──────────────────

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

		// Wrap the gallery in a positioning context so arrows/pill are
		// positioned relative to it rather than the scroll container.
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'qp-gallery-wrapper';
		gallery.parentNode.insertBefore( wrapper, gallery );
		wrapper.appendChild( gallery );

		// Pill counter — injected into the wrapper (absolutely positioned).
		const pill = document.createElement( 'div' );
		pill.className = 'qp-media-gallery__pill';
		pill.setAttribute( 'aria-hidden', 'true' );
		pill.textContent = '1/' + total;
		wrapper.appendChild( pill );

		// Prev / next arrows — injected into the wrapper.
		const prevBtn = document.createElement( 'button' );
		prevBtn.type = 'button';
		prevBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--prev';
		prevBtn.setAttribute( 'aria-label', 'Previous image' );
		prevBtn.innerHTML = CHEVRON_LEFT;
		prevBtn.disabled = true;
		prevBtn.addEventListener( 'click', function () {
			goTo( current - 1 );
		} );
		wrapper.appendChild( prevBtn );

		const nextBtn = document.createElement( 'button' );
		nextBtn.type = 'button';
		nextBtn.className =
			'qp-media-gallery__arrow qp-media-gallery__arrow--next';
		nextBtn.setAttribute( 'aria-label', 'Next image' );
		nextBtn.innerHTML = CHEVRON_RIGHT;
		nextBtn.addEventListener( 'click', function () {
			goTo( current + 1 );
		} );
		wrapper.appendChild( nextBtn );

		// Dots nav — injected after the wrapper as a sibling.
		const dotsNav = document.createElement( 'nav' );
		dotsNav.className = 'qp-media-gallery__dots';
		dotsNav.setAttribute( 'aria-label', 'Gallery navigation' );
		wrapper.insertAdjacentElement( 'afterend', dotsNav );

		slides.forEach( function ( _, i ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className =
				'qp-media-gallery__dot' +
				( i === 0 ? ' qp-media-gallery__dot--active' : '' );
			btn.setAttribute(
				'aria-label',
				'Image ' + ( i + 1 ) + ' of ' + total
			);
			btn.addEventListener( 'click', function () {
				goTo( i );
			} );
			dotsNav.appendChild( btn );
		} );

		function updateControls() {
			const dots = dotsNav.querySelectorAll( '.qp-media-gallery__dot' );
			dots.forEach( function ( dot, i ) {
				dot.classList.toggle(
					'qp-media-gallery__dot--active',
					i === current
				);
			} );

			prevBtn.disabled = current === 0;
			nextBtn.disabled = current === total - 1;

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
				behavior: 'smooth',
			} );
			updateControls();
		}

		// Sync active dot when the user swipes (CSS scroll-snap drives the animation).
		gallery.addEventListener(
			'scroll',
			function () {
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

		// Keyboard navigation.
		gallery.setAttribute( 'tabindex', '0' );
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

	// ── Bootstrap ────────────────────────────────────────────────────────────

	function init() {
		document
			.querySelectorAll( '.qp-media-gallery' )
			.forEach( initLegacyGallery );

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
