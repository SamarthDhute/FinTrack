import React from 'react';
import { RefreshCw } from 'lucide-react';

export const RefreshButton = ({ onClick, loading }) => (
  <button
    type="button"
    className="btn btn-secondary refresh-btn"
    onClick={onClick}
    disabled={loading}
    title="Refresh dashboard data"
    style={{
      padding: '0.55rem 0.85rem',
      fontSize: '0.85rem',
      gap: '0.4rem',
      display: 'inline-flex',
      alignItems: 'center',
    }}
  >
    <RefreshCw
      size={15}
      style={{
        animation: loading ? 'spin 0.8s linear infinite' : 'none',
        color: 'var(--primary)',
        transition: 'transform 0.2s ease',
      }}
    />
    <span style={{ fontSize: '0.825rem' }}>{loading ? 'Refreshing...' : 'Refresh'}</span>
  </button>
);

