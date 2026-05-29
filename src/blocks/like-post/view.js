import MicroModal from 'micromodal';
import { __ } from '@wordpress/i18n';

/**
 * Like Post — front-end view script.
 *
 * Logged-in users: click toggles like/unlike via REST, optimistic UI.
 * Logged-out users: click opens a modal (via Micromodal) with a login link
 * and a name/email form for anonymous likes. Anonymous liked state is tracked
 * in localStorage.
 */
( function () {
	const config = window.quickpostrLikePost;
	if ( ! config ) {
		return;
	}

	const MODAL_ID = 'qp-like-modal';

	const HEART_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="qp-like-post__icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

	// ── Modal (singleton injected once into document.body) ────────────────────

	let modal = null;
	let currentWrapper = null;

	function buildModal() {
		const el = document.createElement( 'div' );
		el.id = MODAL_ID;
		el.className = 'qp-like-modal';
		el.setAttribute( 'aria-hidden', 'true' );

		const loginSection = config.showLogin
			? '<div class="qp-like-modal__login-section">' +
			  '<p class="qp-like-modal__login-desc">' +
			  __(
					'Log in to like and unlike posts on future visits.',
					'quickpostr'
			  ) +
			  '</p>' +
			  '<a href="" class="qp-like-modal__login-btn">' +
			  __( 'Log In', 'quickpostr' ) +
			  '</a>' +
			  '</div>' +
			  '<div class="qp-like-modal__divider" aria-hidden="true"><span>' +
			  __( 'or', 'quickpostr' ) +
			  '</span></div>'
			: '';

		el.innerHTML =
			'<div class="qp-like-modal__backdrop" tabindex="-1" data-micromodal-close>' +
			'<div class="qp-like-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="qp-like-modal-title">' +
			'<button type="button" class="qp-like-modal__close" aria-label="' +
			__( 'Close', 'quickpostr' ) +
			'" data-micromodal-close>' +
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
			'</button>' +
			'<h2 id="qp-like-modal-title" class="qp-like-modal__title">' +
			__( 'Like this post', 'quickpostr' ) +
			'</h2>' +
			loginSection +
			'<form class="qp-like-modal__form" novalidate>' +
			'<div class="qp-like-modal__error" hidden></div>' +
			'<label class="qp-like-modal__label" for="qp-like-name">' +
			__( 'Name', 'quickpostr' ) +
			'</label>' +
			'<input class="qp-like-modal__input" id="qp-like-name" type="text" name="name" required autocomplete="name">' +
			'<label class="qp-like-modal__label" for="qp-like-email">' +
			__( 'Email', 'quickpostr' ) +
			' <span class="qp-like-modal__optional">' +
			__( '(optional)', 'quickpostr' ) +
			'</span>' +
			'</label>' +
			'<input class="qp-like-modal__input" id="qp-like-email" type="email" name="email" autocomplete="email">' +
			'<button type="submit" class="qp-like-modal__submit">' +
			HEART_SVG +
			' ' +
			__( 'Like this post', 'quickpostr' ) +
			'</button>' +
			'</form>' +
			'</div>' +
			'</div>';

		el.querySelector( '.qp-like-modal__form' ).addEventListener(
			'submit',
			function ( e ) {
				e.preventDefault();
				submitAnonymousLike();
			}
		);

		document.body.appendChild( el );
		return el;
	}

	function getModal() {
		if ( ! modal ) {
			modal = buildModal();
		}
		return modal;
	}

	function openModal( wrapper ) {
		currentWrapper = wrapper;
		const m = getModal();

		const loginBtn = m.querySelector( '.qp-like-modal__login-btn' );
		if ( loginBtn ) {
			loginBtn.href =
				config.loginUrl +
				'?redirect_to=' +
				encodeURIComponent( window.location.href );
		}

		const errorEl = m.querySelector( '.qp-like-modal__error' );
		errorEl.hidden = true;
		errorEl.textContent = '';

		MicroModal.show( MODAL_ID, {
			disableScroll: true,
			onClose() {
				currentWrapper = null;
			},
		} );
	}

	function submitAnonymousLike() {
		if ( ! currentWrapper ) {
			return;
		}

		const m = getModal();
		const nameInput = m.querySelector( '#qp-like-name' );
		const postId = currentWrapper.dataset.postId;

		const name = nameInput.value.trim();
		if ( ! name ) {
			nameInput.focus();
			return;
		}

		const emailInput = m.querySelector( '#qp-like-email' );
		const submitBtn = m.querySelector( '.qp-like-modal__submit' );
		const errorEl = m.querySelector( '.qp-like-modal__error' );

		submitBtn.disabled = true;
		errorEl.hidden = true;

		const body = { name };
		const email = emailInput.value.trim();
		if ( email ) {
			body.email = email;
		}

		fetch( config.restUrl + 'quickpostr/v1/posts/' + postId + '/like', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( body ),
		} )
			.then( function ( response ) {
				if ( ! response.ok ) {
					return response.json().then( function ( d ) {
						throw new Error(
							d.message || __( 'Request failed', 'quickpostr' )
						);
					} );
				}
				return response.json();
			} )
			.then( function ( data ) {
				try {
					localStorage.setItem( 'qp_liked_' + postId, 'true' );
				} catch ( e ) {
					// localStorage unavailable — state won't persist across page loads.
				}
				applyLikedToAllBlocks( postId, true, data.count );
				MicroModal.close( MODAL_ID );
			} )
			.catch( function ( err ) {
				errorEl.textContent =
					err.message ||
					__(
						'Something went wrong. Please try again.',
						'quickpostr'
					);
				errorEl.hidden = false;
			} )
			.finally( function () {
				submitBtn.disabled = false;
			} );
	}

	function applyLikedToAllBlocks( postId, liked, count ) {
		document
			.querySelectorAll( '.qp-like-post[data-post-id="' + postId + '"]' )
			.forEach( function ( wrapper ) {
				const button = wrapper.querySelector( '.qp-like-post__button' );
				const countEl = wrapper.querySelector( '.qp-like-post__count' );
				if ( button ) {
					button.classList.toggle( 'is-liked', liked );
					button.setAttribute(
						'aria-pressed',
						liked ? 'true' : 'false'
					);
					button.setAttribute(
						'aria-label',
						liked
							? __( 'Unlike this post', 'quickpostr' )
							: __( 'Like this post', 'quickpostr' )
					);
				}
				if ( countEl ) {
					countEl.textContent = count;
				}
			} );
	}

	// ── Per-block init ─────────────────────────────────────────────────────────

	function initLikePost( wrapper ) {
		const button = wrapper.querySelector( '.qp-like-post__button' );
		const countEl = wrapper.querySelector( '.qp-like-post__count' );
		if ( ! button || ! countEl ) {
			return;
		}

		const postId = wrapper.dataset.postId;
		const loggedIn = wrapper.dataset.loggedIn === 'true';
		let liked = wrapper.dataset.liked === 'true';
		let count = parseInt( wrapper.dataset.count, 10 ) || 0;
		let pending = false;

		// For anonymous users, restore liked state from localStorage.
		if ( ! loggedIn ) {
			try {
				if ( localStorage.getItem( 'qp_liked_' + postId ) === 'true' ) {
					liked = true;
					button.classList.add( 'is-liked' );
					button.setAttribute( 'aria-pressed', 'true' );
					button.setAttribute(
						'aria-label',
						__( 'Unlike this post', 'quickpostr' )
					);
				}
			} catch ( e ) {
				// localStorage unavailable.
			}
		}

		button.addEventListener( 'click', function () {
			if ( ! loggedIn ) {
				if ( liked ) {
					return; // Anonymous users cannot unlike.
				}
				openModal( wrapper );
				return;
			}

			// Logged-in toggle.
			if ( pending ) {
				return;
			}
			pending = true;

			const prevLiked = liked;
			const prevCount = count;

			liked = ! liked;
			count = liked ? count + 1 : count - 1;
			button.classList.toggle( 'is-liked', liked );
			button.setAttribute( 'aria-pressed', liked ? 'true' : 'false' );
			button.setAttribute(
				'aria-label',
				liked ? 'Unlike this post' : 'Like this post'
			);
			countEl.textContent = count;

			fetch( config.restUrl + 'quickpostr/v1/posts/' + postId + '/like', {
				method: 'POST',
				headers: {
					'X-WP-Nonce': config.nonce,
					'Content-Type': 'application/json',
				},
			} )
				.then( function ( response ) {
					if ( ! response.ok ) {
						throw new Error( 'Request failed' );
					}
					return response.json();
				} )
				.then( function ( data ) {
					liked = data.liked;
					count = data.count;
					button.classList.toggle( 'is-liked', liked );
					button.setAttribute(
						'aria-pressed',
						liked ? 'true' : 'false'
					);
					button.setAttribute(
						'aria-label',
						liked
							? __( 'Unlike this post', 'quickpostr' )
							: __( 'Like this post', 'quickpostr' )
					);
					countEl.textContent = count;
				} )
				.catch( function () {
					liked = prevLiked;
					count = prevCount;
					button.classList.toggle( 'is-liked', prevLiked );
					button.setAttribute(
						'aria-pressed',
						prevLiked ? 'true' : 'false'
					);
					button.setAttribute(
						'aria-label',
						prevLiked
							? __( 'Unlike this post', 'quickpostr' )
							: __( 'Like this post', 'quickpostr' )
					);
					countEl.textContent = prevCount;
				} )
				.finally( function () {
					pending = false;
				} );
		} );
	}

	function init() {
		document.querySelectorAll( '.qp-like-post' ).forEach( initLikePost );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
