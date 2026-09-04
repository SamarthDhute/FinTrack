import React, { useState, useEffect } from 'react';
import { X, HandCoins, ArrowUpRight, ArrowDownLeft, Loader2, Calendar } from 'lucide-react';
import { getTodayDateString } from '../utils/formatters';

export const DebtModal = ({
  isOpen,
  onClose,
  onSave,
  debt = null,
  isSaving = false,
}) => {
  const [personName, setPersonName] = useState('');
  const [debtType, setDebtType] = useState('LENT'); // 'LENT' or 'BORROWED'
  const [initialAmount, setInitialAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (debt) {
      setPersonName(debt.person_name || '');
      setDebtType(debt.debt_type || 'LENT');
      setInitialAmount(String(debt.initial_amount || ''));
      setDueDate(debt.due_date ? debt.due_date.split('T')[0] : '');
      setNotes(debt.notes || '');
    } else {
      setPersonName('');
      setDebtType('LENT');
      setInitialAmount('');
      setDueDate('');
      setNotes('');
    }
    setErrors({});
  }, [debt, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!personName.trim()) {
      newErrors.personName = 'Person name is required';
    } else if (personName.trim().length > 100) {
      newErrors.personName = 'Name must be 100 characters or less';
    }

    const numAmount = parseFloat(initialAmount);
    if (!initialAmount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.initialAmount = 'Amount must be greater than 0';
    } else if (numAmount > 99999999.99) {
      newErrors.initialAmount = 'Amount exceeds maximum allowed limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      person_name: personName.trim(),
      debt_type: debtType,
      initial_amount: parseFloat(initialAmount),
      due_date: dueDate || null,
      notes: notes.trim() || null,
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HandCoins size={20} style={{ color: debtType === 'LENT' ? '#16A34A' : '#3B82F6' }} />
            <h3>{debt ? 'Edit Debt Record' : 'Add Udhaar / Loan Entry'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type Toggle: Lent (Maine Diye) vs Borrowed (Maine Liye) */}
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDebtType('LENT')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: debtType === 'LENT' ? '2px solid #16A34A' : '1px solid #E5E7EB',
                    background: debtType === 'LENT' ? 'rgba(22, 163, 74, 0.08)' : '#F9FAFB',
                    color: debtType === 'LENT' ? '#16A34A' : '#6B7280',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>Maine Diye (Lent)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDebtType('BORROWED')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: debtType === 'BORROWED' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    background: debtType === 'BORROWED' ? 'rgba(59, 130, 246, 0.08)' : '#F9FAFB',
                    color: debtType === 'BORROWED' ? '#3B82F6' : '#6B7280',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <span>Maine Liye (Borrowed)</span>
                </button>
              </div>
            </div>

            {/* Person Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="debt-person-name">
                Person / Contact Name *
              </label>
              <input
                id="debt-person-name"
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma, Amit, Priya"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
              {errors.personName && <p className="input-error-msg">{errors.personName}</p>}
            </div>

            {/* Amount & Due Date in 2-column row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="debt-amount">
                  Total Amount (₹) *
                </label>
                <input
                  id="debt-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="99999999.99"
                  className="form-input"
                  placeholder="0.00"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  required
                />
                {errors.initialAmount && <p className="input-error-msg">{errors.initialAmount}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="debt-due-date">
                  Expected Due Date
                </label>
                <input
                  id="debt-due-date"
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes / Context */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="debt-notes">
                Notes / Reason (Optional)
              </label>
              <textarea
                id="debt-notes"
                className="form-textarea"
                placeholder="e.g. Goa trip flight booking, lunch split, emergency help..."
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{debt ? 'Save Changes' : 'Record Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
