import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';

export const BudgetModal = ({
  isOpen,
  onClose,
  onSave,
  categories = [],
  budget = null,
  isSaving,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [amountLimit, setAmountLimit] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState('');

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.category_id !== null && budget.category_id !== undefined ? String(budget.category_id) : '');
      setAmountLimit(String(budget.amount_limit || ''));
      setPeriod(budget.period || 'monthly');
    } else {
      setCategoryId('');
      setAmountLimit('');
      setPeriod('monthly');
    }
    setError('');
  }, [budget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const limitNum = parseFloat(amountLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Please enter a valid positive budget limit (greater than 0).');
      return;
    }

    const payload = {
      amount_limit: limitNum,
      period: period || 'monthly',
      category_id: categoryId ? parseInt(categoryId, 10) : null,
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={18} color="var(--primary)" />
            <h3>{budget ? 'Update Budget Goal' : 'Set New Budget Goal'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Scope / Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="budget-scope">
                Budget Scope
              </label>
              <select
                id="budget-scope"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={Boolean(budget)} // Cannot change category of existing budget
              >
                <option value="">🎯 Overall Monthly Budget (All Categories)</option>
                <optgroup label="Category-Specific Budgets">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏷️ {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                Select "Overall" for entire monthly spending or pick a specific category.
              </span>
            </div>

            {/* Amount Limit */}
            <div className="form-group">
              <label className="form-label" htmlFor="budget-limit">
                Monthly Spending Limit (₹) *
              </label>
              <input
                id="budget-limit"
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 25000"
                className="form-input"
                value={amountLimit}
                onChange={(e) => {
                  setAmountLimit(e.target.value);
                  if (error) setError('');
                }}
                required
              />
              {error && <p className="input-error-msg">{error}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : budget ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
