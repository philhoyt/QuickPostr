import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import AuthScreen from './components/AuthScreen.jsx';
import Composer from './components/Composer.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';

const config = window.quickpostrConfig ?? {};

export default function App() {
  const { isAuthenticated, creds, user, loading, login, logout } = useAuth();

  // Register service worker.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${config.buildUrl ?? '/'}sw.js`;
      navigator.serviceWorker.register(swUrl).catch(() => {
        // SW registration failure is non-fatal.
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="app-loading" aria-label="Loading QuickPostr">
        <span className="app-loading__spinner" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} />;
  }

  return (
    <>
      <Composer creds={creds} user={user} onLogout={logout} />
      <OfflineBanner />
    </>
  );
}
