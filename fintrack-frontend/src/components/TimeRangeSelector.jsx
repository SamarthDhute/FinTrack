import React from 'react';
import { Calendar } from 'lucide-react';

export const TimeRangeSelector = ({ value, onChange, onCustomChange }) => {
  const handleSelection = (range) => {
    onChange(range);
    if (range !== 'custom' && onCustomChange) {
      onCustomChange(null);
    }
  };

  const options = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="time-range-segmented-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <div
        className="segmented-control"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          gap: '2px',
        }}
      >
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`segment-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelection(opt.id)}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
                border: 'none',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
                outline: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {opt.id === 'custom' && <Calendar size={13} style={{ opacity: isActive ? 1 : 0.7 }} />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {value === 'custom' && (
        <div
          className="custom-range-inputs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.2rem 0.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <input
            type="date"
            className="form-input"
            style={{
              padding: '0.35rem 0.5rem',
              fontSize: '0.8rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer',
            }}
            onChange={(e) => onCustomChange && onCustomChange((prev) => ({ ...(prev || {}), start: e.target.value }))}
          />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>–</span>
          <input
            type="date"
            className="form-input"
            style={{
              padding: '0.35rem 0.5rem',
              fontSize: '0.8rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer',
            }}
            onChange={(e) => onCustomChange && onCustomChange((prev) => ({ ...(prev || {}), end: e.target.value }))}
          />
        </div>
      )}
    </div>
  );
};

