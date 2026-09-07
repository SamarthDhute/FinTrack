import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Receipt, 
  WalletCards, 
  Target, 
  HandCoins, 
  Search, 
  RefreshCw, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Mail, 
  User as UserIcon,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export const AdminDashboardPage = () => {
  const { error: toastError } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'expenses' | 'budgets'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User detail modal state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userModalSubTab, setUserModalSubTab] = useState('expenses'); // 'expenses' | 'wallets' | 'budgets' | 'debts'
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, usersData, expData, budData] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getUsers({ search: searchQuery }).catch(() => []),
        api.admin.getExpenses().catch(() => []),
        api.admin.getBudgets().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setExpenses(expData || []);
      setBudgets(budData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toastError(err.message || 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, toastError]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  const handleOpenUserDetail = async (userId) => {
    try {
      setIsLoadingDetail(true);
      const detail = await api.admin.getUserDetails(userId);
      setSelectedUserDetail(detail);
      setUserModalSubTab('expenses');
    } catch (err) {
      toastError(err.message || 'Failed to fetch user details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '3rem' }}>
      {/* Top Banner Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          marginBottom: '1.75rem',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.35)',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                FinTrack Superadmin Center
              </h1>
              <span 
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '100px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Root Access
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
              Comprehensive real-time telemetry across all registered users, ledgers, wallets, budgets & debts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Users */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Registered Users
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats?.total_users || users.length || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
              {stats?.verified_users || 0} Verified • {stats?.google_users || 0} Google OAuth
            </div>
          </div>
        </div>

        {/* Card 2: Spend Volume */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Spend Volume
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatCurrency(stats?.total_spend_amount)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Across {stats?.total_expenses_count || expenses.length || 0} logged transactions
            </div>
          </div>
        </div>

        {/* Card 3: Debts */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HandCoins size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Udhaar & Debts Tracked
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats?.total_debts_count || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>
              Lent: {formatCurrency(stats?.total_lent_amount)} • Borrowed: {formatCurrency(stats?.total_borrowed_amount)}
            </div>
          </div>
        </div>

        {/* Card 4: Accounts & Budgets */}
        <div className="card" style={{ padding: '1.25rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WalletCards size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Wallets & Budgets
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats?.total_wallets_count || 0} Accounts
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {stats?.total_budgets_count || budgets.length || 0} category spending budgets
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div 
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('users')}
            style={{ borderRadius: '12px', padding: '0.55rem 1.1rem', fontSize: '0.86rem' }}
          >
            <Users size={16} />
            <span>Users Directory ({users.length})</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('expenses')}
            style={{ borderRadius: '12px', padding: '0.55rem 1.1rem', fontSize: '0.86rem' }}
          >
            <Receipt size={16} />
            <span>Platform Expenses Feed ({expenses.length})</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'budgets' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('budgets')}
            style={{ borderRadius: '12px', padding: '0.55rem 1.1rem', fontSize: '0.86rem' }}
          >
            <Target size={16} />
            <span>Global Budgets ({budgets.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingRight: '0.8rem', borderRadius: '12px', fontSize: '0.84rem' }}
          />
        </div>
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '20px', overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #F8FAFC)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>User Profile</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Auth & Status</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Expenses Logged</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Total Spent</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Wallets / Budgets</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Joined Date</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No registered users found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSuperadmin = u.is_admin || u.email.toLowerCase() === 'dhutesamarth@gmail.com';
                    return (
                      <tr 
                        key={u.id} 
                        style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div 
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '12px',
                                background: isSuperadmin ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}
                            >
                              {(u.display_name || u.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{u.display_name || 'Anonymous User'}</span>
                                {isSuperadmin && (
                                  <span style={{ fontSize: '0.65rem', background: '#10B981', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: u.google_id ? '#3B82F6' : '#64748B', fontWeight: 600 }}>
                              {u.google_id ? '🌐 Google OAuth' : '🔑 Email/Password'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: u.is_verified ? '#10B981' : '#F59E0B' }}>
                              {u.is_verified ? '✓ Verified' : '⚠ Unverified'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.expense_count}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> entries</span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(u.total_spent)}</span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                            💳 {u.wallet_count} Wallets • 🎯 {u.budget_count} Budgets
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            🤝 {u.debt_count} Udhaar records
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenUserDetail(u.id)}
                            style={{ borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          >
                            <Eye size={14} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Platform Expenses Feed */}
      {activeTab === 'expenses' && (
        <div className="card" style={{ borderRadius: '20px', overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #F8FAFC)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>User / Account</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Title & Category</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Payment Method / Wallet</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No expenses logged on platform yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>{exp.user_email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>User #{exp.user_id}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{exp.title}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                          <span 
                            style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: exp.category_color || '#64748B'
                            }}
                          />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{exp.category_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                          {exp.payment_method_name || 'Cash'}
                        </div>
                        {exp.wallet_name && (
                          <div style={{ fontSize: '0.72rem', color: '#10B981' }}>
                            💳 {exp.wallet_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {exp.date}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Global Budgets */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {budgets.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active budgets found across the platform.
            </div>
          ) : (
            budgets.map((b) => (
              <div key={b.id} className="card" style={{ padding: '1.25rem', borderRadius: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem', marginTop: '2px' }}>
                      {b.category_name}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {b.period}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>{formatCurrency(b.amount_limit)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>limit</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Deep-Dive Detail Modal */}
      {selectedUserDetail && (
        <div className="modal-overlay" onClick={() => setSelectedUserDetail(null)} style={{ zIndex: 1200 }}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '94%',
              maxHeight: '88vh',
              borderRadius: '24px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '1.5rem 1.75rem',
                borderBottom: '1px solid #E5E7EB',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                  }}
                >
                  {(selectedUserDetail.user.display_name || selectedUserDetail.user.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedUserDetail.user.display_name || 'User Profile'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {selectedUserDetail.user.email} • ID #{selectedUserDetail.user.id}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedUserDetail(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle, #F8FAFC)', padding: '0.5rem 1.75rem', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${userModalSubTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserModalSubTab('expenses')}
                style={{ borderRadius: '8px' }}
              >
                Expenses ({selectedUserDetail.expenses.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${userModalSubTab === 'wallets' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserModalSubTab('wallets')}
                style={{ borderRadius: '8px' }}
              >
                Wallets ({selectedUserDetail.wallets.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${userModalSubTab === 'budgets' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserModalSubTab('budgets')}
                style={{ borderRadius: '8px' }}
              >
                Budgets ({selectedUserDetail.budgets.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${userModalSubTab === 'debts' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setUserModalSubTab('debts')}
                style={{ borderRadius: '8px' }}
              >
                Debts / Udhaar ({selectedUserDetail.debts.length})
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', maxHeight: '55vh' }}>
              {userModalSubTab === 'expenses' && (
                <div>
                  {selectedUserDetail.expenses.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>This user has not logged any expenses yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Title</th>
                          <th style={{ padding: '0.5rem' }}>Category</th>
                          <th style={{ padding: '0.5rem' }}>Payment</th>
                          <th style={{ padding: '0.5rem' }}>Date</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserDetail.expenses.map((e) => (
                          <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{e.title}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{e.category_name}</td>
                            <td style={{ padding: '0.5rem' }}>{e.payment_method_name || 'Cash'}{e.wallet_name ? ` (${e.wallet_name})` : ''}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{e.date}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {userModalSubTab === 'wallets' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {selectedUserDetail.wallets.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>No wallets created.</p>
                  ) : (
                    selectedUserDetail.wallets.map((w) => (
                      <div key={w.id} className="card" style={{ padding: '1rem', borderRadius: '14px', borderLeft: `4px solid ${w.color || '#10B981'}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{w.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{w.wallet_type}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', marginTop: '0.4rem' }}>{formatCurrency(w.balance)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userModalSubTab === 'budgets' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {selectedUserDetail.budgets.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>No budgets set.</p>
                  ) : (
                    selectedUserDetail.budgets.map((b) => (
                      <div key={b.id} className="card" style={{ padding: '1rem', borderRadius: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{b.category_name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.period} limit</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3B82F6', marginTop: '0.4rem' }}>{formatCurrency(b.amount_limit)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {userModalSubTab === 'debts' && (
                <div>
                  {selectedUserDetail.debts.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No debt or Udhaar records.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Person</th>
                          <th style={{ padding: '0.5rem' }}>Type</th>
                          <th style={{ padding: '0.5rem' }}>Status</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Initial Amount</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserDetail.debts.map((d) => (
                          <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{d.person_name}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, background: d.debt_type === 'LENT' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: d.debt_type === 'LENT' ? '#10B981' : '#EF4444' }}>
                                {d.debt_type}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{d.status}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.initial_amount)}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#EF4444' }}>{formatCurrency(d.remaining_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle, #F8FAFC)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedUserDetail(null)}
                style={{ borderRadius: '10px' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
