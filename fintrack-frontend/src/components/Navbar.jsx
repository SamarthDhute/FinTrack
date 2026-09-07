import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  Lock,
  ChevronDown,
  User as UserIcon,
  HandCoins
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = ({ activeTab, onSelectTab, onOpenAddExpense, onOpenChangePassword }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const profileRef = useRef(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'debts', label: 'Udhaar / Debts', icon: HandCoins },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

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

          {/* Profile Dropdown (Desktop) */}
          <div ref={profileRef} className="profile-dropdown-wrapper hide-on-mobile">
            <button
              className="profile-trigger"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={user?.email}
            >
              <div className="profile-avatar">{initials}</div>
              <span className="profile-name">{displayName}</span>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar profile-avatar-lg">{initials}</div>
                  <div>
                    <div style={{ color: '#111827', fontWeight: 600, fontSize: '0.875rem' }}>{displayName}</div>
                    <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{user?.email}</div>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onOpenChangePassword) onOpenChangePassword();
                  }}
                >
                  <Lock size={15} />
                  <span>Update Password</span>
                </button>
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item profile-dropdown-item-danger" onClick={logout}>
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
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
          {/* User info header */}
          <div className="mobile-user-header">
            <div className="profile-avatar profile-avatar-lg">{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{displayName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{user?.email}</div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-link-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.id)}
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '0.7rem 0.9rem', borderRadius: '10px' }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Profile items in mobile */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <button
              className="nav-link-item"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenChangePassword) onOpenChangePassword();
              }}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.7rem 0.9rem', borderRadius: '10px' }}
            >
              <Lock size={18} />
              <span>Update Password</span>
            </button>
            <button
              className="nav-link-item"
              onClick={logout}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.7rem 0.9rem', borderRadius: '10px', color: 'var(--rose-danger)' }}
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
