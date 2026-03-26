import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getFeed } from '../hooks/useWpApi.js';
import PostCard from './PostCard.jsx';

const FORMATS = [
  { value: '',       label: 'All' },
  { value: 'status', label: 'Status' },
  { value: 'photo',  label: 'Photo' },
];

/**
 * Feed component — shows the user's QuickPostr posts with format filtering
 * and load-more pagination.
 *
 * Exposes a `prepend(post)` method via ref for optimistic posting.
 *
 * Props:
 *   creds  object — auth credentials
 */
const Feed = forwardRef(function Feed({ creds }, ref) {
  const [posts,       setPosts]       = useState([]);
  const [format,      setFormat]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(null);

  // Expose prepend() to parent via ref.
  useImperativeHandle(ref, () => ({
    prepend(post) {
      setPosts((prev) => [post, ...prev]);
    },
  }));

  const loadFeed = useCallback(async (nextFormat, nextPage, append = false) => {
    if (append) setLoadingMore(true);
    else        setLoading(true);
    setError(null);

    try {
      const response = await getFeed(
        { format: nextFormat || undefined, page: nextPage, perPage: 20 },
        creds
      );
      // getFeed returns the parsed JSON array; headers are on the Response object.
      // useWpApi returns parsed body only, so totalPages comes via X-WP-TotalPages
      // which we stash on the array if available (see note below).
      const items      = Array.isArray(response) ? response : [];
      const total      = response?._totalPages ?? 1;

      setPosts((prev) => append ? [...prev, ...items] : items);
      setTotalPages(total);
    } catch (err) {
      setError(err.message ?? 'Failed to load posts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [creds]);

  // Reload when format changes.
  useEffect(() => {
    setPage(1);
    loadFeed(format, 1, false);
  }, [format]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadFeed(format, next, true);
  }

  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <section className="feed" aria-label="Your posts">
      <div className="feed__filters" role="tablist" aria-label="Filter by format">
        {FORMATS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={format === value}
            className={`feed__filter-btn${format === value ? ' feed__filter-btn--active' : ''}`}
            onClick={() => setFormat(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="feed__loading" aria-label="Loading posts">
          <span className="app-loading__spinner" aria-hidden="true" />
        </div>
      )}

      {!loading && error && (
        <p className="feed__error" role="alert">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="feed__empty">
          <p>Nothing here yet.</p>
          <p>Write your first post above.</p>
        </div>
      )}

      {posts.length > 0 && (
        <ul className="feed__list" aria-live="polite">
          {posts.map((post) => (
            <li key={post.id} className="feed__item">
              <PostCard post={post} creds={creds} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}

      {!loading && page < totalPages && (
        <button
          className="feed__load-more"
          onClick={handleLoadMore}
          disabled={loadingMore}
          type="button"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  );
});

export default Feed;
