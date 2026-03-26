import React, { useState, useEffect, useRef, useId } from 'react';
import { getCategories, getTags } from '../hooks/useWpApi.js';

/**
 * Tag and category input with typeahead.
 *
 * Props:
 *   creds          object  — auth credentials
 *   selectedTags       number[]
 *   selectedCategories number[]
 *   onTagsChange       (ids: number[]) => void
 *   onCategoriesChange (ids: number[]) => void
 */
export default function TagInput({
  creds,
  selectedTags,
  selectedCategories,
  onTagsChange,
  onCategoriesChange,
}) {
  const [allTags,       setAllTags]       = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [tagQuery,      setTagQuery]      = useState('');
  const [catQuery,      setCatQuery]      = useState('');
  const tagId = useId();
  const catId = useId();

  // Fetch taxonomy data once on mount.
  useEffect(() => {
    getCategories(creds).then(setAllCategories).catch(() => {});
    getTags(creds).then(setAllTags).catch(() => {});
  }, [creds]);

  function toggleItem(id, selected, onChange) {
    if (selected.includes(id)) {
      onChange(selected.filter((i) => i !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function filteredItems(all, selected, query) {
    const q = query.toLowerCase();
    return all.filter((item) =>
      item.name.toLowerCase().includes(q) && !selected.includes(item.id)
    );
  }

  return (
    <div className="tag-input">
      {/* Categories */}
      <TaxonomyField
        label="Categories"
        inputId={catId}
        all={allCategories}
        selected={selectedCategories}
        query={catQuery}
        onQueryChange={setCatQuery}
        onToggle={(id) => toggleItem(id, selectedCategories, onCategoriesChange)}
        filtered={filteredItems(allCategories, selectedCategories, catQuery)}
      />

      {/* Tags */}
      <TaxonomyField
        label="Tags"
        inputId={tagId}
        all={allTags}
        selected={selectedTags}
        query={tagQuery}
        onQueryChange={setTagQuery}
        onToggle={(id) => toggleItem(id, selectedTags, onTagsChange)}
        filtered={filteredItems(allTags, selectedTags, tagQuery)}
      />
    </div>
  );
}

function TaxonomyField({ label, inputId, all, selected, query, onQueryChange, onToggle, filtered }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedItems = all.filter((item) => selected.includes(item.id));

  return (
    <div className="tag-input__field" ref={ref}>
      <div className="tag-input__chips">
        {selectedItems.map((item) => (
          <button
            key={item.id}
            className="tag-input__chip"
            onClick={() => onToggle(item.id)}
            aria-label={`Remove ${item.name}`}
            type="button"
          >
            {item.name} ×
          </button>
        ))}
        <div className="tag-input__search-wrap">
          <label className="tag-input__label" htmlFor={inputId}>{label}</label>
          <input
            id={inputId}
            className="tag-input__search"
            type="text"
            placeholder={label}
            value={query}
            onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            aria-label={`Search ${label}`}
            aria-expanded={open}
            role="combobox"
            aria-autocomplete="list"
          />
        </div>
      </div>

      {open && filtered.length > 0 && (
        <ul className="tag-input__dropdown" role="listbox">
          {filtered.slice(0, 10).map((item) => (
            <li key={item.id} role="option" aria-selected="false">
              <button
                type="button"
                className="tag-input__option"
                onMouseDown={(e) => { e.preventDefault(); onToggle(item.id); onQueryChange(''); setOpen(false); }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
