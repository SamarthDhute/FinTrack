import React from 'react';
import { RefreshCw } from 'lucide-react';

export const RefreshButton = ({ onClick, loading }) => (
  <button className="btn btn-ghost" onClick={onClick} disabled={loading}>
    <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
    {loading ? 'Refreshing...' : 'Refresh'}
  </button>
);
