import React, { useState } from 'react';
import { deletePost } from '../hooks/useWpApi.js';
import { relativeTime } from '../utils/relativeTime.js';

/**
 * A single post card in the feed.
 *
 * Props:
 *   post     object  — feed post shape
 *   creds    object  — auth credentials
 *   onDelete (id) => void
 */
export default function PostCard({ post, creds, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await deletePost(post.id, creds);
      onDelete(post.id);
    } catch {
      setDeleting(false);
    }
  }

  const formatLabel = post.format === 'image' ? 'Photo' : 'Status';

  return (
    <article className={`post-card${deleting ? ' post-card--deleting' : ''}`} aria-label={`${formatLabel} post`}>
      {post.featured_media_url && (
        <img
          className="post-card__image"
          src={post.featured_media_url}
          alt=""
          loading="lazy"
        />
      )}

      {post.content && (
        <div
          className="post-card__content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      <footer className="post-card__footer">
        <div className="post-card__meta">
          <time
            className="post-card__timestamp"
            dateTime={post.date}
            title={new Date(post.date + 'Z').toLocaleString()}
          >
            {relativeTime(post.date)}
          </time>
          <span className="post-card__format-badge">{formatLabel}</span>
          {post.status === 'draft' && (
            <span className="post-card__draft-badge">Draft</span>
          )}
        </div>

        <button
          className="post-card__delete"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete post"
          type="button"
        >
          {deleting ? '…' : '×'}
        </button>
      </footer>
    </article>
  );
}
