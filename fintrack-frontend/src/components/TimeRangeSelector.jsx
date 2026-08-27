import React from 'react';

export const TimeRangeSelector = ({ value, onChange, onCustomChange }) => {
  const handleSelection = (range) => {
    onChange(range);
    if (range !== 'custom') onCustomChange(null);
  };

  return (
    <div className="segmented-control flex items-center gap-2 rounded-md border border-gray-300 overflow-hidden">
      <button
        className={`segment-item px-4 py-2 text-sm ${value === 'week' ? 'segment-active' : ''}`}
        onClick={() => handleSelection('week')}
      >
        This Week
      </button>
      <button
        className={`segment-item px-4 py-2 text-sm ${value === 'month' ? 'segment-active' : ''}`}
        onClick={() => handleSelection('month')}
      >
        This Month
      </button>
      <button
        className={`segment-item px-4 py-2 text-sm ${value === 'custom' ? 'segment-active' : ''}`}
        onClick={() => handleSelection('custom')}
      >
        Custom
      </button>
      {value === 'custom' && (
        <div className="custom-range flex items-center gap-1 ml-2">
          <input
            type="date"
            className="form-input"
            onChange={e => onCustomChange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span className="text-gray-500">–</span>
          <input
            type="date"
            className="form-input"
            onChange={e => onCustomChange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      )}
    </div>
  );
};
