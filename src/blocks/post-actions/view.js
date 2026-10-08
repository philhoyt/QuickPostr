import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

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

		// ── Kebab toggle (disclosure) ─────────────────────────────────────────

		function firstFocusableItem() {
			const items = menu.querySelectorAll( 'a[href], button' );
			for ( let i = 0; i < items.length; i++ ) {
				const item = items[ i ];
				if ( ! item.disabled && ! item.closest( '[hidden]' ) ) {
					return item;
				}
			}
			return null;
		}

		function openMenu() {
			menu.hidden = false;
			toggle.setAttribute( 'aria-expanded', 'true' );
			document.addEventListener( 'click', onOutsideClick );
			document.addEventListener( 'keydown', onEscape );
			const first = firstFocusableItem();
			if ( first ) {
				first.focus();
			}
		}

		function closeMenu() {
			menu.hidden = true;
			toggle.setAttribute( 'aria-expanded', 'false' );
			resetDeleteConfirm();
			clearDeleteError();
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
		const errorEl = wrapper.querySelector( '.qp-post-actions__error' );

		function clearDeleteError() {
			if ( errorEl ) {
				errorEl.hidden = true;
				errorEl.textContent = '';
			}
		}

		function showDeleteError() {
			if ( errorEl ) {
				errorEl.textContent = __(
					'Could not delete the post.',
					'quickpostr'
				);
				errorEl.hidden = false;
			}
		}

		function resetDeleteConfirm() {
			if ( ! deleteBtn || ! confirmPanel ) {
				return;
			}
			const wasConfirming = ! confirmPanel.hidden;
			deleteBtn.hidden = false;
			confirmPanel.hidden = true;
			if ( confirmYes ) {
				confirmYes.disabled = false;
				confirmYes.textContent = __( 'Yes, delete', 'quickpostr' );
			}
			// The confirm buttons just vanished; hand focus back to Delete
			// while the menu is still open so it is not stranded.
			if ( wasConfirming && ! menu.hidden ) {
				deleteBtn.focus();
			}
		}

		/**
		 * Find the actions toggle of the nearest sibling card, looking forward
		 * first and then backward.
		 *
		 * @param {Element} card The card about to be removed.
		 * @return {HTMLElement|null} A toggle button to focus, or null.
		 */
		function neighbourToggle( card ) {
			const dirs = [ 'nextElementSibling', 'previousElementSibling' ];
			for ( let d = 0; d < dirs.length; d++ ) {
				let sibling = card[ dirs[ d ] ];
				while ( sibling ) {
					const found = sibling.querySelector(
						'.qp-post-actions__toggle'
					);
					if ( found ) {
						return found;
					}
					sibling = sibling[ dirs[ d ] ];
				}
			}
			return null;
		}

		/**
		 * Move focus somewhere sensible before the card is removed.
		 *
		 * @param {Element|null} card The card being removed, if any.
		 */
		function moveFocusAway( card ) {
			let target = card ? neighbourToggle( card ) : toggle;
			if ( ! target ) {
				target = document.querySelector( 'main, h1' );
				if ( target && ! target.hasAttribute( 'tabindex' ) ) {
					target.setAttribute( 'tabindex', '-1' );
				}
			}
			if ( target ) {
				target.focus();
			}
		}

		if ( deleteBtn && confirmPanel && confirmYes && confirmNo ) {
			deleteBtn.addEventListener( 'click', function () {
				clearDeleteError();
				deleteBtn.hidden = true;
				confirmPanel.hidden = false;
				confirmYes.focus();
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
							moveFocusAway( card );
							speak( __( 'Post deleted.', 'quickpostr' ) );
							if ( card ) {
								card.style.transition = 'opacity 200ms ease';
								card.style.opacity = '0';
								setTimeout( function () {
									card.remove();
								}, 210 );
							}
						} else {
							resetDeleteConfirm();
							showDeleteError();
						}
					} )
					.catch( function () {
						resetDeleteConfirm();
						showDeleteError();
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
