import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Tags, 
  Plus, 
  Menu, 
  X,
  WalletCards
} from 'lucide-react';

export const Navbar = ({ activeTab, onSelectTab, onOpenAddExpense }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
