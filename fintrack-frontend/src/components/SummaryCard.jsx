import React from 'react';
import { formatCurrency } from '../utils/formatters';

export const SummaryCard = ({ title, value, icon: Icon, subtext, changePercent, children }) => (
  <div className="card metric-card summary-card">
    <div className="metric-header">
      <span className="metric-title">{title}</span>
      {Icon && (
        <div className="metric-icon-box">
          <Icon size={20} />
        </div>
      )}
    </div>
    <div className="metric-value">
      {value}
    </div>
    {subtext && <div className="metric-subtext">{subtext}</div>}
    {changePercent !== undefined && (
      <div className="metric-change" style={{ color: changePercent >= 0 ? 'var(--green-success)' : 'var(--rose-danger)' }}>
        {changePercent > 0 ? '+' : ''}{changePercent}%
      </div>
    )}
    {children}
  </div>
);
