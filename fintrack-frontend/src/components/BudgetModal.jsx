import React, { useState, useEffect } from 'react';
import { X, Target, Zap, Calendar } from 'lucide-react';

export const BudgetModal = ({
  isOpen,
  onClose,
  onSave,
  categories = [],
  budget = null,
  initialPeriod = 'monthly',
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
      setPeriod(initialPeriod || 'monthly');
    }
    setError('');
  }, [budget, isOpen, initialPeriod]);

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

  const isDaily = period === 'daily';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isDaily ? <Zap size={18} color="#D97706" /> : <Target size={18} color="var(--primary)" />}
            <h3>{budget ? (isDaily ? 'Update Daily Limit' : 'Update Budget Goal') : (isDaily ? 'Set Daily Spending Limit' : 'Set New Budget Goal')}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Period Selector Tabs */}
            {!budget && (
              <div className="form-group">
                <label className="form-label">Limit Cycle / Period *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPeriod('daily')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: period === 'daily' ? '2px solid #D97706' : '1px solid #E5E7EB',
                      background: period === 'daily' ? 'rgba(217, 119, 6, 0.08)' : '#FFFFFF',
                      color: period === 'daily' ? '#D97706' : '#4B5563',
                      fontWeight: period === 'daily' ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Zap size={15} />
                    <span>⚡ Daily Limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriod('monthly')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: period === 'monthly' ? '2px solid var(--primary)' : '1px solid #E5E7EB',
                      background: period === 'monthly' ? 'rgba(59, 130, 246, 0.08)' : '#FFFFFF',
                      color: period === 'monthly' ? 'var(--primary)' : '#4B5563',
                      fontWeight: period === 'monthly' ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Calendar size={15} />
                    <span>🎯 Monthly Budget</span>
                  </button>
                </div>
              </div>
            )}

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
                <option value="">
                  {isDaily ? '⚡ Overall Daily Spending Limit (All Expenses)' : '🎯 Overall Monthly Budget (All Categories)'}
                </option>
                <optgroup label="Category-Specific Limits">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏷️ {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                {isDaily 
                  ? 'Set an overall daily spending cap to stay on track day-by-day.' 
                  : 'Select "Overall" for entire month spending or pick a specific category.'}
              </span>
            </div>

            {/* Amount Limit */}
            <div className="form-group">
              <label className="form-label" htmlFor="budget-limit">
                {isDaily ? 'Daily Spending Limit (₹) *' : 'Monthly Spending Limit (₹) *'}
              </label>
              <input
                id="budget-limit"
                type="number"
                step="0.01"
                min="1"
                placeholder={isDaily ? "e.g. 1000" : "e.g. 25000"}
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
              {isSaving ? 'Saving...' : budget ? 'Update Limit' : isDaily ? 'Set Daily Limit' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

