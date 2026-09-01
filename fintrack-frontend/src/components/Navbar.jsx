import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Tags, 
  Plus, 
  Menu, 
  X,
  WalletCards,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = ({ activeTab, onSelectTab, onOpenAddExpense }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="header-navbar">
      <div className="nav-content">
        {/* Brand Logo */}
        <a 
          href="#dashboard" 
          className="brand-logo"
          onClick={(e) => {
            e.preventDefault();
            handleTabClick('dashboard');
          }}
        >
          <div className="brand-icon-wrapper">
            <WalletCards size={20} />
          </div>
          <span>Fin<span className="brand-text-highlight">Track</span></span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links-desktop" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenAddExpense}
            title="Log a new expense"
          >
            <Plus size={16} />
            <span className="hide-on-mobile">Add Expense</span>
          </button>

          {/* User Info & Logout Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.06)',
                fontSize: '0.8125rem',
                color: '#cbd5e1'
              }}
              className="hide-on-mobile"
              title={user?.email}
            >
              <UserIcon size={14} color="#818cf8" />
              <span>{displayName}</span>
            </div>

            <button
              onClick={logout}
              className="btn btn-sm"
              style={{
                padding: '0.4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.875rem' }}>
            Signed in as: <strong style={{ color: '#f8fafc' }}>{user?.email}</strong>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(item.id)}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
