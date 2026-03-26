import React from 'react';

const config = window.quickpostrConfig ?? {};

/**
 * Read-only row showing the auto-generated post title (used as slug source).
 * Hidden when showSlugPreview is disabled in plugin settings.
 *
 * Props:
 *   title  string  — the generated title to display
 */
export default function SlugPreview({ title }) {
  if (config.settings?.showSlugPreview === false) return null;
  if (!title) return null;

  return (
    <div className="slug-preview" aria-live="polite" aria-label="Auto-generated title">
      <span className="slug-preview__label">Title</span>
      <span className="slug-preview__value">{title}</span>
    </div>
  );
}
