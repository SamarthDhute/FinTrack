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
  Sparkles,
  SlidersHorizontal,
  Maximize2,
  PieChart,
  BarChart3,
  Activity,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp
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
import { CardZoomModal } from '../components/CardZoomModal';
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

  // Optional Collapsible Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // 'week' | 'month' | 'custom'
  const [customRange, setCustomRange] = useState(null); // { start: '', end: '' }
  const [categoryFilter, setCategoryFilter] = useState(''); // category id or empty

  // Zoom on touch modal state
  const [zoomedCard, setZoomedCard] = useState(null);

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

  // Extract user-defined daily limit & monthly budget
  const dailyBudget = summary?.daily_budget || budgets.find((b) => b.period === 'daily' && (b.category_id === null || b.category_id === undefined));
  const overallBudget = summary?.overall_budget || budgets.find((b) => (b.period === 'monthly' || !b.period) && (b.category_id === null || b.category_id === undefined));

  // Find today's spend from backend summary or recent expenses
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySpend = summary?.today_spend !== undefined 
    ? parseFloat(summary.today_spend) 
    : (summary?.recent_expenses || [])
        .filter((e) => e.date && e.date.startsWith(todayStr))
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Calculate safeToSpendDaily & Budget Health
  let safeToSpendDaily = 800;
  let hasCustomDailyLimit = false;

  if (dailyBudget && (dailyBudget.limit || dailyBudget.amount_limit)) {
    safeToSpendDaily = parseFloat(dailyBudget.limit || dailyBudget.amount_limit);
    hasCustomDailyLimit = true;
  } else if (overallBudget && (overallBudget.limit || overallBudget.amount_limit) > 0) {
    const limit = parseFloat(overallBudget.limit || overallBudget.amount_limit);
    const spent = parseFloat(overallBudget.spent || overallBudget.spent_amount || 0);
    const remaining = limit - spent;
    const remainingDays = Math.max(daysInMonth - currentDay, 1);
    safeToSpendDaily = Math.max(remaining / remainingDays, 0);
  } else if (dailyAvg > 0) {
    safeToSpendDaily = dailyAvg * 1.1;
  }

  let budgetHealth = 85;
  if (hasCustomDailyLimit && safeToSpendDaily > 0) {
    const dailyRatio = (todaySpend / safeToSpendDaily) * 100;
    budgetHealth = Math.max(Math.min(Math.round(100 - dailyRatio), 100), 0);
  } else if (overallBudget && (overallBudget.limit || overallBudget.amount_limit) > 0) {
    const pct = overallBudget.percentage_spent ?? ((overallBudget.spent / overallBudget.limit) * 100) ?? 0;
    budgetHealth = Math.max(Math.min(Math.round(100 - pct), 100), 0);
  }

  // Find Top Category
  const topCatObj = categoryData && categoryData.length > 0 ? categoryData[0] : null;
  const topCategoryName = topCatObj ? (topCatObj.category_name || topCatObj.name) : 'Food & Dining';
  const topCategorySpend = topCatObj ? (topCatObj.total_amount || topCatObj.amount || 0) : 0;

  const overBudgetCategories = budgets
    .filter((b) => b.percentage_spent && b.percentage_spent >= 100)
    .map((b) => b.category_name || (b.period === 'daily' ? 'Daily Cap' : 'Overall'));

  const activeCategoryName = categoryFilter 
    ? (availableCategories.find((c) => String(c.id) === String(categoryFilter))?.name || 'Category')
    : null;

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* 1. AI Roast Banner ("The Tea" ☕) */}
      <RoastBanner
        topCategory={topCategoryName}
        topCategorySpend={topCategorySpend}
        totalSpend={currentMonthSpend}
        overBudgetCategories={overBudgetCategories}
      />

      {/* 2. Hero Vibe Check Card */}
      <div style={{ position: 'relative' }}>
        <HeroVibeCard
          totalSpend={currentMonthSpend}
          dailyAvg={dailyAvg}
          todaySpend={todaySpend}
          budgetHealth={budgetHealth}
          safeToSpendDaily={safeToSpendDaily}
          hasCustomDailyLimit={hasCustomDailyLimit}
          onOpenAddExpense={onOpenAddExpense}
          onOpenAIChat={onOpenAIChat}
        />
        <button
          type="button"
          onClick={() => setZoomedCard({
            id: 'hero-vibe',
            title: '🔥 Live Financial Health & Burn Rate',
            subtitle: 'Overview of monthly spend, daily cap, and savings pacing',
            icon: Flame,
            content: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <HeroVibeCard
                  totalSpend={currentMonthSpend}
                  dailyAvg={dailyAvg}
                  todaySpend={todaySpend}
                  budgetHealth={budgetHealth}
                  safeToSpendDaily={safeToSpendDaily}
                  hasCustomDailyLimit={hasCustomDailyLimit}
                  onOpenAddExpense={onOpenAddExpense}
                  onOpenAIChat={onOpenAIChat}
                />
                <div style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>📊 Pacing Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                    <div>Total Spent: <strong>{formatCurrency(currentMonthSpend)}</strong></div>
                    <div>Today's Spend: <strong style={{ color: todaySpend > safeToSpendDaily ? '#DC2626' : '#16A34A' }}>{formatCurrency(todaySpend)}</strong></div>
                    <div>Daily Cap: <strong>{formatCurrency(safeToSpendDaily)}</strong></div>
                    <div>Health Score: <strong>{budgetHealth}/100</strong></div>
                  </div>
                </div>
              </div>
            )
          })}
          className="btn btn-ghost btn-sm"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            fontSize: '0.72rem',
            color: '#6B7280',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            zIndex: 2,
          }}
          title="Zoom Hero Card"
        >
          <Maximize2 size={13} />
          <span>Zoom</span>
        </button>
      </div>

      {/* Optional Collapsible Filters Control */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              background: showFilters ? 'rgba(59, 130, 246, 0.08)' : '#FFFFFF',
              color: showFilters ? '#3B82F6' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <SlidersHorizontal size={14} />
            <span>{showFilters ? 'Hide Analytics Filters' : 'Filter Analytics'}</span>
            {(categoryFilter || timeRange !== 'month') && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeCategoryName && (
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.75rem' }}>
                🏷️ {activeCategoryName}
              </span>
            )}
            <RefreshButton onClick={() => fetchDashboardData()} loading={loading} />
          </div>
        </div>

        {/* Collapsible Filters Bar */}
        {showFilters && (
          <div
            className="card"
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
              padding: '0.85rem 1.25rem',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              animation: 'fadeIn 0.2s ease-out',
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
            {(categoryFilter || timeRange !== 'month') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setTimeRange('month');
                  setCustomRange(null);
                  setCategoryFilter('');
                }}
                style={{ fontSize: '0.75rem', color: '#DC2626' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div 
          onClick={() => setZoomedCard({
            id: 'lifetime-burn',
            title: '💰 Total Lifetime Burn',
            subtitle: 'Cumulative historical expense burn recorded in FinTrack',
            icon: DollarSign,
            content: (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(summary?.total_spend || 0)}
                </div>
                <p style={{ color: '#6B7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  All-time logged expense transactions across all active categories and payment methods.
                </p>
              </div>
            )
          })}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          className="interactive-zoom-card"
        >
          <SummaryCard
            title="Total Lifetime Burn"
            value={<CountUpNumber end={summary?.total_spend || 0} prefix='₹' />}
            icon={DollarSign}
            subtext="All‑time logged expenses (Tap to zoom)"
          />
        </div>

        <div 
          onClick={() => setZoomedCard({
            id: 'month-spend',
            title: '📅 Current Month Spend',
            subtitle: 'Monthly trajectory comparison vs previous month',
            icon: Calendar,
            content: (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 800, color: '#111827', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(summary?.current_month_spend || 0)}
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-emerald">MoM: {summary?.mom_change_percentage ? `${summary.mom_change_percentage}%` : 'Normal Pacing'}</span>
                </div>
              </div>
            )
          })}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          className="interactive-zoom-card"
        >
          <SummaryCard
            title="Current Month Spend"
            value={<CountUpNumber end={summary?.current_month_spend || 0} prefix='₹' />}
            icon={Calendar}
            changePercent={summary?.mom_change_percentage}
            subtext="vs previous month (Tap to zoom)"
          />
        </div>

        {overallBudget ? (
          (() => {
            const spentVal = parseFloat(overallBudget.spent || overallBudget.spent_amount || 0);
            const limitVal = parseFloat(overallBudget.limit || overallBudget.amount_limit || 0);
            const isOver = spentVal > limitVal;
            const diff = Math.abs(limitVal - spentVal);
            const pct = overallBudget.percentage_spent ?? (limitVal > 0 ? (spentVal / limitVal) * 100 : 0);
            return (
              <div 
                onClick={() => setZoomedCard({
                  id: 'budget-summary',
                  title: isOver ? '🚨 Over Budget Warning' : '🎯 Budget Goals Status',
                  subtitle: isOver ? `Extra spend of ₹${diff.toFixed(2)} beyond monthly target` : `Safe remaining stash of ₹${diff.toFixed(2)}`,
                  icon: Target,
                  content: (
                    <div style={{ padding: '1rem' }}>
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {isOver ? 'Total Extra Spent' : 'Remaining Safe Stash'}
                        </div>
                        <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 800, color: isOver ? '#DC2626' : '#16A34A', fontFamily: 'var(--font-heading)' }}>
                          {isOver ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '4px' }}>
                          Limit: {formatCurrency(limitVal)} • Spent: {formatCurrency(spentVal)} ({pct.toFixed(1)}%)
                        </div>
                      </div>

                      <div className="progress-track" style={{ height: '12px', borderRadius: '999px' }}>
                        <div 
                          className="progress-fill" 
                          style={{
                            width: `${Math.min(pct || 0, 100)}%`,
                            background: isOver ? '#DC2626' : pct > 85 ? '#D97706' : '#16A34A',
                            height: '100%',
                            borderRadius: '999px',
                          }} 
                        />
                      </div>
                    </div>
                  )
                })}
                style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                className="interactive-zoom-card"
              >
                <SummaryCard
                  title={isOver ? "Extra Spent 🚨" : "Remaining Budget"}
                  value={
                    <span style={{ color: isOver ? '#DC2626' : '#16A34A', fontWeight: 800 }}>
                      {isOver ? `+₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  }
                  icon={Target}
                  subtext={isOver ? `Over budget by ₹${diff.toFixed(2)} (Tap to zoom)` : `${pct.toFixed(1)}% consumed (Tap to zoom)`}
                >
                  <div className="progress-track" style={{ height: '6px', background: '#E5E7EB', borderRadius: '999px', marginTop: '8px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(pct || 0, 100)}%`,
                        background: isOver ? '#DC2626' : pct > 85 ? '#D97706' : '#16A34A',
                        height: '100%',
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                </SummaryCard>
              </div>
            );
          })()
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
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <AIInsightsCard />
      </div>

      {/* 4. Charts Grid Breakdown with Zoom Triggers */}
      <div className="charts-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        
        {/* Category Donut Chart */}
        <div className="card chart-container zoom-card-interactive" style={{ position: 'relative' }}>
          <div className="chart-header">
            <h2 className="chart-title">Spending by Category</h2>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setZoomedCard({
                id: 'category-chart',
                title: '🏷️ Spending by Category (Full Breakdown)',
                subtitle: 'Detailed share of expenditure across all tagged categories',
                icon: PieChart,
                content: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ height: '360px' }}>
                      <CategoryDonutChart data={categoryData} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {categoryData.map((c) => (
                        <div key={c.category_id || c.name} style={{ background: '#F9FAFB', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{c.category_name || c.name}</span>
                          <strong style={{ color: '#3B82F6' }}>{formatCurrency(c.total_amount || c.amount || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              title="Zoom Category Chart"
            >
              <Maximize2 size={15} />
            </button>
          </div>
          <CategoryDonutChart data={categoryData} />
        </div>

        {/* Payment Method Bar Chart */}
        <div className="card chart-container zoom-card-interactive" style={{ position: 'relative' }}>
          <div className="chart-header">
            <h2 className="chart-title">Payment Method Breakdown</h2>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setZoomedCard({
                id: 'payment-chart',
                title: '💳 Payment Method Volume Breakdown',
                subtitle: 'Spending distribution and transaction count by payment channel',
                icon: BarChart3,
                content: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ height: '360px' }}>
                      <PaymentMethodBarChart data={paymentData} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {paymentData.map((p) => (
                        <div key={p.payment_method_id || p.name} style={{ background: '#F9FAFB', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{p.payment_method_name || p.name}</span>
                          <strong style={{ color: '#16A34A' }}>{formatCurrency(p.total_amount || p.amount || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              title="Zoom Payment Chart"
            >
              <Maximize2 size={15} />
            </button>
          </div>
          <PaymentMethodBarChart data={paymentData} />
        </div>
      </div>

      {/* 5. Spending Trend & Recent Activity Feed */}
      <div className="dashboard-split-grid grid gap-4 md:grid-cols-2">
        {/* Spending Trend Area */}
        <div className="card chart-container zoom-card-interactive" style={{ position: 'relative' }}>
          <div className="chart-header">
            <h2 className="chart-title">Monthly Trajectory Trend</h2>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setZoomedCard({
                id: 'trend-chart',
                title: '📈 Spending Trend & Trajectory',
                subtitle: 'Daily historical burn over the last 30 days',
                icon: Activity,
                content: (
                  <div style={{ height: '420px' }}>
                    <SpendingTrendChart data={trendData} />
                  </div>
                )
              })}
              title="Zoom Trajectory Chart"
            >
              <Maximize2 size={15} />
            </button>
          </div>
          <SpendingTrendChart data={trendData} />
        </div>

        {/* Recent Activity Feed */}
        <div className="card zoom-card-interactive" style={{ position: 'relative' }}>
          <div className="chart-header">
            <h2 className="chart-title">Recent Activity Feed</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setZoomedCard({
                  id: 'recent-activity',
                  title: '🧾 Full Recent Activity Log',
                  subtitle: 'Latest expense transactions logged in your FinTrack account',
                  icon: Receipt,
                  content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(summary?.recent_expenses || []).map((item) => (
                        <div 
                          key={item.id}
                          className="activity-item-interactive"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                              <span>{formatDate(item.date)}</span>
                              <span>•</span>
                              <span className="badge badge-indigo">{item.category_name}</span>
                              {item.payment_method_name && (
                                <span className="badge badge-gray">{item.payment_method_name}</span>
                              )}
                            </div>
                            {item.notes && (
                              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '4px 0 0 0' }}>{item.notes}</p>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#DC2626' }}>
                            -{formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
                title="Zoom Activity Feed"
              >
                <Maximize2 size={15} />
              </button>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={onNavigateToExpenses}
                style={{ color: '#3B82F6', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}
              >
                View All <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </div>
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
                  className="activity-item-interactive"
                  onClick={() => setZoomedCard({
                    id: `expense-${item.id}`,
                    title: `🧾 ${item.title}`,
                    subtitle: `${formatDate(item.date)} • ${item.category_name}`,
                    icon: Receipt,
                    content: (
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Expense Amount</span>
                          <div style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-heading)' }}>
                            -{formatCurrency(item.amount)}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Category</div>
                            <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>{item.category_name}</div>
                          </div>
                          <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Payment Channel</div>
                            <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>{item.payment_method_name || 'Standard Payment'}</div>
                          </div>
                          <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Date Logged</div>
                            <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px' }}>{formatDate(item.date)}</div>
                          </div>
                        </div>

                        {item.notes && (
                          <div style={{ background: '#F9FAFB', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Notes</div>
                            <div style={{ fontSize: '0.9rem', color: '#374151' }}>{item.notes}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
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

      {/* Card Zoom Modal */}
      {zoomedCard && (
        <CardZoomModal
          isOpen={Boolean(zoomedCard)}
          onClose={() => setZoomedCard(null)}
          title={zoomedCard.title}
          subtitle={zoomedCard.subtitle}
          icon={zoomedCard.icon}
        >
          {zoomedCard.content}
        </CardZoomModal>
      )}
    </div>
  );
};

