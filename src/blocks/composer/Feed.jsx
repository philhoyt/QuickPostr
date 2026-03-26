import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getFeed } from './api.js';
import PostCard from './PostCard.jsx';

/**
 * Feed — scrollable list of the current user's posts.
 *
 * Exposes a `prepend(post)` method via ref so Composer can optimistically
 * add new posts without a page reload.
 *
 * @type {React.ForwardRefExoticComponent}
 */
const Feed = forwardRef( function Feed( _props, ref ) {
	const [ posts,       setPosts ]       = useState( [] );
	const [ page,        setPage ]        = useState( 1 );
	const [ totalPages,  setTotalPages ]  = useState( 1 );
	const [ loading,     setLoading ]     = useState( true );
	const [ loadingMore, setLoadingMore ] = useState( false );
	const [ error,       setError ]       = useState( null );
	const [ activeFormat, setActiveFormat ] = useState( 'all' );

	// Expose prepend() to parent via feedRef.
	useImperativeHandle( ref, () => ( {
		prepend( post ) {
			// Skip if the new post doesn't match the active format filter.
			if ( activeFormat !== 'all' ) {
				const postFormat = post.format === 'image' ? 'photo' : ( post.format || 'status' );
				if ( postFormat !== activeFormat ) {
					return;
				}
			}
			setPosts( ( prev ) => [ post, ...prev ] );
		},
	} ), [ activeFormat ] );

	// Reload when the format filter changes.
	useEffect( () => {
		setLoading( true );
		setError( null );
		setPage( 1 );

		getFeed( { format: activeFormat } )
			.then( ( { posts: newPosts, totalPages: tp } ) => {
				setPosts( newPosts );
				setTotalPages( tp );
			} )
			.catch( ( err ) => setError( err.message ?? 'Failed to load posts.' ) )
			.finally( () => setLoading( false ) );
	}, [ activeFormat ] );

	function handleLoadMore() {
		const nextPage = page + 1;
		setLoadingMore( true );

		getFeed( { format: activeFormat, page: nextPage } )
			.then( ( { posts: morePosts, totalPages: tp } ) => {
				setPosts( ( prev ) => [ ...prev, ...morePosts ] );
				setPage( nextPage );
				setTotalPages( tp );
			} )
			.catch( ( err ) => setError( err.message ?? 'Failed to load more posts.' ) )
			.finally( () => setLoadingMore( false ) );
	}

	function handleDelete( id ) {
		setPosts( ( prev ) => prev.filter( ( p ) => p.id !== id ) );
	}

	const filters = [ 'all', 'status', 'photo' ];
	const filterLabels = { all: 'All', status: 'Status', photo: 'Photos' };

	return (
		<div className="qp-feed">
			<div className="qp-feed__filters" role="tablist" aria-label="Filter posts">
				{ filters.map( ( f ) => (
					<button
						key={ f }
						role="tab"
						aria-selected={ activeFormat === f }
						className={ `qp-feed__filter${ activeFormat === f ? ' qp-feed__filter--active' : '' }` }
						onClick={ () => setActiveFormat( f ) }
						type="button"
					>
						{ filterLabels[ f ] }
					</button>
				) ) }
			</div>

			{ loading && (
				<p className="qp-feed__loading">Loading…</p>
			) }

			{ ! loading && error && (
				<p className="qp-feed__error" role="alert">{ error }</p>
			) }

			{ ! loading && ! error && posts.length === 0 && (
				<p className="qp-feed__empty">Nothing here yet. Write your first post.</p>
			) }

			{ posts.length > 0 && (
				<ul className="qp-feed__list">
					{ posts.map( ( post ) => (
						<li key={ post.id }>
							<PostCard post={ post } onDelete={ handleDelete } />
						</li>
					) ) }
				</ul>
			) }

			{ ! loading && page < totalPages && (
				<button
					className="qp-feed__load-more"
					onClick={ handleLoadMore }
					disabled={ loadingMore }
					type="button"
				>
					{ loadingMore ? 'Loading…' : 'Load more' }
				</button>
			) }
		</div>
	);
} );

export default Feed;
