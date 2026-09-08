import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  Wallet, 
  Plus, 
  Calendar, 
  FileText, 
  Loader2, 
  Sparkles, 
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

const QUICK_REASONS = [
  'Monthly Salary',
  'Bonus / Incentive',
  'Cash Deposit',
  'Cashback / Refund',
  'Freelance / Side Gig',
  'Pocket Money / Gift'
];

export const WalletDepositModal = ({
  isOpen,
  onClose,
  onDeposit,
  wallets = [],
  initialWalletId = null,
  isDepositing = false,
}) => {
  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialWalletId) {
        setWalletId(String(initialWalletId));
      } else if (wallets.length > 0) {
        const defaultWallet = wallets.find((w) => w.is_default) || wallets[0];
        setWalletId(String(defaultWallet.id));
      } else {
        setWalletId('');
      }
      setAmount('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrors({});
    }
  }, [isOpen, initialWalletId, wallets]);

  if (!isOpen) return null;

  const selectedWallet = wallets.find((w) => String(w.id) === String(walletId));
  const currentBalance = parseFloat(selectedWallet?.balance ?? 0);
  const depositAmountNum = parseFloat(amount || 0);
  const projectedBalance = !isNaN(depositAmountNum) && depositAmountNum > 0
    ? currentBalance + depositAmountNum
    : currentBalance;

  const handleAddQuickAmount = (val) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSetQuickAmount = (val) => {
    setAmount(String(val));
  };

  const validate = () => {
    const errs = {};
    if (!walletId) errs.walletId = 'Please select an account';
    
    const parsedAmt = parseFloat(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      errs.amount = 'Please enter a valid deposit amount (> 0)';
    }

    if (!depositDate) {
      errs.depositDate = 'Deposit date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onDeposit(parseInt(walletId, 10), {
      amount: parseFloat(amount),
      deposit_date: depositDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92%', borderRadius: '24px', padding: '1.75rem', position: 'relative' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '14px', 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#10B981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
              }}
            >
              <ArrowDownLeft size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Add Money / Top Up
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Deposit funds & increase account balance
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Target Account Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
              Select Account to Deposit Into *
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                borderColor: errors.walletId ? '#EF4444' : undefined,
                fontWeight: 600,
              }}
            >
              <option value="" disabled>-- Select an account --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance)}) {w.is_default ? '★ Primary' : ''}
                </option>
              ))}
            </select>
            {errors.walletId && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.walletId}</span>}
          </div>

          {/* Amount Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                Amount to Add (₹) *
              </label>
              {selectedWallet && (
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Current: <strong style={{ color: '#111827' }}>{formatCurrency(currentBalance)}</strong>
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <span 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: '#10B981' 
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  paddingLeft: '2.5rem',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  borderColor: errors.amount ? '#EF4444' : undefined,
                  color: '#111827',
                }}
                autoFocus
              />
            </div>
            {errors.amount && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.amount}</span>}

            {/* Quick Amount Suggestion Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetQuickAmount(amt)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    background: amount === String(amt) ? 'rgba(16, 185, 129, 0.12)' : '#F9FAFB',
                    borderColor: amount === String(amt) ? '#10B981' : '#E5E7EB',
                    color: amount === String(amt) ? '#059669' : '#4B5563',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  +{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Balance Preview Box */}
          {selectedWallet && depositAmountNum > 0 && (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TrendingUp size={20} color="#10B981" />
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>
                    New Balance Preview
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    {formatCurrency(currentBalance)} + {formatCurrency(depositAmountNum)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                {formatCurrency(projectedBalance)}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Deposit Date
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={depositDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDepositDate(e.target.value)}
                className="input-field"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  borderColor: errors.depositDate ? '#EF4444' : undefined,
                }}
              />
            </div>
            {errors.depositDate && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.depositDate}</span>}
          </div>

          {/* Reason / Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Reason / Source (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Salary, Cashback, Freelance payout"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                borderRadius: '12px',
              }}
            />

            {/* Quick Reason Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {QUICK_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setNotes(reason)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                    background: notes === reason ? '#EEF2FF' : '#F9FAFB',
                    borderColor: notes === reason ? '#6366F1' : '#E5E7EB',
                    color: notes === reason ? '#4F46E5' : '#6B7280',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isDepositing}
              style={{ borderRadius: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isDepositing || !selectedWallet}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                borderColor: '#10B981',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
              }}
            >
              {isDepositing ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Adding Funds...</span>
                </>
              ) : (
                <>
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Deposit Funds</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletDepositModal;
