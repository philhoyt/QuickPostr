import { __ } from '@wordpress/i18n';

/**
 * Post Actions block — front-end view script.
 *
 * Manages the kebab menu toggle and the Delete action (inline confirmation +
 * REST DELETE + card fade). Edit is a server-rendered link to the WordPress
 * editor and needs no JS.
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

		// Edit is a plain link to the WordPress editor (rendered server-side),
		// so it needs no JS here.

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
