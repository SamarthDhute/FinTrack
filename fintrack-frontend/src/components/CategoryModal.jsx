import React, { useState, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';

export const CategoryModal = ({ isOpen, onClose, onSave, category = null, isSaving }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    } else {
      setName('');
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Category name cannot exceed 50 characters.');
      return;
    }
    onSave({ name: trimmed });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={18} color="var(--primary)" />
            <h3>{category ? 'Rename Category' : 'Create New Category'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="cat-name">
                Category Name *
              </label>
              <input
                id="cat-name"
                type="text"
                className="form-input"
                placeholder="e.g. Groceries, Entertainment, Travel"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                maxLength={50}
              />
              {error && <p className="input-error-msg">{error}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
