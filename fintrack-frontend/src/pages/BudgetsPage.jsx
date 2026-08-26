import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  Layers
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
        success('Budget updated successfully!');
      } else {
        await api.budgets.create(payload);
        success('Budget created successfully!');
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
      success('Budget removed successfully!');
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

  const overallBudget = budgets.find((b) => b.category_id === null || b.category_id === undefined);
  const categoryBudgets = budgets.filter((b) => b.category_id !== null && b.category_id !== undefined);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Budget Goals & Spending Limits</h1>
          <p className="page-subtitle">Track your monthly spending limits and prevent overspending with live progress alerts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Set Budget Goal</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading budget goals...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon-circle">
            <Target size={32} />
          </div>
          <h3 className="empty-title">No budget goals set</h3>
          <p className="empty-desc">
            Set an overall monthly spending limit or category-specific goals to keep your finances on track.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Set First Budget</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Overall Monthly Budget Spotlight */}
          {overallBudget && (
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', color: 'var(--text-main)' }}>
                🎯 Overall Monthly Budget
              </h2>
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(17, 24, 39, 0.8) 100%)' }}>
                {(() => {
                  const statusInfo = getBudgetStatusInfo(overallBudget.status, overallBudget.percentage_spent);
                  const isOver = (overallBudget.percentage_spent || 0) > 100;
                  return (
                    <div>
                      <div className="budget-card-header">
                        <div>
                          <span className="badge" style={{ backgroundColor: statusInfo.badgeBg, color: statusInfo.badgeText, border: `1px solid ${statusInfo.barColor}` }}>
                            {statusInfo.label}
                          </span>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>
                            Entire Month Spending Limit
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingBudget(overallBudget);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit3 size={14} /> Edit Limit
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete Budget"
                            onClick={() => {
                              setBudgetToDelete(overallBudget);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={15} color="var(--rose-danger)" />
                          </button>
                        </div>
                      </div>

                      <div className="budget-card-stats" style={{ alignItems: 'flex-end', marginTop: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Spent so far</div>
                          <div className="budget-spent-val" style={{ color: statusInfo.barColor, fontSize: '1.75rem' }}>
                            {formatCurrency(overallBudget.spent_amount)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {isOver ? 'Over budget by' : 'Remaining budget'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, color: isOver ? 'var(--rose-danger)' : 'var(--emerald-green)' }}>
                            {formatCurrency(Math.abs(overallBudget.remaining_amount))}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Limit: {formatCurrency(overallBudget.amount_limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginTop: '0.85rem' }}>
                        <div className="progress-track" style={{ height: 12 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(overallBudget.percentage_spent || 0, 100)}%`,
                              backgroundColor: statusInfo.barColor,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                          <span>0%</span>
                          <span>{overallBudget.percentage_spent?.toFixed(1)}% consumed</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

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
                    <div key={b.id} className="card budget-card">
                      <div>
                        <div className="budget-card-header">
                          <div>
                            <h3 className="budget-card-title">{b.category_name || 'Category'}</h3>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Spent</div>
                            <div className="budget-spent-val" style={{ color: statusInfo.barColor, fontSize: '1.25rem' }}>
                              {formatCurrency(b.spent_amount)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {isOver ? 'Over by' : 'Left'}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isOver ? 'var(--rose-danger)' : 'var(--emerald-green)' }}>
                              {formatCurrency(Math.abs(b.remaining_amount))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Limit: {formatCurrency(b.amount_limit)}
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
        title="Delete Budget Goal"
        message={
          budgetToDelete
            ? `Are you sure you want to remove the ${
                budgetToDelete.category_name ? `"${budgetToDelete.category_name}"` : 'overall'
              } budget limit? Your logged expenses will remain intact.`
            : ''
        }
        isDeleting={isDeleting}
      />
    </div>
  );
};
