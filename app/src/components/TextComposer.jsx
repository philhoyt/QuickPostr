import React, { useState, useCallback } from 'react';
import { generateTitle } from '../hooks/useAutoTitle.js';
import { createPost } from '../hooks/useWpApi.js';
import SlugPreview from './SlugPreview.jsx';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};

/**
 * Text / status post composer.
 *
 * Props:
 *   creds     object  — auth credentials
 *   onSuccess ()=>void — called after a post is published
 */
export default function TextComposer({ creds, onSuccess }) {
  const [text,               setTextValue]       = useState('');
  const [selectedTags,       setSelectedTags]       = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [flash,      setFlash]      = useState(false);

  const title        = generateTitle('text', text, '');
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await createPost({
        title,
        content:    `<p>${text.trim().replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
        status:     defaultStatus,
        format:     'status',
        tags:       selectedTags,
        categories: selectedCategories,
        meta:       { _quickpostr_post: '1' },
      }, creds);

      setTextValue('');
      setSelectedTags([]);
      setSelectedCategories(
        config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
      );
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
      onSuccess?.();
    } catch (err) {
      setError(err.message ?? 'Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [text, title, selectedTags, selectedCategories, creds, submitting, defaultStatus, onSuccess]);

  // Allow Ctrl/Cmd+Enter to submit.
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="text-composer">
      <textarea
        className="text-composer__textarea"
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setTextValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
        aria-label="Post content"
        rows={6}
      />

      <SlugPreview title={title} />

      <TagInput
        creds={creds}
        selectedTags={selectedTags}
        selectedCategories={selectedCategories}
        onTagsChange={setSelectedTags}
        onCategoriesChange={setSelectedCategories}
      />

      {error && (
        <p className="composer-error" role="alert">{error}</p>
      )}

      <footer className="text-composer__footer">
        <span className="text-composer__char-count" aria-live="polite">
          {text.length}
        </span>
        <button
          className="composer-submit"
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          aria-label={submitting ? 'Publishing…' : 'Publish post'}
        >
          {submitting ? 'Publishing…' : defaultStatus === 'draft' ? 'Save Draft' : 'Post'}
        </button>
      </footer>

      {flash && (
        <div className="composer-flash" role="status" aria-live="assertive">
          Posted!
        </div>
      )}
    </div>
  );
}
