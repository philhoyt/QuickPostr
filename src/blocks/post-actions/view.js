import { __ } from '@wordpress/i18n';

/**
 * Post Actions block — front-end view script.
 *
 * Manages the kebab menu toggle, the Edit action (REST fetch + custom DOM
 * event + URL fallback), and the Delete action (inline confirmation + REST
 * DELETE + card fade).
 */
( function () {
	const cfg = window.quickpostrPostActions ?? {};

	function init() {
		document
			.querySelectorAll( '.qp-post-actions' )
			.forEach( initPostActions );
	}

	function initPostActions( wrapper ) {
		const postId = parseInt( wrapper.dataset.postId, 10 );
		const toggle = wrapper.querySelector( '.qp-post-actions__toggle' );
		const menu = wrapper.querySelector( '.qp-post-actions__menu' );

		if ( ! postId || ! toggle || ! menu ) {
			return;
		}

		// ── Kebab toggle ─────────────────────────────────────────────────────

		function openMenu() {
			menu.hidden = false;
			toggle.setAttribute( 'aria-expanded', 'true' );
			document.addEventListener( 'click', onOutsideClick );
			document.addEventListener( 'keydown', onEscape );
		}

		function closeMenu() {
			menu.hidden = true;
			toggle.setAttribute( 'aria-expanded', 'false' );
			resetDeleteConfirm();
			document.removeEventListener( 'click', onOutsideClick );
			document.removeEventListener( 'keydown', onEscape );
		}

		toggle.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			if ( menu.hidden ) {
				openMenu();
			} else {
				closeMenu();
			}
		} );

		function onOutsideClick( e ) {
			if ( ! wrapper.contains( e.target ) ) {
				closeMenu();
			}
		}

		function onEscape( e ) {
			if ( e.key === 'Escape' ) {
				closeMenu();
				toggle.focus();
			}
		}

		// ── Edit action ───────────────────────────────────────────────────────

		const editBtn = wrapper.querySelector( '.qp-post-actions__item--edit' );
		if ( editBtn ) {
			editBtn.addEventListener( 'click', function () {
				closeMenu();
				editBtn.disabled = true;
				editBtn.textContent = __( 'Loading…', 'quickpostr' );

				const url =
					cfg.restUrl +
					'wp/v2/posts/' +
					postId +
					'?context=edit&_fields=id,title,content,format,status,featured_media,tags,categories';

				fetch( url, {
					headers: { 'X-WP-Nonce': cfg.nonce },
				} )
					.then( function ( res ) {
						if ( ! res.ok ) {
							throw new Error( 'Failed to fetch post.' );
						}
						return res.json();
					} )
					.then( function ( post ) {
						const event = new CustomEvent( 'quickpostr:edit-post', {
							bubbles: true,
							cancelable: true,
							detail: { post },
						} );
						document.dispatchEvent( event );

						if ( ! event.defaultPrevented ) {
							window.location.href =
								( cfg.homeUrl || '/' ) + '?qp-edit=' + postId;
						} else {
							window.scrollTo( { top: 0, behavior: 'smooth' } );
							editBtn.disabled = false;
							editBtn.textContent = __( 'Edit', 'quickpostr' );
						}
					} )
					.catch( function () {
						editBtn.disabled = false;
						editBtn.textContent = __( 'Edit', 'quickpostr' );
					} );
			} );
		}

		// ── Delete action ─────────────────────────────────────────────────────

		const deleteBtn = wrapper.querySelector(
			'.qp-post-actions__item--delete'
		);
		const confirmPanel = wrapper.querySelector(
			'.qp-post-actions__confirm'
		);
		const confirmYes = wrapper.querySelector(
			'.qp-post-actions__confirm-yes'
		);
		const confirmNo = wrapper.querySelector(
			'.qp-post-actions__confirm-no'
		);

		function resetDeleteConfirm() {
			if ( ! deleteBtn || ! confirmPanel ) {
				return;
			}
			deleteBtn.hidden = false;
			confirmPanel.hidden = true;
			if ( confirmYes ) {
				confirmYes.disabled = false;
				confirmYes.textContent = __( 'Yes, delete', 'quickpostr' );
			}
		}

		if ( deleteBtn && confirmPanel && confirmYes && confirmNo ) {
			deleteBtn.addEventListener( 'click', function () {
				deleteBtn.hidden = true;
				confirmPanel.hidden = false;
			} );

			confirmNo.addEventListener( 'click', function () {
				resetDeleteConfirm();
			} );

			confirmYes.addEventListener( 'click', function () {
				confirmYes.disabled = true;
				confirmYes.textContent = __( 'Deleting…', 'quickpostr' );

				const url =
					( cfg.restUrl || '' ).replace( /\/$/, '' ) +
					'/wp/v2/posts/' +
					postId;

				fetch( url, {
					method: 'DELETE',
					headers: { 'X-WP-Nonce': cfg.nonce || '' },
					credentials: 'same-origin',
				} )
					.then( function ( res ) {
						if ( res.ok ) {
							closeMenu();
							const card = wrapper.closest(
								'article, li, .wp-block-post'
							);
							if ( card ) {
								card.style.transition = 'opacity 200ms ease';
								card.style.opacity = '0';
								setTimeout( function () {
									card.remove();
								}, 210 );
							}
						} else {
							resetDeleteConfirm();
						}
					} )
					.catch( function () {
						resetDeleteConfirm();
					} );
			} );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
