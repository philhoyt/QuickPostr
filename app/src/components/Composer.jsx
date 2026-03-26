import React, { useState, useRef } from 'react';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';
import Feed from './Feed.jsx';

/**
 * Shape a raw WP REST post response into the feed card format.
 */
function shapePost(wpPost) {
  return {
    id:                 wpPost.id,
    title:              wpPost.title?.raw ?? '',
    content:            wpPost.content?.rendered ?? '',
    date:               wpPost.date_gmt ?? wpPost.date,
    status:             wpPost.status,
    format:             wpPost.format ?? 'standard',
    link:               wpPost.link,
    featured_media_url: '',
  };
}

/**
 * Root composer shell — header, mode switcher, composers, and feed.
 *
 * Props:
 *   creds     object  — auth credentials
 *   user      object  — WP user object (name, avatar_urls)
 *   onLogout  ()=>void
 */
export default function Composer({ creds, user, onLogout }) {
  const [mode, setMode] = useState('text');
  const feedRef         = useRef(null);

  function handleSuccess(wpPost) {
    if (wpPost && feedRef.current) {
      feedRef.current.prepend(shapePost(wpPost));
    }
  }

  // Avatar: use WP-generated 48px URL, or fall back to initials.
  const avatarUrl = user?.avatar_urls?.['48'];
  const initials  = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="composer">
      <header className="composer__header">
        <div className="composer__identity">
          <div className="composer__avatar" aria-hidden="true">
            {avatarUrl
              ? <img src={avatarUrl} alt="" width="32" height="32" />
              : <span>{initials}</span>
            }
          </div>
          <span className="composer__user-name">{user?.name}</span>
        </div>
        <button
          className="composer__logout"
          onClick={onLogout}
          aria-label="Log out"
          type="button"
        >
          Log out
        </button>
      </header>

      <div className="composer__mode-bar" role="tablist" aria-label="Post type">
        {['text', 'photo'].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={`composer__mode-btn${mode === m ? ' composer__mode-btn--active' : ''}`}
            onClick={() => setMode(m)}
            type="button"
          >
            {m === 'text' ? 'Status' : 'Photo'}
          </button>
        ))}
      </div>

      <div className="composer__body">
        {mode === 'text'
          ? <TextComposer creds={creds} onSuccess={handleSuccess} />
          : <PhotoComposer creds={creds} onSuccess={handleSuccess} />
        }
      </div>

      <Feed ref={feedRef} creds={creds} />
    </div>
  );
}
