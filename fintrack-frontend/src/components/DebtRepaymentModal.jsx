import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowDownLeft, Loader2, IndianRupee } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../utils/formatters';

export const DebtRepaymentModal = ({
  isOpen,
  onClose,
  onSave,
  debt = null,
  isSaving = false,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentDate(getTodayDateString());
      setPaymentMethod('UPI');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !debt) return null;

  const remainingNum = parseFloat(debt.remaining_amount) || 0;
  const initialNum = parseFloat(debt.initial_amount) || 0;
  const totalRepaidNum = parseFloat(debt.total_repaid) || 0;

  const currentEnteredAmount = parseFloat(amount) || 0;
  const projectedRemaining = Math.max(0, remainingNum - currentEnteredAmount);
  const isFullSettlement = currentEnteredAmount >= remainingNum && remainingNum > 0;

  const handleQuickPercent = (factor) => {
    const val = Math.min(remainingNum, Math.round(remainingNum * factor * 100) / 100);
    setAmount(String(val));
    setError('');
  };

  const validate = () => {
    if (!amount || isNaN(currentEnteredAmount) || currentEnteredAmount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (currentEnteredAmount > remainingNum) {
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(remainingNum)}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      amount: currentEnteredAmount,
      payment_date: paymentDate,
      payment_method: paymentMethod || null,
      notes: notes.trim() || null,
    };

    onSave(debt.id, payload);
  };

  const isLent = debt.debt_type === 'LENT';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {isLent ? 'Record Payment Received' : 'Record Payment Made'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280' }}>
                Contact: <strong style={{ color: '#111827' }}>{debt.person_name}</strong>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Balance Overview Card */}
            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total Initial Amount:</span>
                <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{formatCurrency(initialNum)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Already Repaid:</span>
                <strong style={{ fontSize: '0.85rem', color: '#16A34A' }}>{formatCurrency(totalRepaidNum)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: '1px dashed #D1D5DB',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  Current Pending Balance:
                </span>
                <strong style={{ fontSize: '1rem', fontWeight: 800, color: isLent ? '#DC2626' : '#3B82F6' }}>
                  {formatCurrency(remainingNum)}
                </strong>
              </div>
            </div>

            {/* Repayment Amount */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" htmlFor="repayment-amount" style={{ margin: 0 }}>
                  Amount {isLent ? 'Received' : 'Paid'} (₹) *
                </label>
                {/* Quick Fill Pills */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(0.5)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFF',
                      cursor: 'pointer',
                      color: '#4B5563',
                      fontWeight: 600,
                    }}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(1.0)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #16A34A',
                      background: 'rgba(22, 163, 74, 0.08)',
                      cursor: 'pointer',
                      color: '#16A34A',
                      fontWeight: 700,
                    }}
                  >
                    100% Settle
                  </button>
                </div>
              </div>
              <input
                id="repayment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingNum}
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                required
                autoFocus
              />
              {error && <p className="input-error-msg">{error}</p>}
            </div>

            {/* Projected Remaining Balance Pill */}
            {currentEnteredAmount > 0 && currentEnteredAmount <= remainingNum && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isFullSettlement ? 'rgba(22, 163, 74, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                  border: isFullSettlement ? '1px solid #16A34A' : '1px solid #93C5FD',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  color: isFullSettlement ? '#15803D' : '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{isFullSettlement ? '🎉 This will fully settle this debt!' : 'Remaining balance after this:'}</span>
                <strong>{formatCurrency(projectedRemaining)}</strong>
              </div>
            )}

            {/* Date & Payment Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="repayment-date">
                  Payment Date *
                </label>
                <input
                  id="repayment-date"
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  max={getTodayDateString()}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="repayment-method">
                  Payment Mode
                </label>
                <select
                  id="repayment-method"
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Card">Card</option>
                  <option value="Wallet">Wallet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="repayment-notes">
                Notes (Optional)
              </label>
              <textarea
                id="repayment-notes"
                className="form-textarea"
                placeholder="e.g. Sent on UPI transaction #98432, hand cash returned..."
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
                  <span>Recording...</span>
                </>
              ) : (
                <span>Confirm Payment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtRepaymentModal;
