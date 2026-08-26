import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

const PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#a855f7', // Violet
];

/**
 * Responsive SVG Donut Chart for Category Breakdown
 */
export const CategoryDonutChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <PieIcon size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No category expense data yet</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + Number(item.total_amount || item.amount || 0), 0);
  
  // Calculate SVG arc paths
  let cumulativeAngle = 0;
  const radius = 80;
  const strokeWidth = 28;
  const center = 110;
  const circumference = 2 * Math.PI * radius;

  const slices = data.map((item, idx) => {
    const value = Number(item.total_amount || item.amount || 0);
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle;
    cumulativeAngle += (percentage / 100) * circumference;

    return {
      name: item.category_name || item.name || 'Other',
      value,
      percentage: percentage.toFixed(1),
      color: PALETTE[idx % PALETTE.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              style={{
                cursor: 'pointer',
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            {activeSlice ? activeSlice.name : 'Total Spend'}
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            {formatCurrency(activeSlice ? activeSlice.value : total)}
          </span>
          {activeSlice && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeSlice.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.65rem',
          width: '100%',
        }}
      >
        {slices.map((slice, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: hoveredIdx === idx ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              border: `1px solid ${hoveredIdx === idx ? slice.color : 'transparent'}`,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: slice.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {slice.name}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {slice.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Payment Method Distribution Bars Chart
 */
export const PaymentMethodBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <BarChart3 size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No payment method data recorded</p>
      </div>
    );
  }

  const maxSpend = Math.max(...data.map((d) => Number(d.total_amount || 0)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {data.map((item, idx) => {
        const amount = Number(item.total_amount || 0);
        const count = item.expense_count || 0;
        const pct = (amount / maxSpend) * 100;
        const color = PALETTE[idx % PALETTE.length];

        return (
          <div key={item.payment_method_id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.payment_method_name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ({count} {count === 1 ? 'txn' : 'txns'})
                </span>
              </div>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(amount)}
              </span>
            </div>

            <div className="progress-track" style={{ height: 10 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Monthly Spending Trend Area Chart
 */
export const SpendingTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <TrendingUp size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Not enough data for spending trend</p>
      </div>
    );
  }

  const values = data.map((d) => Number(d.total_amount || 0));
  const maxVal = Math.max(...values, 100);
  const minVal = 0;
  const height = 180;
  const width = 500;
  const paddingX = 40;
  const paddingY = 30;

  // Generate SVG Points
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * usableWidth;
    const y = height - paddingY - ((Number(d.total_amount || 0) - minVal) / (maxVal - minVal)) * usableHeight;
    return { x, y, val: d.total_amount, month: d.month_name || d.month || `M${i+1}` };
  });

  const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ minWidth: 320, overflow: 'visible' }}>
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = height - paddingY - ratio * usableHeight;
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} textAnchor="end" fill="var(--text-dim)" fontSize="10">
                ₹{Math.round(minVal + ratio * (maxVal - minVal))}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#trendGradient)" />

        {/* Trend line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & labels */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="5" fill="#111827" stroke="#6366f1" strokeWidth="2.5" />
            <text x={pt.x} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="500">
              {pt.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
