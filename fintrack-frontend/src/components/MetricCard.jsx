import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercentage } from '../utils/formatters';

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  changePercent,
  trendDirection, // 'up' | 'down' | 'neutral'
  badgeColor,
  onClick,
}) => {
  return (
    <div className="card metric-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className="metric-icon-box">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-subtext">
        {changePercent !== undefined && changePercent !== null && (
          <span
            className={`trend-pill ${
              changePercent > 0 ? 'trend-up' : changePercent < 0 ? 'trend-down' : 'trend-neutral'
            }`}
          >
            {changePercent > 0 ? <TrendingUp size={12} /> : changePercent < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {formatPercentage(changePercent)}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div>
    </div>
  );
};
