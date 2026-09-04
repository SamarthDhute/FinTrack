import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  Receipt,
  Plus,
  RefreshCw,
  Sparkles
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
import { AIInsightsCard } from '../components/AIInsightsCard';
import { HeroVibeCard } from '../components/HeroVibeCard';
import { RoastBanner } from '../components/RoastBanner';
import { formatCurrency, formatDate, getBudgetStatusInfo } from '../utils/formatters';

export const DashboardPage = ({ categories = [], onNavigateToExpenses, onOpenAddExpense, onOpenAIChat }) => {
  // UI state
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState(null);

  // Filter state
  const [timeRange, setTimeRange] = useState('month'); // 'week' | 'month' | 'custom'
  const [customRange, setCustomRange] = useState(null); // { start: '', end: '' }
  const [categoryFilter, setCategoryFilter] = useState(''); // category id or empty

  // Resolve available categories
  const availableCategories = categories && categories.length > 0 
    ? categories 
    : categoryData.map((c) => ({ id: c.category_id ?? c.id, name: c.category_name ?? c.name }));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (timeRange && timeRange !== 'custom') {
        params.range = timeRange;
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
      <div className="dashboard-loading" style={{ display: 'grid', gap: '1.25rem', padding: '1rem 0' }}>
        <Skeleton height="180px" />
        <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="100px" />
          ))}
        </div>
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

  // Calculate High-Impact Vibe Metrics
  const currentMonthSpend = summary?.current_month_spend || summary?.total_spend || 0;
  const daysInMonth = 30;
  const currentDay = new Date().getDate() || 1;
  const dailyAvg = currentMonthSpend / currentDay;

  // Find today's spend from recent expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySpend = (summary?.recent_expenses || [])
    .filter((e) => e.date && e.date.startsWith(todayStr))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Calculate Budget Health (0 - 100)
  const overallBudget = budgets.find((b) => b.category_id === null || b.category_id === undefined);
  let budgetHealth = 85;
  let safeToSpendDaily = 800;

  if (overallBudget && overallBudget.amount_limit > 0) {
    const remaining = overallBudget.amount_limit - overallBudget.spent_amount;
    const remainingDays = Math.max(daysInMonth - currentDay, 1);
    safeToSpendDaily = Math.max(remaining / remainingDays, 0);
    budgetHealth = Math.max(100 - (overallBudget.percentage_spent || 0), 0);
  } else if (dailyAvg > 0) {
    safeToSpendDaily = dailyAvg * 1.1;
  }

  // Find Top Category
  const topCatObj = categoryData && categoryData.length > 0 ? categoryData[0] : null;
  const topCategoryName = topCatObj ? (topCatObj.category_name || topCatObj.name) : 'Food & Dining';
  const topCategorySpend = topCatObj ? (topCatObj.total_amount || topCatObj.amount || 0) : 0;

  const overBudgetCategories = budgets
    .filter((b) => b.percentage_spent && b.percentage_spent >= 100)
    .map((b) => b.category_name || 'Overall');

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* 1. AI Roast Banner ("The Tea" ☕) */}
      <RoastBanner
        topCategory={topCategoryName}
        topCategorySpend={topCategorySpend}
        totalSpend={currentMonthSpend}
        overBudgetCategories={overBudgetCategories}
      />

      {/* 2. Hero Vibe Check Card (Dynamic Emoji Status + Daily Burn Rate) */}
      <HeroVibeCard
        totalSpend={currentMonthSpend}
        dailyAvg={dailyAvg}
        todaySpend={todaySpend}
        budgetHealth={budgetHealth}
        safeToSpendDaily={safeToSpendDaily}
        onOpenAddExpense={onOpenAddExpense}
        onOpenAIChat={onOpenAIChat}
      />

      {/* Filters Toolbar */}
      <div
        className="filters-bar card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            onCustomChange={setCustomRange}
          />
          <CategoryFilter
            categories={availableCategories}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
        <RefreshButton onClick={() => fetchDashboardData()} loading={loading} />
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <SummaryCard
          title="Total Lifetime Burn"
          value={<CountUpNumber end={summary?.total_spend || 0} prefix='₹' />}
          icon={DollarSign}
          subtext="All‑time logged expenses"
        />

        <SummaryCard
          title="Current Month Spend"
          value={<CountUpNumber end={summary?.current_month_spend || 0} prefix='₹' />}
          icon={Calendar}
          changePercent={summary?.mom_change_percentage}
          subtext="vs previous month"
        />

        {overallBudget ? (
          <SummaryCard
            title="Safe Remaining Stash"
            value={<CountUpNumber end={Math.max(overallBudget.amount_limit - overallBudget.spent_amount, 0)} prefix='₹' />}
            icon={Target}
            subtext={`${overallBudget.percentage_spent?.toFixed(1)}% burned`}
          >
            <div className="progress-track" style={{ height: '6px', background: '#E5E7EB', borderRadius: '999px', marginTop: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(overallBudget.percentage_spent || 0, 100)}%`,
                  background: overallBudget.percentage_spent > 90 ? '#DC2626' : '#16A34A',
                  height: '100%',
                  borderRadius: '999px',
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

      {/* 3. AI Financial Insights Suite */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AIInsightsCard />
      </div>

      {/* 4. Charts Grid Breakdown */}
      <div className="charts-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '1.5rem' }}>
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

      {/* 6. Spending Trend & Recent Activity Feed */}
      <div className="dashboard-split-grid grid gap-4 md:grid-cols-2">
        {/* Spending Trend Area */}
        <div className="card chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Monthly Trajectory Trend</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Pacing</span>
          </div>
          <SpendingTrendChart data={trendData} />
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="chart-header">
            <h2 className="chart-title">Recent Activity Feed</h2>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={onNavigateToExpenses}
              style={{ color: '#3B82F6', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}
            >
              View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </div>

          {!summary?.recent_expenses || summary.recent_expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <Receipt size={32} style={{ opacity: 0.3, marginBottom: '0.5rem', color: '#9CA3AF' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No recent expenses logged yet.</p>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={onOpenAddExpense} 
                style={{ marginTop: '0.75rem' }}
              >
                + Fast Log Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.recent_expenses.slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 3 }}>
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span 
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#3B82F6',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {item.category_name}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#DC2626' }}>
                    -{formatCurrency(item.amount)}
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
