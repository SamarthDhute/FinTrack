import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Zap,
  Flame,
  Calendar
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { BudgetModal } from '../components/BudgetModal';
import { DeleteModal } from '../components/DeleteModal';
import { formatCurrency, getBudgetStatusInfo } from '../utils/formatters';

export const BudgetsPage = ({ categories = [], onRefreshGlobalData }) => {
  const { success, error } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalInitialPeriod, setModalInitialPeriod] = useState('monthly');
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.budgets.list();
      setBudgets(res || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSaveBudget = async (payload) => {
    try {
      setIsSaving(true);
      if (editingBudget) {
        await api.budgets.update(editingBudget.id, payload);
        success(`${payload.period === 'daily' ? 'Daily limit' : 'Budget'} updated successfully!`);
      } else {
        await api.budgets.create(payload);
        success(`${payload.period === 'daily' ? 'Daily limit' : 'Budget'} set successfully!`);
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      fetchBudgets();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Save budget error:', err);
      error(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      setIsDeleting(true);
      await api.budgets.delete(budgetToDelete.id);
      success(`${budgetToDelete.period === 'daily' ? 'Daily limit' : 'Budget'} removed successfully!`);
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
      fetchBudgets();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Delete budget error:', err);
      error(err.message || 'Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  const dailyBudget = budgets.find(
    (b) => b.period === 'daily' && (b.category_id === null || b.category_id === undefined)
  );
  const overallMonthlyBudget = budgets.find(
    (b) => (b.period === 'monthly' || !b.period) && (b.category_id === null || b.category_id === undefined)
  );
  const categoryBudgets = budgets.filter((b) => b.category_id !== null && b.category_id !== undefined);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-title-group">
          <h1>Budget Goals & Daily Spending Limits</h1>
          <p className="page-subtitle">Track your daily spending cap and monthly limits to prevent overspending in real time</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setEditingBudget(null);
              setModalInitialPeriod('daily');
              setIsModalOpen(true);
            }}
            style={{ border: '1px solid #D97706', color: '#D97706' }}
          >
            <Zap size={16} />
            <span>⚡ Set Daily Limit</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingBudget(null);
              setModalInitialPeriod('monthly');
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Set Monthly Budget</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading budget goals and limits...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon-circle">
            <Target size={32} />
          </div>
          <h3 className="empty-title">No spending limits set</h3>
          <p className="empty-desc">
            Set an overall daily limit or monthly spending goal to keep your expenses under control.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditingBudget(null);
                setModalInitialPeriod('daily');
                setIsModalOpen(true);
              }}
              style={{ border: '1px solid #D97706', color: '#D97706' }}
            >
              <Zap size={16} />
              <span>⚡ Set Daily Limit</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingBudget(null);
                setModalInitialPeriod('monthly');
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} />
              <span>Set Monthly Budget</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Top Grid: Daily Limit & Monthly Budget Spotlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* 1. Daily Limit Spotlight */}
            {dailyBudget ? (
              <div 
                className="card zoom-card-interactive" 
                style={{ 
                  border: '1px solid #E5E7EB',
                  borderLeft: '4px solid #D97706', 
                  background: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)',
                }}
              >
                {(() => {
                  const statusInfo = getBudgetStatusInfo(dailyBudget.status, dailyBudget.percentage_spent);
                  const isOver = (dailyBudget.percentage_spent || 0) > 100;
                  return (
                    <div>
                      <div className="budget-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={16} color="#D97706" />
                            <span className="badge" style={{ backgroundColor: statusInfo.badgeBg, color: statusInfo.badgeText, border: `1px solid ${statusInfo.barColor}` }}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--text-main)' }}>
                            ⚡ Daily Spending Limit
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingBudget(dailyBudget);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete Daily Limit"
                            onClick={() => {
                              setBudgetToDelete(dailyBudget);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={15} color="var(--rose-danger)" />
                          </button>
                        </div>
                      </div>

                      <div className="budget-card-stats" style={{ alignItems: 'flex-end', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spent Today</div>
                          <div className="budget-spent-val" style={{ color: statusInfo.barColor, fontSize: 'clamp(1.3rem, 3.5vw, 1.6rem)' }}>
                            {formatCurrency(dailyBudget.spent_amount)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: isOver ? 'var(--rose-danger)' : 'var(--text-muted)', fontWeight: isOver ? 700 : 500 }}>
                            {isOver ? 'Extra Spent 🚨' : 'Remaining Today'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 800, color: isOver ? 'var(--rose-danger)' : 'var(--emerald-green)' }}>
                            {isOver ? `+${formatCurrency(dailyBudget.spent_amount - dailyBudget.amount_limit)}` : formatCurrency(dailyBudget.amount_limit - dailyBudget.spent_amount)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Limit: {formatCurrency(dailyBudget.amount_limit)}/day
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="progress-track" style={{ height: 10 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(dailyBudget.percentage_spent || 0, 100)}%`,
                              backgroundColor: statusInfo.barColor,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                          <span>Today: {dailyBudget.percentage_spent?.toFixed(1)}%</span>
                          <span>Cap: {formatCurrency(dailyBudget.amount_limit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div 
                className="card" 
                style={{ 
                  border: '1px dashed #D1D5DB', 
                  background: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '1.5rem',
                  gap: '0.75rem'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} color="#D97706" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', margin: 0 }}>No Daily Limit Configured</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>
                    Set a per-day spending limit to stay mindful and alert against impulse spends.
                  </p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditingBudget(null);
                    setModalInitialPeriod('daily');
                    setIsModalOpen(true);
                  }}
                  style={{ border: '1px solid #D97706', color: '#D97706' }}
                >
                  <Zap size={14} /> Set Daily Limit
                </button>
              </div>
            )}

            {/* 2. Monthly Budget Spotlight */}
            {overallMonthlyBudget ? (
              <div 
                className="card zoom-card-interactive" 
                style={{ 
                  border: '1px solid #E5E7EB',
                  borderLeft: '4px solid var(--primary)', 
                  background: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.06)',
                }}
              >
                {(() => {
                  const statusInfo = getBudgetStatusInfo(overallMonthlyBudget.status, overallMonthlyBudget.percentage_spent);
                  const isOver = (overallMonthlyBudget.percentage_spent || 0) > 100;
                  return (
                    <div>
                      <div className="budget-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} color="var(--primary)" />
                            <span className="badge" style={{ backgroundColor: statusInfo.badgeBg, color: statusInfo.badgeText, border: `1px solid ${statusInfo.barColor}` }}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--text-main)' }}>
                            🎯 Overall Monthly Budget
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingBudget(overallMonthlyBudget);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete Monthly Budget"
                            onClick={() => {
                              setBudgetToDelete(overallMonthlyBudget);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={15} color="var(--rose-danger)" />
                          </button>
                        </div>
                      </div>

                      <div className="budget-card-stats" style={{ alignItems: 'flex-end', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spent This Month</div>
                          <div className="budget-spent-val" style={{ color: statusInfo.barColor, fontSize: 'clamp(1.3rem, 3.5vw, 1.6rem)' }}>
                            {formatCurrency(overallMonthlyBudget.spent_amount)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: isOver ? 'var(--rose-danger)' : 'var(--text-muted)', fontWeight: isOver ? 700 : 500 }}>
                            {isOver ? 'Extra Spent 🚨' : 'Remaining Budget'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 800, color: isOver ? 'var(--rose-danger)' : 'var(--emerald-green)' }}>
                            {isOver ? `+${formatCurrency(overallMonthlyBudget.spent_amount - overallMonthlyBudget.amount_limit)}` : formatCurrency(overallMonthlyBudget.amount_limit - overallMonthlyBudget.spent_amount)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Limit: {formatCurrency(overallMonthlyBudget.amount_limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="progress-track" style={{ height: 10 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(overallMonthlyBudget.percentage_spent || 0, 100)}%`,
                              backgroundColor: statusInfo.barColor,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                          <span>{overallMonthlyBudget.percentage_spent?.toFixed(1)}% consumed</span>
                          <span>Target: {formatCurrency(overallMonthlyBudget.amount_limit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div 
                className="card" 
                style={{ 
                  border: '1px dashed #D1D5DB', 
                  background: '#FAFAFA',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '1.5rem',
                  gap: '0.75rem'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={22} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', margin: 0 }}>No Monthly Budget Goal</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>
                    Set a full-month spending cap to ensure long-term savings goals are met.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingBudget(null);
                    setModalInitialPeriod('monthly');
                    setIsModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Set Monthly Budget
                </button>
              </div>
            )}
          </div>

          {/* Category-Specific Budgets Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
                🏷️ Category Spending Limits ({categoryBudgets.length})
              </h2>
            </div>

            {categoryBudgets.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                <Layers size={28} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>No category-specific budget limits set yet.</p>
              </div>
            ) : (
              <div className="budgets-grid">
                {categoryBudgets.map((b) => {
                  const statusInfo = getBudgetStatusInfo(b.status, b.percentage_spent);
                  const isOver = (b.percentage_spent || 0) > 100;
                  return (
                    <div key={b.id} className="card budget-card zoom-card-interactive">
                      <div>
                        <div className="budget-card-header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h3 className="budget-card-title" style={{ margin: 0 }}>{b.category_name || 'Category'}</h3>
                              <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: b.period === 'daily' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: b.period === 'daily' ? '#D97706' : '#3B82F6', fontWeight: 600 }}>
                                {b.period === 'daily' ? '⚡ Daily' : 'Monthly'}
                              </span>
                            </div>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: statusInfo.badgeBg,
                                color: statusInfo.badgeText,
                                border: `1px solid ${statusInfo.barColor}`,
                                marginTop: '0.35rem',
                              }}
                            >
                              {statusInfo.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit Limit"
                              onClick={() => {
                                setEditingBudget(b);
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit3 size={15} color="var(--text-muted)" />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Delete Budget"
                              onClick={() => {
                                setBudgetToDelete(b);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={15} color="var(--rose-danger)" />
                            </button>
                          </div>
                        </div>

                        <div className="budget-card-stats">
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {b.period === 'daily' ? 'Spent Today' : 'Spent'}
                            </div>
                            <div className="budget-spent-val" style={{ color: statusInfo.barColor, fontSize: '1.25rem' }}>
                              {formatCurrency(b.spent_amount)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: isOver ? 'var(--rose-danger)' : 'var(--text-dim)', fontWeight: isOver ? 700 : 500 }}>
                              {isOver ? 'Extra Spent 🚨' : (b.period === 'daily' ? 'Remaining Today' : 'Remaining Budget')}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isOver ? 'var(--rose-danger)' : 'var(--emerald-green)' }}>
                              {isOver ? `+${formatCurrency(b.spent_amount - b.amount_limit)}` : formatCurrency(b.amount_limit - b.spent_amount)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Limit: {formatCurrency(b.amount_limit)}{b.period === 'daily' ? '/day' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(b.percentage_spent || 0, 100)}%`,
                              backgroundColor: statusInfo.barColor,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                          <span>{b.percentage_spent?.toFixed(1)}% spent</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        categories={categories}
        budget={editingBudget}
        initialPeriod={modalInitialPeriod}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBudgetToDelete(null);
        }}
        onConfirm={handleDeleteBudget}
        title={`Delete ${budgetToDelete?.period === 'daily' ? 'Daily Limit' : 'Budget Goal'}`}
        message={
          budgetToDelete
            ? `Are you sure you want to remove this ${
                budgetToDelete.period === 'daily' ? 'daily spending limit' : 'monthly budget'
              }? Your logged expenses will remain intact.`
            : ''
        }
        isDeleting={isDeleting}
      />
    </div>
  );
};

