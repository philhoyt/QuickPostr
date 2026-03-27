/**
 * Edit Post block — view script.
 *
 * On click: fetches the post via REST, then dispatches a cancelable
 * 'quickpostr:edit-post' custom event on document. If the Composer block is
 * on the page it listens for this event, calls e.preventDefault() to signal
 * it handled it, and pre-fills itself. If no Composer is present (or it hasn't
 * loaded yet), the event goes unhandled and we fall back to navigating to
 * ?qp-edit={id} on the home URL.
 *
 * @package
 */
( function () {
	const cfg = window.quickpostrEditPost ?? {};

	document.querySelectorAll( '.qp-edit-post' ).forEach( function ( wrapper ) {
		const btn = wrapper.querySelector( '.qp-edit-post__btn' );
		const postId = parseInt( wrapper.dataset.postId, 10 );

		if ( ! btn || ! postId ) {
			return;
		}

		btn.addEventListener( 'click', function () {
			btn.disabled = true;
			btn.textContent = 'Loading…';

			const url =
				cfg.restUrl +
				'wp/v2/posts/' +
				postId +
				'?context=edit&_fields=id,title,content,format,status,featured_media,tags,categories';

			fetch( url, {
				headers: {
					'X-WP-Nonce': cfg.nonce,
				},
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
						// Composer not on this page — navigate to it.
						window.location.href =
							( cfg.homeUrl || '/' ) + '?qp-edit=' + postId;
					} else {
						// Composer handled it — scroll to top of page.
						window.scrollTo( { top: 0, behavior: 'smooth' } );
						btn.disabled = false;
						btn.textContent = 'Edit';
					}
				} )
				.catch( function () {
					btn.disabled = false;
					btn.textContent = 'Edit';
				} );
		} );
	} );
} )();
