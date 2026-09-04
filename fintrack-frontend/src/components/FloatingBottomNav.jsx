import React from 'react';
import { LayoutDashboard, Receipt, HandCoins, Target, Layers, Sparkles } from 'lucide-react';

export const FloatingBottomNav = ({ activeTab, onTabChange, onOpenAIChat }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'debts', label: 'Udhaar', icon: HandCoins },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'categories', label: 'Categories', icon: Layers },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        maxWidth: '92vw',
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
              padding: '6px 14px',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.25)' : 'transparent'}`,
              borderRadius: '16px',
              color: isActive ? '#3B82F6' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '56px',
            }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
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
            padding: '6px 14px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            color: '#6366F1',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '56px',
          }}
        >
          <Sparkles size={18} strokeWidth={2.2} style={{ color: '#6366F1' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>
            AI Chat
          </span>
        </button>
      )}
    </div>
  );
};

export default FloatingBottomNav;
