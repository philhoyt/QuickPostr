import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateTitle } from '../hooks/useAutoTitle.js';
import { createPost } from '../hooks/useWpApi.js';
import SlugPreview from './SlugPreview.jsx';
import TagInput from './TagInput.jsx';

const config       = window.quickpostrConfig ?? {};
const DRAFT_KEY    = 'quickpostr_draft_text';
const DRAFT_DELAY  = 500;

/**
 * Text / status post composer.
 *
 * Props:
 *   creds     object            — auth credentials
 *   onSuccess (wpPost) => void  — called with the created post object
 */
export default function TextComposer({ creds, onSuccess }) {
  const [text,               setTextValue]         = useState(
    () => localStorage.getItem(DRAFT_KEY) ?? ''
  );
  const [selectedTags,       setSelectedTags]       = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [flash,      setFlash]      = useState(false);
  const draftTimer = useRef(null);

  const title         = generateTitle('text', text, '');
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // Auto-save draft to localStorage (debounced).
  useEffect(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      if (text) {
        localStorage.setItem(DRAFT_KEY, text);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, DRAFT_DELAY);
    return () => clearTimeout(draftTimer.current);
  }, [text]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const wpPost = await createPost({
        title,
        content:    `<p>${text.trim().replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
        status:     defaultStatus,
        format:     'status',
        tags:       selectedTags,
        categories: selectedCategories,
        meta:       { _quickpostr_post: '1' },
      }, creds);

      localStorage.removeItem(DRAFT_KEY);
      setTextValue('');
      setSelectedTags([]);
      setSelectedCategories(
        config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
      );
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
      onSuccess?.(wpPost);
    } catch (err) {
      setError(err.message ?? 'Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [text, title, selectedTags, selectedCategories, creds, submitting, defaultStatus, onSuccess]);

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
        autoFocus
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
          type="button"
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
