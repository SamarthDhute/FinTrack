import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  Building2, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  PiggyBank, 
  Layers, 
  Check, 
  Loader2 
} from 'lucide-react';

const WALLET_TYPES = [
  { id: 'BANK', label: 'Bank Account', icon: Building2, defaultColor: '#3B82F6' },
  { id: 'CASH', label: 'Cash in Hand', icon: Banknote, defaultColor: '#10B981' },
  { id: 'WALLET', label: 'UPI / E-Wallet', icon: Smartphone, defaultColor: '#8B5CF6' },
  { id: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard, defaultColor: '#EF4444' },
  { id: 'SAVINGS', label: 'Savings / Deposit', icon: PiggyBank, defaultColor: '#F59E0B' },
  { id: 'OTHER', label: 'Other Account', icon: Layers, defaultColor: '#6B7280' },
];

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', 
  '#F59E0B', '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#64748B'
];

export const WalletModal = ({
  isOpen,
  onClose,
  onSave,
  wallet = null,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (wallet) {
      setName(wallet.name || '');
      setWalletType(wallet.wallet_type || 'BANK');
      setBalance(String(wallet.balance ?? ''));
      setColor(wallet.color || '#3B82F6');
      setIsDefault(Boolean(wallet.is_default));
    } else {
      setName('');
      setWalletType('BANK');
      setBalance('');
      setColor('#3B82F6');
      setIsDefault(false);
    }
    setErrors({});
  }, [wallet, isOpen]);

  if (!isOpen) return null;

  const handleSelectType = (typeId) => {
    setWalletType(typeId);
    if (!wallet) {
      const found = WALLET_TYPES.find((t) => t.id === typeId);
      if (found) setColor(found.defaultColor);
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Account name is required';
    else if (name.trim().length > 50) errs.name = 'Name must be 50 characters or less';

    if (balance !== '' && isNaN(parseFloat(balance))) {
      errs.balance = 'Please enter a valid amount';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      wallet_type: walletType,
      balance: balance === '' ? 0.0 : parseFloat(balance),
      currency: 'INR',
      color: color,
      icon: walletType === 'BANK' ? 'Building2' : walletType === 'CASH' ? 'Banknote' : walletType === 'CREDIT_CARD' ? 'CreditCard' : 'Wallet',
      is_default: isDefault,
    };

    onSave(payload);
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
                background: `${color}18`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: color
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {wallet ? 'Edit Account' : 'Add New Account / Wallet'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
                Track bank balances, cash, or credit accounts
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Account Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
              Account Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {WALLET_TYPES.map((type) => {
                const IconComp = type.icon;
                const isSelected = walletType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelectType(type.id)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${color}` : '1.5px solid #E5E7EB',
                      background: isSelected ? `${color}0F` : '#F9FAFB',
                      color: isSelected ? color : '#4B5563',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconComp size={20} />
                    <span style={{ fontSize: '0.74rem', fontWeight: isSelected ? 700 : 500 }}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              Account Name *
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC Salary Account, Pocket Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                borderRadius: '10px',
                borderColor: errors.name ? '#EF4444' : undefined,
              }}
            />
            {errors.name && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.name}</span>}
          </div>

          {/* Current / Initial Balance */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
              {wallet ? 'Current Balance (₹)' : 'Initial Balance (₹)'}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                borderRadius: '10px',
                borderColor: errors.balance ? '#EF4444' : undefined,
              }}
            />
            {errors.balance && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.balance}</span>}
          </div>

          {/* Color Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
              Theme Accent Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2.5px solid #111827' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {color === c && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Default Account Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#4B5563' }}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: color, cursor: 'pointer' }}
            />
            <span>Set as Primary / Default Account</span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
              style={{ borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                borderRadius: '10px',
                background: color,
                borderColor: color,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {isSaving && <Loader2 size={16} className="spinner" />}
              <span>{wallet ? 'Save Changes' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletModal;
