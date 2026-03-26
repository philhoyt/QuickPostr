import React, { useState, useEffect } from 'react';

/**
 * Listens for OFFLINE_POST_FAILED messages from the service worker and
 * shows a dismissible banner.
 */
export default function OfflineBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    function handleMessage(event) {
      if (event.data?.type === 'OFFLINE_POST_FAILED') {
        setVisible(true);
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  if (!visible) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <span className="offline-banner__text">You're offline — post not sent.</span>
      <button
        className="offline-banner__dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss offline notice"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
