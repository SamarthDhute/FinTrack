import React from 'react';
import { LayoutDashboard, Receipt, WalletCards, HandCoins, Target, Layers, Sparkles } from 'lucide-react';

export const FloatingBottomNav = ({ activeTab, onTabChange, onOpenAIChat }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'debts', label: 'Udhaar', icon: HandCoins },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'categories', label: 'Categories', icon: Layers },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 'calc(10px + var(--safe-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        padding: '5px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        width: 'max-content',
        maxWidth: 'calc(100vw - 16px)',
        boxSizing: 'border-box',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '6px clamp(6px, 1.8vw, 12px)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.25)' : 'transparent'}`,
              borderRadius: '16px',
              color: isActive ? '#3B82F6' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '0.66rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', lineHeight: 1.1 }}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* AI Assistant Button */}
      {onOpenAIChat && (
        <button
          type="button"
          onClick={onOpenAIChat}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px clamp(6px, 1.8vw, 12px)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            color: '#6366F1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          <Sparkles size={17} strokeWidth={2.2} style={{ color: '#6366F1' }} />
          <span style={{ fontSize: '0.66rem', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.1 }}>
            AI Chat
          </span>
        </button>
      )}
    </nav>
  );
};

export default FloatingBottomNav;
