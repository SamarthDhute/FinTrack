import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Loader2, 
  ArrowRight, 
  Wallet,
  AlertCircle 
} from 'lucide-react';
import { getTodayDateString, formatCurrency } from '../utils/formatters';

export const WalletTransferModal = ({
  isOpen,
  onClose,
  onTransfer,
  wallets = [],
  isTransferring = false,
  initialFromWalletId = null,
}) => {
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && wallets.length >= 2) {
      const defaultFrom = initialFromWalletId 
        ? String(initialFromWalletId) 
        : String(wallets[0]?.id || '');
      setFromWalletId(defaultFrom);

      const defaultTo = wallets.find((w) => String(w.id) !== defaultFrom);
      setToWalletId(defaultTo ? String(defaultTo.id) : '');
      setAmount('');
      setDate(getTodayDateString());
      setNotes('');
      setErrors({});
    }
  }, [isOpen, wallets, initialFromWalletId]);

  if (!isOpen) return null;

  const selectedFrom = wallets.find((w) => String(w.id) === String(fromWalletId));
  const selectedTo = wallets.find((w) => String(w.id) === String(toWalletId));

  const parsedAmount = parseFloat(amount) || 0;
  const fromBalanceAfter = selectedFrom ? (parseFloat(selectedFrom.balance) - parsedAmount) : 0;
  const toBalanceAfter = selectedTo ? (parseFloat(selectedTo.balance) + parsedAmount) : 0;

  const validate = () => {
    const errs = {};
    if (!fromWalletId) errs.fromWalletId = 'Please select source account';
    if (!toWalletId) errs.toWalletId = 'Please select destination account';
    if (fromWalletId === toWalletId) errs.toWalletId = 'Source and destination cannot be the same';

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Please enter an amount greater than 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      from_wallet_id: parseInt(fromWalletId, 10),
      to_wallet_id: parseInt(toWalletId, 10),
      amount: parseFloat(amount),
      transfer_date: date,
      notes: notes.trim() || null,
    };

    onTransfer(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92%', borderRadius: '20px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'rgba(99, 102, 241, 0.12)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6366F1'
              }}
            >
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Transfer Money
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
                Move funds between your bank accounts & wallets
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

        {wallets.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <AlertCircle size={36} color="#F59E0B" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Need at least 2 accounts</h4>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
              You need at least two accounts to transfer money between them.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* From & To Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem' }}>
              {/* From Account */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  From Account *
                </label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
                {errors.fromWalletId && <span style={{ color: '#EF4444', fontSize: '0.72rem' }}>{errors.fromWalletId}</span>}
              </div>

              {/* Arrow Indicator */}
              <div style={{ marginTop: '1.25rem', color: '#6366F1' }}>
                <ArrowRight size={20} />
              </div>

              {/* To Account */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  To Account *
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
                {errors.toWalletId && <span style={{ color: '#EF4444', fontSize: '0.72rem' }}>{errors.toWalletId}</span>}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Transfer Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderColor: errors.amount ? '#EF4444' : undefined,
                }}
              />
              {errors.amount && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.amount}</span>}
            </div>

            {/* Live Balance Preview Card */}
            {parsedAmount > 0 && selectedFrom && selectedTo && (
              <div 
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>{selectedFrom.name}</span>
                  <span style={{ fontWeight: 700, color: fromBalanceAfter < 0 ? '#EF4444' : '#111827' }}>
                    {formatCurrency(fromBalanceAfter)}
                  </span>
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>➔</div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>{selectedTo.name}</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>
                    {formatCurrency(toBalanceAfter)}
                  </span>
                </div>
              </div>
            )}

            {/* Date and Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Transfer Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Notes / Remark
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATM withdrawal"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isTransferring}
                style={{ borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isTransferring}
                style={{
                  borderRadius: '10px',
                  background: '#6366F1',
                  borderColor: '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isTransferring && <Loader2 size={16} className="spinner" />}
                <span>Execute Transfer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WalletTransferModal;
