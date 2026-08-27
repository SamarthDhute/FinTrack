import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  Receipt,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { SummaryCard } from '../components/SummaryCard';
import { AlertBanner } from '../components/AlertBanner';
import { Skeleton } from '../components/Skeleton';
import { CountUpNumber } from '../components/CountUpNumber';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { CategoryFilter } from '../components/CategoryFilter';
import { RefreshButton } from '../components/RefreshButton';
import { CategoryDonutChart, PaymentMethodBarChart, SpendingTrendChart } from '../components/Charts';
import { formatCurrency, formatDate, getBudgetStatusInfo } from '../utils/formatters';

export const DashboardPage = ({ onNavigateToExpenses, onOpenAddExpense }) => {
  // UI state
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState(null);

  // New filter state
  const [timeRange, setTimeRange] = useState('month'); // 'week' | 'month' | 'custom'
  const [customRange, setCustomRange] = useState(null); // { start: '', end: '' }
  const [categoryFilter, setCategoryFilter] = useState(''); // category id or empty

  const fetchDashboardData = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on filters
      const params = {};
      if (timeRange && timeRange !== 'custom') {
        params.range = timeRange; // 'week' or 'month'
      } else if (customRange) {
        params.start = customRange.start;
        params.end = customRange.end;
      }
      if (categoryFilter) {
        params.category_id = categoryFilter;
      }

      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `/dashboard/summary?${query}` : '/dashboard/summary';

      const [sumRes, catRes, payRes, trdRes, budRes] = await Promise.all([
        api.request(endpoint).catch(() => null),
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
  }, [timeRange, customRange, categoryFilter]);

  if (loading) {
    return (
      <div className="dashboard-loading" style={{ display: 'grid', gap: '1rem', padding: '2rem' }}>
        {/* Skeletons for summary cards */}
        <div className="summary-grid">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
        {/* Skeletons for charts */}
        <Skeleton height="300px" />
        <Skeleton height="300px" />
        <Skeleton height="300px" />
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

  // Alert for budget limit
  const budgetExceeded = budgets.some(b => b.percentage_spent && b.percentage_spent >= 100);
  const nearLimitThreshold = 80; // can be configured later
  const nearLimit = budgets.some(b => b.percentage_spent && b.percentage_spent >= nearLimitThreshold && b.percentage_spent < 100);

  return (
    <div>
      {/* Alert Banner */}
      {(budgetExceeded || nearLimit) && (
        <AlertBanner
          type={budgetExceeded ? 'error' : 'warning'}
          message={budgetExceeded ? 'You have exceeded your budget!' : 'Approaching budget limit.'}
        />
      )}
      {/* Filters */}
      <div className="filters-bar flex items-center justify-between mb-4">
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onCustomChange={setCustomRange}
        />
        <CategoryFilter
          categories={categoryData.map(c => ({ id: c.id, name: c.name }))}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        <RefreshButton onClick={() => fetchDashboardData()} loading={loading} />
      </div>

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
          <SummaryCard
            title="Total Spend"
            value={<CountUpNumber end={summary?.total_spend || 0} prefix='$' />}
            icon={DollarSign}
            subtext="All‑time accumulated expenses"
          />

          <SummaryCard
            title="Current Month Spend"
            value={<CountUpNumber end={summary?.current_month_spend || 0} prefix='$' />}
            icon={Calendar}
            changePercent={summary?.mom_change_percentage}
            subtext="vs previous month"
          />

          {overallBudget ? (
            <SummaryCard
              title="Remaining Budget"
              value={<CountUpNumber end={overallBudget.amount_limit - overallBudget.spent_amount} prefix='$' />}
              icon={Target}
              subtext={`${overallBudget.percentage_spent?.toFixed(1)}% spent`}
            >
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(overallBudget.percentage_spent || 0, 100)}%`,
                    backgroundColor: overallStatus?.barColor,
                  }}
                />
              </div>
            </SummaryCard>
          ) : (
            <SummaryCard
              title="Active Expenses"
              value={summary?.recent_expenses?.length ? `${summary.recent_expenses.length} Logged` : '0 Logged'}
              icon={Receipt}
              subtext="Ready to analyze"
            />
          )}
      </div>

      {/* Charts Grid (Responsive) */}
      <div className="charts-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Spending Trend & Recent Transactions */}
      <div className="dashboard-split-grid grid gap-4 md:grid-cols-2">
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
