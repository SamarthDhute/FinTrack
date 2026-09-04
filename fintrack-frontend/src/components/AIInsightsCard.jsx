import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  BrainCircuit,
  PiggyBank,
  Repeat,
  Target,
  X,
  Calculator,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api/client';

export const AIInsightsCard = () => {
  const [insights, setInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  // Goal Planner Modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalAmount, setGoalAmount] = useState('50000');
  const [goalMonths, setGoalMonths] = useState('6');
  const [goalPlanResult, setGoalPlanResult] = useState(null);
  const [isCalculatingGoal, setIsCalculatingGoal] = useState(false);

  const fetchAIData = async () => {
    try {
      setIsLoading(true);
      const [insightsData, forecastData, subsData, providerData] = await Promise.all([
        api.ai.getInsights().catch(() => null),
        api.ai.getForecast().catch(() => null),
        api.ai.getSubscriptions().catch(() => null),
        api.ai.getProviderStatus().catch(() => null),
      ]);
      setInsights(insightsData);
      setForecast(forecastData);
      setSubscriptions(subsData);
      setProviderInfo(providerData);
    } catch (err) {
      console.error('Failed to fetch AI data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleCalculateGoal = async (e) => {
    if (e) e.preventDefault();
    if (!goalAmount || !goalMonths) return;
    try {
      setIsCalculatingGoal(true);
      const res = await api.ai.getGoalPlan({
        target_amount: parseFloat(goalAmount),
        target_months: parseInt(goalMonths, 10),
      });
      setGoalPlanResult(res);
    } catch (err) {
      console.error('Goal plan error:', err);
    } finally {
      setIsCalculatingGoal(false);
    }
  };

  const healthScore = insights?.health_score?.score ?? 85;
  const healthStatus = insights?.health_score?.status ?? 'Good';
  const healthSummary = insights?.health_score?.summary ?? 'Your spending patterns are healthy and well-managed.';

  const getScoreColor = (score) => {
    if (score >= 80) return { primary: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.25)' };
    if (score >= 60) return { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)' };
    if (score >= 40) return { primary: '#D97706', bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.25)' };
    return { primary: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)' };
  };

  const scoreTheme = getScoreColor(healthScore);

  const getImpactBadge = (type) => {
    switch (type) {
      case 'saving':
        return { icon: PiggyBank, label: 'Savings Opportunity', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.25)' };
      case 'warning':
        return { icon: AlertTriangle, label: 'Budget Alert', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)' };
      case 'praise':
        return { icon: CheckCircle2, label: 'Great Habit', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.25)' };
      case 'tip':
      default:
        return { icon: Lightbulb, label: 'Smart Tip', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)', border: 'rgba(2, 132, 199, 0.25)' };
    }
  };

  const totalPotentialSavings = (insights?.key_insights || []).reduce((acc, item) => {
    return acc + (item.estimated_savings ? Number(item.estimated_savings) : 0);
  }, 0);

  return (
    <div 
      className="card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '1.75rem',
      }}
    >
      {/* Decorative Glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} 
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Sparkles size={22} className={isLoading ? 'animate-spin' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#111827', fontWeight: 700 }}>
                AI Financial Advisor & Insights
              </h3>
              <span 
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366F1',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                PRO
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BrainCircuit size={13} style={{ color: '#3B82F6' }} />
              <span>
                {providerInfo?.active_engine ? `Powered by ${providerInfo.active_engine}` : (insights?.provider_used ? `Powered by ${insights.provider_used}` : 'AI Spending Analyzer')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setIsGoalModalOpen(true);
              if (!goalPlanResult) handleCalculateGoal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '10px',
              background: '#F3F4F6',
              borderColor: '#E5E7EB',
              color: '#111827',
              fontWeight: 600,
            }}
          >
            <Target size={14} style={{ color: '#6366F1' }} />
            <span>Savings Goal</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchAIData}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '10px',
              background: '#F3F4F6',
              borderColor: '#E5E7EB',
              color: '#111827',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Health Score + Key Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Health Score Banner */}
        <div 
          style={{
            background: scoreTheme.bg,
            border: `1px solid ${scoreTheme.border}`,
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: scoreTheme.primary }}>
                Financial Health Score
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: scoreTheme.primary }}>
                {healthStatus}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
                {healthScore}
              </span>
              <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 600 }}>/ 100</span>
            </div>

            <div style={{ height: '6px', width: '100%', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${healthScore}%`,
                  background: `linear-gradient(90deg, ${scoreTheme.primary}, #3B82F6)`,
                  borderRadius: '3px',
                }}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
              {healthSummary}
            </p>
          </div>

          {totalPotentialSavings > 0 && (
            <div 
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Potential Monthly Savings</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#16A34A' }}>
                ₹{totalPotentialSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Actionable Insights List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(insights?.key_insights || []).slice(0, 3).map((item, idx) => {
            const badge = getImpactBadge(item.impact_type);
            const BadgeIcon = badge.icon;

            return (
              <div 
                key={idx}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <BadgeIcon size={16} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      {item.title}
                    </span>
                    {item.estimated_savings && (
                      <span 
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#16A34A',
                          background: 'rgba(22, 163, 74, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Save ₹{Number(item.estimated_savings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 7 & 9: Forecast & Subscriptions Banner Strip */}
      <div 
        style={{ 
          marginTop: '1.25rem', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '0.75rem' 
        }}
      >
        {/* Month-End Predictive Forecast */}
        {forecast && (
          <div 
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={18} style={{ color: '#3B82F6' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Month-End Spend Forecast</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  ₹{Number(forecast.projected_month_end_spend).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              ₹{Number(forecast.daily_run_rate).toFixed(0)}/day pacing
            </span>
          </div>
        )}

        {/* Subscriptions Detector Strip */}
        {subscriptions && subscriptions.count > 0 && (
          <div 
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowSubs(!showSubs)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Repeat size={18} style={{ color: '#0284C7' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Recurring Subscriptions ({subscriptions.count})</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  ₹{Number(subscriptions.total_monthly_burn).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              {showSubs ? 'Hide' : 'View'} <ChevronRight size={13} />
            </span>
          </div>
        )}
      </div>

      {/* Subscriptions List Expandable */}
      {showSubs && subscriptions?.subscriptions && (
        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          {subscriptions.subscriptions.map((sub, idx) => (
            <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{sub.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                <span>{sub.category_name}</span>
                <span style={{ color: '#0284C7', fontWeight: 600 }}>₹{Number(sub.average_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible: AI Budget Suggestions */}
      {insights?.budget_recommendations && insights.budget_recommendations.length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setShowBudgets(!showBudgets)}
            style={{
              background: 'none',
              border: 'none',
              color: '#3B82F6',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0,
            }}
          >
            <span>{showBudgets ? 'Hide' : 'View'} AI Suggested Category Budgets ({insights.budget_recommendations.length})</span>
            {showBudgets ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {showBudgets && (
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {insights.budget_recommendations.map((rec, idx) => (
                <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', marginBottom: '0.35rem' }}>{rec.category_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#6B7280' }}>Current:</span>
                    <span style={{ color: '#111827', fontWeight: 600 }}>₹{Number(rec.current_spending).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#3B82F6' }}>AI Target:</span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>₹{Number(rec.suggested_budget).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: '#6B7280', margin: 0, lineHeight: 1.35 }}>{rec.reasoning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goal Planner Modal */}
      {isGoalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="#6366F1" />
                <h3>AI Goal Savings Planner</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsGoalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCalculateGoal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Target Savings (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timeline (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      className="form-input"
                      value={goalMonths}
                      onChange={(e) => setGoalMonths(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isCalculatingGoal}>
                  {isCalculatingGoal ? 'Calculating Plan...' : 'Generate AI Cutback Strategy'}
                </button>

                {goalPlanResult && (
                  <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '1rem', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>Monthly Required:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#16A34A' }}>₹{Number(goalPlanResult.monthly_savings_required).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                      {goalPlanResult.strategy_summary}
                    </p>

                    {goalPlanResult.category_cutbacks?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' }}>Recommended Cutbacks:</span>
                        {goalPlanResult.category_cutbacks.map((cut, cIdx) => (
                          <div key={cIdx} style={{ fontSize: '0.78rem', background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                              <span>{cut.category_name}</span>
                              <span style={{ color: '#DC2626' }}>-₹{Number(cut.suggested_cutback_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: '2px' }}>{cut.savings_tip}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsCard;
