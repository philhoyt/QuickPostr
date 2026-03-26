/**
 * Auto-title generation logic.
 *
 * WordPress requires a title. Users never write one. We generate it silently.
 */

/**
 * Truncate text to maxLen characters, breaking on a word boundary if possible.
 *
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  const slice    = text.substring(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 30 ? slice.substring(0, lastSpace) : slice) + '\u2026';
}

/**
 * Generate a post title from composer state.
 *
 * @param {'text'|'photo'} mode
 * @param {string} text      Body text (text mode)
 * @param {string} caption   Caption (photo mode)
 * @param {string} [date]    ISO date string or display string; defaults to today
 * @returns {string}
 */
export function generateTitle(mode, text, caption, date) {
  const displayDate = date ?? new Date().toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });

  if (mode === 'text') {
    const clean = text.replace(/\n/g, ' ').trim();
    if (!clean) return `Status \u2014 ${displayDate}`;
    return truncate(clean, 55);
  }

  if (mode === 'photo') {
    const clean = caption.trim();
    if (clean) return truncate(clean, 55);
    return `Photo \u2014 ${displayDate}`;
  }

  return `Post \u2014 ${displayDate}`;
}
