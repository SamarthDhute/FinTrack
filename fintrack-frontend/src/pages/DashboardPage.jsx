import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  Receipt,
  Plus
} from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { CategoryDonutChart, PaymentMethodBarChart, SpendingTrendChart } from '../components/Charts';
import { formatCurrency, formatDate, getBudgetStatusInfo } from '../utils/formatters';

export const DashboardPage = ({ onNavigateToExpenses, onOpenAddExpense }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumRes, catRes, payRes, trdRes, budRes] = await Promise.all([
        api.dashboard.summary().catch(() => null),
        api.dashboard.categoryChart().catch(() => []),
        api.dashboard.paymentMethodChart().catch(() => []),
        api.dashboard.trendChart().catch(() => []),
        api.budgets.list().catch(() => []),
      ]);

      setSummary(sumRes);
      setCategoryData(catRes || []);
      setPaymentData(payRes || []);
      setTrendData(trdRes || []);
      setBudgets(budRes || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Could not load dashboard data. Please verify your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading financial dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: 500, margin: '2rem auto' }}>
        <p style={{ color: 'var(--rose-danger)', marginBottom: '1rem', fontWeight: 500 }}>{error}</p>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  // Find Overall Budget if exists
  const overallBudget = budgets.find((b) => b.category_id === null || b.category_id === undefined);
  const overallStatus = overallBudget ? getBudgetStatusInfo(overallBudget.status, overallBudget.percentage_spent) : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Financial Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your spending, budget health, and categories</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenAddExpense}>
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <MetricCard
          title="Total Spending"
          value={formatCurrency(summary?.total_spend || 0)}
          icon={DollarSign}
          subtext="All-time accumulated expenses"
        />

        <MetricCard
          title="Current Month Spend"
          value={formatCurrency(summary?.current_month_spend || 0)}
          icon={Calendar}
          changePercent={summary?.mom_change_percentage}
          subtext="vs previous month"
        />

        {overallBudget ? (
          <div className="card metric-card">
            <div className="metric-header">
              <span className="metric-title">Monthly Budget Goal</span>
              <div className="metric-icon-box" style={{ background: overallStatus?.badgeBg, color: overallStatus?.barColor }}>
                <Target size={20} />
              </div>
            </div>
            <div className="metric-value">
              {formatCurrency(overallBudget.spent_amount)}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                / {formatCurrency(overallBudget.amount_limit)}
              </span>
            </div>
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                <span style={{ color: overallStatus?.badgeText, fontWeight: 600 }}>{overallStatus?.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{overallBudget.percentage_spent?.toFixed(1)}% spent</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(overallBudget.percentage_spent || 0, 100)}%`,
                    backgroundColor: overallStatus?.barColor,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <MetricCard
            title="Active Expenses"
            value={summary?.recent_expenses?.length ? `${summary.recent_expenses.length} Logged` : '0 Logged'}
            icon={Receipt}
            subtext="Ready to analyze"
          />
        )}
      </div>

      {/* Charts 2-Column Grid */}
      <div className="charts-grid">
        <div className="card chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Spending by Category</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>All Time</span>
          </div>
          <CategoryDonutChart data={categoryData} />
        </div>

        <div className="card chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Payment Method Breakdown</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Transactions & Spend</span>
          </div>
          <PaymentMethodBarChart data={paymentData} />
        </div>
      </div>

      {/* Spending Trend & Recent Transactions Split Grid */}
      <div className="dashboard-split-grid">
        {/* Spending Trend Area */}
        <div className="card chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Monthly Spending Trend</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Trajectory</span>
          </div>
          <SpendingTrendChart data={trendData} />
        </div>

        {/* Recent Transactions List */}
        <div className="card">
          <div className="chart-header">
            <h2 className="chart-title">Recent Transactions</h2>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={onNavigateToExpenses}
              style={{ color: 'var(--primary)', padding: '0.2rem 0.5rem' }}
            >
              View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </div>

          {!summary?.recent_expenses || summary.recent_expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <Receipt size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No recent expenses logged yet.</p>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={onOpenAddExpense} 
                style={{ marginTop: '0.75rem' }}
              >
                + Add First Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.recent_expenses.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', gap: '0.5rem', marginTop: 2 }}>
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span className="badge badge-gray" style={{ padding: '0 0.4rem', fontSize: '0.7rem' }}>
                        {item.category_name}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
