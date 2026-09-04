import React, { useState } from 'react';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Plus, 
  Eye, 
  EyeOff, 
  Zap, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const HeroVibeCard = ({ 
  totalSpend = 0, 
  dailyAvg = 0, 
  todaySpend = 0,
  budgetHealth = 80, // 0 to 100
  safeToSpendDaily = 500,
  onOpenAddExpense,
  onOpenAIChat
}) => {
  const [showSafeToSpend, setShowSafeToSpend] = useState(false);

  // Determine Dynamic Vibe Status
  const getVibeStatus = () => {
    if (budgetHealth >= 80) {
      return {
        emoji: '🤑',
        tag: 'LIVING LARGE',
        subtext: 'W Savings! You are flexing great financial control.',
        color: '#16A34A',
        bg: 'rgba(22, 163, 74, 0.08)',
        border: 'rgba(22, 163, 74, 0.25)',
      };
    } else if (budgetHealth >= 55) {
      return {
        emoji: '😎',
        tag: 'VIBING',
        subtext: 'Solid pace. Keep those impulse buys under wraps.',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)',
        border: 'rgba(59, 130, 246, 0.25)',
      };
    } else if (budgetHealth >= 25) {
      return {
        emoji: '😬',
        tag: 'WALLET CRYING',
        subtext: 'Caution! You are spending cash faster than usual.',
        color: '#D97706',
        bg: 'rgba(217, 119, 6, 0.08)',
        border: 'rgba(217, 119, 6, 0.25)',
      };
    } else {
      return {
        emoji: '💀',
        tag: 'DOWN BAD / BROKE AF',
        subtext: 'Budget in critical condition! Cutbacks needed.',
        color: '#DC2626',
        bg: 'rgba(220, 38, 38, 0.08)',
        border: 'rgba(220, 38, 38, 0.25)',
      };
    }
  };

  const vibe = getVibeStatus();

  // Daily Burn Rate Calculation
  const burnRatio = safeToSpendDaily > 0 ? (todaySpend / safeToSpendDaily) * 100 : 50;
  const clampedBurn = Math.min(Math.max(burnRatio, 5), 100);

  const getBurnIntensity = () => {
    if (clampedBurn > 90) return { label: 'High Burn 🚨', color: '#DC2626' };
    if (clampedBurn > 50) return { label: 'Moderate Burn 🔥', color: '#D97706' };
    return { label: 'Chill Burn ⚡', color: '#16A34A' };
  };

  const burnInfo = getBurnIntensity();

  return (
    <div 
      className="card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Subtle Background Accent */}
      <div 
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar: Vibe Status Pill + AI Chat Launcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: vibe.bg,
            border: `1px solid ${vibe.border}`,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{vibe.emoji}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: vibe.color, letterSpacing: '0.04em' }}>
            {vibe.tag}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            ({budgetHealth}% Health)
          </span>
        </div>

        {onOpenAIChat && (
          <button
            type="button"
            onClick={onOpenAIChat}
            className="btn btn-purple btn-sm"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '999px',
            }}
          >
            <Sparkles size={14} />
            <span>AI Advice</span>
          </button>
        )}
      </div>

      {/* Main Stat: Spend vs Safe to Spend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {showSafeToSpend ? 'Safe to Spend Today' : 'Total Spent This Month'}
            </span>
            <button 
              type="button" 
              onClick={() => setShowSafeToSpend(!showSafeToSpend)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              title="Toggle Safe-to-Spend view"
            >
              {showSafeToSpend ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showSafeToSpend ? 'Show Spent' : 'Safe to Spend'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#111827', letterSpacing: '-0.03em' }}>
              {showSafeToSpend 
                ? formatCurrency(Math.max(safeToSpendDaily - todaySpend, 0)) 
                : formatCurrency(totalSpend)}
            </span>
            {showSafeToSpend && (
              <span style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 700 }}>
                / day
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px', fontWeight: 500 }}>
            {vibe.subtext}
          </p>
        </div>

        {/* Daily Burn Rate Visual Gauge */}
        <div 
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} style={{ color: burnInfo.color }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                Daily Burn Rate
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: burnInfo.color }}>
              {burnInfo.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: '#E5E7EB',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div 
              style={{
                width: `${clampedBurn}%`,
                height: '100%',
                borderRadius: '999px',
                background: clampedBurn > 90 
                  ? 'linear-gradient(90deg, #D97706, #DC2626)' 
                  : clampedBurn > 50 
                  ? 'linear-gradient(90deg, #3B82F6, #D97706)' 
                  : 'linear-gradient(90deg, #16A34A, #3B82F6)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280' }}>
            <span>Today: {formatCurrency(todaySpend)}</span>
            <span>Daily Limit: {formatCurrency(safeToSpendDaily)}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      {onOpenAddExpense && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={15} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
              Avg Daily Pace: <strong style={{ color: '#111827' }}>{formatCurrency(dailyAvg)}/day</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="btn btn-primary btn-sm"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
            }}
          >
            <Plus size={15} />
            <span>2-Tap Speed Log</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroVibeCard;
