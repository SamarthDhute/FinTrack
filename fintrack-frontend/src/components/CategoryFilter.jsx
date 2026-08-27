import React from 'react';
import { Tag, ChevronDown } from 'lucide-react';

export const CategoryFilter = ({ categories = [], value, onChange }) => {
  // Normalize categories list (handles both {id, name} and {category_id, category_name})
  const normalizedCategories = categories.map((c) => ({
    id: c.id ?? c.category_id,
    name: c.name ?? c.category_name ?? 'Unnamed',
    color: c.color,
  })).filter(c => c.id !== undefined && c.id !== null);

  return (
    <div className="category-filter-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute',
          left: '0.75rem',
          pointerEvents: 'none',
          color: value ? 'var(--primary)' : 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s ease',
        }}
      >
        <Tag size={15} />
      </div>

      <select
        className="form-select category-filter-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'var(--bg-tertiary)',
          color: value ? 'var(--text-main)' : 'var(--text-muted)',
          border: value ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.55rem 2.25rem 0.55rem 2.25rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all var(--transition-fast)',
          boxShadow: value ? '0 0 0 1px rgba(99, 102, 241, 0.2)' : 'none',
        }}
      >
        <option value="" style={{ background: '#1e293b', color: '#f8fafc' }}>
          All Categories
        </option>
        {normalizedCategories.map((cat) => (
          <option key={cat.id} value={cat.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
            {cat.name}
          </option>
        ))}
      </select>

      <div
        style={{
          position: 'absolute',
          right: '0.75rem',
          pointerEvents: 'none',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ChevronDown size={14} />
      </div>
    </div>
  );
};

