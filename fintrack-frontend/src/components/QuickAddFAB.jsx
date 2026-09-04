import React from 'react';
import { Plus, Zap } from 'lucide-react';

export const QuickAddFAB = ({ onClick }) => {
  return (
    <button
      type="button"
      className="quick-add-fab"
      onClick={onClick}
      aria-label="Quick Add Expense"
      title="Quick Log Expense (2-tap fast entry)"
    >
      <Plus size={28} strokeWidth={2.8} />
    </button>
  );
};
