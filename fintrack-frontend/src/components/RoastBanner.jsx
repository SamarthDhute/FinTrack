import React, { useState } from 'react';
import { Flame, Sparkles, X, RefreshCw, Coffee } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const RoastBanner = ({ 
  topCategory = 'Food & Dining', 
  topCategorySpend = 0, 
  totalSpend = 0,
  overBudgetCategories = []
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [roastIndex, setRoastIndex] = useState(0);

  if (dismissed || totalSpend <= 0) return null;

  const roasts = [
    `☕ The Tea: ${topCategorySpend > 0 ? `${formatCurrency(topCategorySpend)} on ${topCategory}?` : 'High spend detected.'} Your wallet is screaming for a break!`,
    `💀 Reality Check: A big chunk went to late-night snacking and impulsive orders. We see you.`,
    `🔥 Roast Alert: If "adding to cart" was an Olympic sport, you would be taking home gold this month.`,
    `📉 Vibe Status: Your wallet is feeling the heat. Maybe cook at home tonight instead of ordering takeout?`,
    `💸 Fun Fact: At this daily burn rate, you are sponsoring your delivery rider's next vacation!`,
  ];

  if (overBudgetCategories.length > 0) {
    roasts.unshift(`🚨 Emergency Roast: You blew through your ${overBudgetCategories.join(', ')} budget! Time to lock the credit card in the freezer.`);
  }

  const currentRoast = roasts[roastIndex % roasts.length];

  const handleNextRoast = () => {
    setRoastIndex((prev) => prev + 1);
  };

  return (
    <div 
      style={{
        background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        borderRadius: '16px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <div 
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Coffee size={18} style={{ color: '#DC2626' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#DC2626', letterSpacing: '0.06em' }}>
              AI ROAST MODE
            </span>
            <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>• LIVE INSIGHT</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#1F2937', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
            {currentRoast}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleNextRoast}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '8px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: '#374151',
          }}
          title="Get another spicy roast"
        >
          <RefreshCw size={12} />
          <span>Next Roast ☕</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Dismiss banner"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default RoastBanner;
