/**
 * Format a UTC ISO date string as a human-readable relative time.
 *
 * < 1 min  → "just now"
 * < 1 hr   → "5m"
 * < 24 hr  → "2h"
 * < 1 yr   → "Mar 26"
 * >= 1 yr  → "Mar 26, 2025"
 *
 * @param {string} isoString  UTC ISO-8601 date string (e.g. "2026-03-26T14:00:00")
 * @returns {string}
 */
export function relativeTime(isoString) {
  const date    = new Date(isoString + 'Z'); // treat as UTC
  const now     = Date.now();
  const diffMs  = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);

  if (diffSec < 60)  return 'just now';
  if (diffMin < 60)  return `${diffMin}m`;
  if (diffHr  < 24)  return `${diffHr}h`;

  const opts = { month: 'short', day: 'numeric' };
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 365) {
    return date.toLocaleDateString('en-US', opts);
  }
  return date.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
}
