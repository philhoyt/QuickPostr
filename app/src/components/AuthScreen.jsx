import React, { useState } from 'react';

const config = window.quickpostrConfig ?? {};

/**
 * First-run Application Password setup screen.
 *
 * Props:
 *   onLogin(username, appPassword) → Promise<void>  — from useAuth
 */
export default function AuthScreen({ onLogin }) {
  const [username,    setUsername]    = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const siteUrl     = config.siteUrl ?? window.location.origin;
  const profileLink = `${siteUrl}/wp-admin/profile.php#application-passwords-section`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !appPassword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onLogin(username.trim(), appPassword.trim());
      // On success, useAuth updates isAuthenticated and App re-renders.
    } catch (err) {
      setError(err.status === 401
        ? 'Incorrect username or Application Password.'
        : (err.message ?? 'Could not connect. Check your credentials and try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__card">
        <h1 className="auth-screen__title">QuickPostr</h1>
        <p className="auth-screen__subtitle">Connect to your WordPress site</p>

        <div className="auth-screen__site">
          <span className="auth-screen__site-label">Site</span>
          <span className="auth-screen__site-url">{siteUrl}</span>
        </div>

        <form className="auth-screen__form" onSubmit={handleSubmit} noValidate>
          <label className="auth-screen__label" htmlFor="qp-username">
            WordPress Username
          </label>
          <input
            id="qp-username"
            className="auth-screen__input"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            aria-label="WordPress username"
          />

          <label className="auth-screen__label" htmlFor="qp-app-password">
            Application Password
          </label>
          <input
            id="qp-app-password"
            className="auth-screen__input"
            type="password"
            autoComplete="current-password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            disabled={loading}
            required
            aria-label="Application Password"
          />

          <a
            className="auth-screen__generate-link"
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Generate an Application Password →
          </a>

          {error && (
            <p className="auth-screen__error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-screen__submit"
            type="submit"
            disabled={loading || !username.trim() || !appPassword.trim()}
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}
