import { useState, useEffect, useCallback } from 'react';
import { getMe } from './useWpApi.js';

const STORAGE_KEY = 'quickpostr_auth';
const config      = window.quickpostrConfig ?? {};

/**
 * Read stored credentials from localStorage.
 * @returns {{ username: string, appPassword: string, siteUrl: string } | null}
 */
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Auth hook — manages credential storage, validation, and logout.
 *
 * Returns:
 *   isAuthenticated  boolean
 *   user             WP user object (from /wp/v2/users/me) or null
 *   creds            { username, appPassword, siteUrl } or null
 *   loading          boolean (true while verifying on mount)
 *   error            string | null
 *   login(username, appPassword) → Promise<void>  throws on failure
 *   logout()
 */
export function useAuth() {
  const [creds,           setCreds]           = useState(readStorage);
  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // On mount: try cookie-auth first, then stored app-password credentials.
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setLoading(true);
      setError(null);

      // 1. Cookie auth via injected nonce (user already logged into WP).
      if (config.nonce) {
        try {
          const me = await getMe(null); // null creds → uses nonce header
          if (!cancelled) {
            setUser(me);
            setLoading(false);
            return;
          }
        } catch {
          // Cookie auth failed; fall through to App Password check.
        }
      }

      // 2. Stored Application Password credentials.
      const stored = readStorage();
      if (stored) {
        try {
          const me = await getMe(stored);
          if (!cancelled) {
            setCreds(stored);
            setUser(me);
          }
        } catch {
          // Stored credentials are stale — clear them.
          localStorage.removeItem(STORAGE_KEY);
          if (!cancelled) setCreds(null);
        }
      }

      if (!cancelled) setLoading(false);
    }

    verify();
    return () => { cancelled = true; };
  }, []);

  /**
   * Attempt login with an Application Password.
   * Persists credentials on success; throws on failure.
   */
  const login = useCallback(async (username, appPassword) => {
    setError(null);
    const newCreds = {
      username,
      appPassword,
      siteUrl: config.siteUrl ?? window.location.origin,
    };

    const me = await getMe(newCreds); // throws on 401 / network error

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));
    setCreds(newCreds);
    setUser(me);
  }, []);

  /**
   * Clear all stored credentials and reset state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCreds(null);
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = Boolean(user);

  return { isAuthenticated, user, creds, loading, error, login, logout };
}
