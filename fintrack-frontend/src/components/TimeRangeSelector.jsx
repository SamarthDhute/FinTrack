import React from 'react';

export const TimeRangeSelector = ({ value, onChange, onCustomChange }) => {
  const handleSelection = (range) => {
    onChange(range);
    if (range !== 'custom') onCustomChange(null);
  };

  return (
    <div className="time-range-selector flex items-center gap-2">
      <button
        className={value === 'week' ? 'btn-primary' : 'btn-outline'}
        onClick={() => handleSelection('week')}
      >
        This Week
      </button>
      <button
        className={value === 'month' ? 'btn-primary' : 'btn-outline'}
        onClick={() => handleSelection('month')}
      >
        This Month
      </button>
      <button
        className={value === 'custom' ? 'btn-primary' : 'btn-outline'}
        onClick={() => handleSelection('custom')}
      >
        Custom
      </button>
      {value === 'custom' && (
        <div className="custom-range flex items-center gap-1">
          <input
            type="date"
            onChange={e => onCustomChange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span>–</span>
          <input
            type="date"
            onChange={e => onCustomChange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      )}
    </div>
  );
};
