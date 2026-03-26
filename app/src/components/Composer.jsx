import React, { useState } from 'react';
import TextComposer from './TextComposer.jsx';
import PhotoComposer from './PhotoComposer.jsx';

/**
 * Root composer shell — segmented mode switcher + header with logout.
 *
 * Props:
 *   creds     object  — auth credentials passed down to composers
 *   user      object  — WP user object
 *   onLogout  ()=>void
 */
export default function Composer({ creds, user, onLogout }) {
  const [mode, setMode] = useState('text');

  return (
    <div className="composer">
      <header className="composer__header">
        <span className="composer__brand">QuickPostr</span>
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

      <main className="composer__body">
        {mode === 'text'
          ? <TextComposer creds={creds} />
          : <PhotoComposer creds={creds} />
        }
      </main>
    </div>
  );
}
