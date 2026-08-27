import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
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
 * Helper to get a nice human-readable ceiling and intervals for Y-axis
 */
const getNiceYAxisConfig = (maxAmount) => {
  if (maxAmount <= 0) return { max: 1000, ticks: [0, 250, 500, 750, 1000] };
  if (maxAmount <= 500) return { max: 500, ticks: [0, 125, 250, 375, 500] };
  if (maxAmount <= 1000) return { max: 1000, ticks: [0, 250, 500, 750, 1000] };
  if (maxAmount <= 2000) return { max: 2000, ticks: [0, 500, 1000, 1500, 2000] };
  if (maxAmount <= 5000) return { max: 5000, ticks: [0, 1000, 2000, 3000, 4000, 5000] };
  if (maxAmount <= 10000) return { max: 10000, ticks: [0, 2500, 5000, 7500, 10000] };
  
  // For larger numbers, calculate next nice power-of-10 multiple
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxAmount)));
  const ratio = maxAmount / magnitude;
  let niceFactor = 10;
  if (ratio <= 1.2) niceFactor = 1.5;
  else if (ratio <= 2) niceFactor = 2.5;
  else if (ratio <= 4) niceFactor = 5;
  else if (ratio <= 7) niceFactor = 8;
  
  const niceMax = niceFactor * magnitude;
  const numIntervals = 4;
  const step = niceMax / numIntervals;
  const ticks = [];
  for (let i = 0; i <= numIntervals; i++) {
    ticks.push(Math.round(i * step));
  }
  return { max: niceMax, ticks };
};

const formatCompactRupee = (val) => {
  if (val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
  return `₹${Math.round(val)}`;
};

/**
 * Monthly Spending Trend Area Chart
 */
export const SpendingTrendChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
        <TrendingUp size={36} style={{ opacity: 0.3, marginBottom: '0.75rem', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>No spending data for this period</p>
      </div>
    );
  }

  const values = data.map((d) => Number(d.total_amount || 0));
  const rawMax = Math.max(...values, 0);
  const { max: maxVal, ticks: yTicks } = getNiceYAxisConfig(rawMax);
  const minVal = 0;

  const width = 560;
  const height = 210;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 36;

  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  // Process data points with full date parsing
  const points = data.map((d, i) => {
    const rawVal = Number(d.total_amount || 0);
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * usableWidth;
    const y = height - paddingBottom - ((rawVal - minVal) / (maxVal - minVal)) * usableHeight;

    let dayLabel = `${i + 1}`;
    let fullDate = d.date ? formatDate(d.date) : `Day ${i + 1}`;
    if (d.date) {
      const parts = d.date.split('-');
      if (parts.length === 3) {
        dayLabel = `${parseInt(parts[2], 10)}`;
      }
    } else if (d.month_name || d.month) {
      dayLabel = d.month_name || d.month;
      fullDate = d.month_name || d.month;
    }

    return {
      x,
      y,
      val: rawVal,
      dateStr: d.date,
      dayLabel,
      fullDate,
    };
  });

  // Calculate smooth cubic spline path
  const createSplinePath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const pathD = createSplinePath(points);
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)},${(height - paddingBottom).toFixed(1)} L ${points[0].x.toFixed(1)},${(height - paddingBottom).toFixed(1)} Z`
    : '';

  // Calculate readable tick step for X-axis (showing 5-7 labels max)
  const totalPoints = points.length;
  const targetTicks = totalPoints <= 7 ? totalPoints : (totalPoints <= 16 ? 5 : 7);
  const xTickStep = Math.max(1, Math.floor((totalPoints - 1) / (targetTicks - 1)));

  const isXTickVisible = (idx) => {
    if (idx === 0 || idx === totalPoints - 1) return true;
    return idx % xTickStep === 0 && (totalPoints - 1 - idx) >= Math.floor(xTickStep / 2);
  };

  const activePt = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < points.length ? points[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', display: 'block' }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.38" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* Grid lines & Y-Axis labels */}
        {yTicks.map((tickVal, i) => {
          const y = height - paddingBottom - ((tickVal - minVal) / (maxVal - minVal)) * usableHeight;
          return (
            <g key={`y-${i}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={i === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}
                strokeDasharray={i === 0 ? 'none' : '4 4'}
              />
              <text
                x={paddingLeft - 10}
                y={y + 3.5}
                textAnchor="end"
                fill="var(--text-dim)"
                fontSize="10"
                fontFamily="var(--font-heading)"
                fontWeight="500"
              >
                {formatCompactRupee(tickVal)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#trendGradient)" />

        {/* Trend line */}
        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active Point Vertical Guide Line */}
        {activePt && (
          <line
            x1={activePt.x}
            y1={paddingTop}
            x2={activePt.x}
            y2={height - paddingBottom}
            stroke="rgba(99, 102, 241, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Data points & X-Axis labels */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          const showTick = isXTickVisible(idx);

          return (
            <g key={`pt-${idx}`}>
              {/* X-axis tick label */}
              {showTick && (
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--primary)' : 'var(--text-dim)'}
                  fontSize="10.5"
                  fontWeight={isHovered ? '600' : '500'}
                  style={{ transition: 'fill 0.15s ease' }}
                >
                  {pt.dayLabel}
                </text>
              )}

              {/* Data Point Node */}
              {(isHovered || totalPoints <= 15 || pt.val > 0) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={'var(--bg-card)'}
                  stroke="#6366f1"
                  strokeWidth={isHovered ? 3 : 1.5}
                  filter={isHovered ? 'url(#pointGlow)' : 'none'}
                  style={{
                    transition: 'r 0.15s ease, fill 0.15s ease, stroke-width 0.15s ease',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Invisible touch/hover target for every point */}
              <rect
                x={pt.x - usableWidth / Math.max(points.length, 1) / 2}
                y={paddingTop}
                width={usableWidth / Math.max(points.length, 1)}
                height={usableHeight + paddingBottom}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onTouchStart={() => setHoveredIdx(idx)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Dark Theme Tooltip */}
      {activePt && (
        <div
          style={{
            position: 'absolute',
            top: `${Math.max(8, ((activePt.y - 10) / height) * 100)}%`,
            left: `${(activePt.x / width) * 100}%`,
            transform: `translate(${
              activePt.x > width * 0.72 ? '-102%' : activePt.x < width * 0.28 ? '4%' : '-50%'
            }, -115%)`,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 12px rgba(99, 102, 241, 0.15)',
            pointerEvents: 'none',
            zIndex: 30,
            whiteSpace: 'nowrap',
            transition: 'transform 0.08s ease-out, top 0.08s ease-out, left 0.08s ease-out',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 500, marginBottom: '2px' }}>
            {activePt.fullDate}
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Spent:</span>
            {formatCurrency(activePt.val)}
          </div>
        </div>
      )}
    </div>
  );
};

