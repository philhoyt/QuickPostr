import React, { useState, useRef, useCallback } from 'react';
import { generateTitle } from '../hooks/useAutoTitle.js';
import { uploadMedia, createPost } from '../hooks/useWpApi.js';
import SlugPreview from './SlugPreview.jsx';
import TagInput from './TagInput.jsx';

const config = window.quickpostrConfig ?? {};
const MAX_RETRIES = 3;

/**
 * Photo post composer — tap-to-upload, image preview, caption, publish.
 *
 * Props:
 *   creds     object  — auth credentials
 *   onSuccess ()=>void
 */
export default function PhotoComposer({ creds, onSuccess }) {
  const [file,               setFile]               = useState(null);
  const [preview,            setPreview]            = useState(null);
  const [caption,            setCaption]            = useState('');
  const [selectedTags,       setSelectedTags]       = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
  );
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0); // 0-100
  const [error,       setError]       = useState(null);
  const [flash,       setFlash]       = useState(false);
  const inputRef = useRef(null);

  const title         = generateTitle('photo', '', caption);
  const defaultStatus = config.settings?.defaultStatus ?? 'publish';

  // ── File selection ──────────────────────────────────────────────────────
  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) pickFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith('image/')) pickFile(dropped);
  }

  function pickFile(f) {
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  // ── Upload with retry ───────────────────────────────────────────────────
  async function uploadWithRetry(f, attempt = 1) {
    try {
      setProgress(Math.round((attempt / MAX_RETRIES) * 60));
      return await uploadMedia(f, creds);
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
        return uploadWithRetry(f, attempt + 1);
      }
      throw err;
    }
  }

  // ── Publish ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const media = await uploadWithRetry(file);
      setProgress(75);

      await createPost({
        title,
        content:        caption.trim()
                          ? `<p>${caption.trim()}</p>`
                          : '',
        status:         defaultStatus,
        format:         'image',
        featured_media: media.id,
        tags:           selectedTags,
        categories:     selectedCategories,
        meta:           { _quickpostr_post: '1' },
      }, creds);

      setProgress(100);

      // Reset form.
      clearFile();
      setSelectedTags([]);
      setSelectedCategories(
        config.settings?.defaultCategory ? [config.settings.defaultCategory] : []
      );
      setProgress(0);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
      onSuccess?.();
    } catch (err) {
      setError(err.message ?? 'Failed to publish. Tap to retry.');
    } finally {
      setUploading(false);
    }
  }, [file, caption, title, selectedTags, selectedCategories, creds, uploading, defaultStatus, onSuccess]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="photo-composer">
      {/* Upload zone / preview */}
      {!preview ? (
        <label
          className="photo-composer__upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          aria-label="Tap to select a photo"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="photo-composer__file-input"
            onChange={handleFileChange}
            aria-label="Choose photo"
          />
          <span className="photo-composer__upload-icon" aria-hidden="true">+</span>
          <span className="photo-composer__upload-hint">Tap to add a photo</span>
        </label>
      ) : (
        <div className="photo-composer__preview-wrap">
          <img
            className="photo-composer__preview"
            src={preview}
            alt="Selected photo preview"
          />
          <button
            className="photo-composer__change"
            type="button"
            onClick={clearFile}
            aria-label="Remove photo and choose a different one"
          >
            Change photo
          </button>
          {uploading && (
            <div
              className="photo-composer__progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            >
              <div
                className="photo-composer__progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <textarea
        className="photo-composer__caption"
        placeholder="Add a caption… (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        disabled={uploading}
        aria-label="Photo caption"
        rows={3}
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

      <footer className="photo-composer__footer">
        <button
          className="composer-submit"
          onClick={handleSubmit}
          disabled={!file || uploading}
          aria-label={uploading ? 'Uploading…' : 'Publish photo post'}
          type="button"
        >
          {uploading ? 'Uploading…' : defaultStatus === 'draft' ? 'Save Draft' : 'Post'}
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
