import React from 'react';

export const AlertBanner = ({ type, message }) => {
  const bg = type === 'error' ? 'var(--rose-danger)' : 'var(--amber-warning)';
  const text = 'var(--text-contrast)';
  return (
    <div className="alert-banner" style={{ background: bg, color: text, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
      {message}
    </div>
  );
};
