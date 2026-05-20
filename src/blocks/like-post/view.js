/**
 * Like Post — front-end view script.
 *
 * Handles optimistic heart-toggle on click. Reads initial state from
 * data-liked / data-count on the wrapper; posts to the REST toggle endpoint.
 * Reverts the UI on failure.
 */
( function () {
	const config = window.quickpostrLikePost;
	if ( ! config ) {
		return;
	}

	function initLikePost( wrapper ) {
		const button = wrapper.querySelector( '.qp-like-post__button' );
		const countEl = wrapper.querySelector( '.qp-like-post__count' );
		if ( ! button || ! countEl ) {
			return;
		}

		const postId = wrapper.dataset.postId;
		let liked = wrapper.dataset.liked === 'true';
		let count = parseInt( wrapper.dataset.count, 10 ) || 0;
		let pending = false;

		function apply( newLiked, newCount ) {
			liked = newLiked;
			count = newCount;
			button.classList.toggle( 'is-liked', liked );
			button.setAttribute( 'aria-pressed', liked ? 'true' : 'false' );
			button.setAttribute(
				'aria-label',
				liked ? 'Unlike this post' : 'Like this post'
			);
			countEl.textContent = newCount;
		}

		button.addEventListener( 'click', function () {
			if ( pending ) {
				return;
			}
			pending = true;

			const prevLiked = liked;
			const prevCount = count;

			// Optimistic update.
			apply( ! liked, liked ? count - 1 : count + 1 );

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
					apply( data.liked, data.count );
				} )
				.catch( function () {
					apply( prevLiked, prevCount );
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
