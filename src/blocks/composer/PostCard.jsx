import React, { useState } from 'react';
import { deletePost } from './api.js';
import { relativeTime } from './relativeTime.js';

/**
 * Renders a single post in the feed.
 *
 * Props:
 *   post     {object}           — normalized post object from getFeed / shapePost
 *   onDelete (id: number) => void
 */
export default function PostCard( { post, onDelete } ) {
	const [ deleting, setDeleting ] = useState( false );

	const formatLabel = post.format === 'image' ? 'photo' : ( post.format || 'status' );

	async function handleDelete() {
		if ( ! window.confirm( 'Delete this post?' ) ) {
			return;
		}
		setDeleting( true );
		try {
			await deletePost( post.id );
			onDelete( post.id );
		} catch ( err ) {
			// eslint-disable-next-line no-alert
			window.alert( 'Failed to delete: ' + ( err.message ?? 'Unknown error' ) );
			setDeleting( false );
		}
	}

	return (
		<article className="qp-post-card">
			{ post.featured_media_url && (
				<img
					className="qp-post-card__image"
					src={ post.featured_media_url }
					alt=""
				/>
			) }

			{ post.content && (
				<div
					className="qp-post-card__content"
					// Content is sanitized server-side by wpautop before storage.
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ { __html: post.content } }
				/>
			) }

			<footer className="qp-post-card__footer">
				<div className="qp-post-card__meta">
					{ post.date_gmt && (
						<time
							className="qp-post-card__timestamp"
							dateTime={ post.date_gmt.endsWith( 'Z' ) ? post.date_gmt : post.date_gmt + 'Z' }
						>
							{ relativeTime( post.date_gmt ) }
						</time>
					) }
					<span className="qp-post-card__format-badge">{ formatLabel }</span>
				</div>

				<button
					type="button"
					className="qp-post-card__delete"
					onClick={ handleDelete }
					disabled={ deleting }
					aria-label="Delete post"
				>
					{ deleting ? '…' : 'Delete' }
				</button>
			</footer>
		</article>
	);
}
