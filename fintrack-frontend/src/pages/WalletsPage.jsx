import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  Building2, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  PiggyBank, 
  Layers, 
  Plus, 
  ArrowRightLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { WalletModal } from '../components/WalletModal';
import { WalletTransferModal } from '../components/WalletTransferModal';
import { WalletDepositModal } from '../components/WalletDepositModal';

const TYPE_CONFIG = {
  BANK: { label: 'Bank Account', icon: Building2, defaultBg: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' },
  CASH: { label: 'Cash in Hand', icon: Banknote, defaultBg: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)' },
  WALLET: { label: 'UPI / Wallet', icon: Smartphone, defaultBg: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)' },
  CREDIT_CARD: { label: 'Credit Card', icon: CreditCard, defaultBg: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)' },
  SAVINGS: { label: 'Savings & Deposit', icon: PiggyBank, defaultBg: 'linear-gradient(135deg, #92400E 0%, #F59E0B 100%)' },
  OTHER: { label: 'Account', icon: Layers, defaultBg: 'linear-gradient(135deg, #374151 0%, #6B7280 100%)' },
};

export const WalletsPage = ({ onRefreshGlobalData }) => {
  const { success, error } = useToast();
  const [summary, setSummary] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromWalletId, setTransferFromWalletId] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositWalletId, setDepositWalletId] = useState(null);
  const [isDepositing, setIsDepositing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumData, txData] = await Promise.all([
        api.wallets.summary().catch(() => null),
        api.wallets.getAllTransactions({ limit: 20 }).catch(() => ({ items: [] })),
      ]);

      if (sumData) {
        setSummary(sumData);
        setWallets(sumData.wallets || []);
      }
      setTransactions(txData?.items || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      error('Failed to load accounts and balances');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveWallet = async (payload) => {
    try {
      setIsSavingWallet(true);
      if (editingWallet) {
        await api.wallets.update(editingWallet.id, payload);
        success('Account updated successfully');
      } else {
        await api.wallets.create(payload);
        success('New account added');
      }
      setIsWalletModalOpen(false);
      setEditingWallet(null);
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Save wallet error:', err);
      error(err.message || 'Failed to save account');
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleDeleteWallet = async (wallet) => {
    if (!window.confirm(`Are you sure you want to delete "${wallet.name}"? All associated transaction history for this account will be removed.`)) {
      return;
    }

    try {
      await api.wallets.delete(wallet.id);
      success('Account deleted');
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Delete wallet error:', err);
      error(err.message || 'Failed to delete account');
    }
  };

  const handleExecuteTransfer = async (payload) => {
    try {
      setIsTransferring(true);
      await api.wallets.transfer(payload);
      success('Funds transferred successfully ⚡');
      setIsTransferModalOpen(false);
      setTransferFromWalletId(null);
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Transfer error:', err);
      error(err.message || 'Failed to execute transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const openTransferFrom = (walletId) => {
    setTransferFromWalletId(walletId);
    setIsTransferModalOpen(true);
  };

  const handleExecuteDeposit = async (walletId, payload) => {
    try {
      setIsDepositing(true);
      await api.wallets.deposit(walletId, payload);
      const targetWallet = wallets.find((w) => w.id === walletId);
      success(`₹${payload.amount.toLocaleString('en-IN')} added to ${targetWallet?.name || 'account'} successfully! 💰`);
      setIsDepositModalOpen(false);
      setDepositWalletId(null);
      fetchData();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Deposit error:', err);
      error(err.message || 'Failed to add money');
    } finally {
      setIsDepositing(false);
    }
  };

  const openDepositModal = (walletId = null) => {
    setDepositWalletId(walletId);
    setIsDepositModalOpen(true);
  };

  const netWorth = parseFloat(summary?.net_worth ?? 0);
  const totalLiquid = parseFloat(summary?.total_liquid_balance ?? 0);
  const totalCredit = parseFloat(summary?.total_credit_debt ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Top Header & Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Wallets & Accounts 💳
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track multiple bank accounts, cash, UPI wallets & inter-account transfers
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            disabled={isLoading}
            style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openDepositModal(null)}
            disabled={wallets.length === 0}
            style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', borderColor: '#10B98133', background: '#10B98110' }}
          >
            <ArrowDownLeft size={16} color="#10B981" />
            <span style={{ fontWeight: 600 }}>Add Money</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setTransferFromWalletId(null);
              setIsTransferModalOpen(true);
            }}
            disabled={wallets.length < 2}
            style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowRightLeft size={16} color="#6366F1" />
            <span>Transfer Money</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingWallet(null);
              setIsWalletModalOpen(true);
            }}
            style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Net Worth & Liquid Breakdown Hero Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Total Net Worth Card */}
        <div 
          className="dashboard-card"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, pointerEvents: 'none' }}>
            <Wallet size={140} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Net Balance
            </span>
            <ShieldCheck size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            {formatCurrency(netWorth)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Across {wallets.length} active account{wallets.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Liquid Cash & Bank Balance */}
        <div 
          className="dashboard-card"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: '20px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Liquid Funds (Cash + Bank)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {formatCurrency(totalLiquid)}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
            Ready-to-use funds in your accounts
          </p>
        </div>

        {/* Credit Card / Debt Liabilities */}
        <div 
          className="dashboard-card"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: '20px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
              Credit Liabilities
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalCredit > 0 ? '#EF4444' : '#6B7280', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {formatCurrency(totalCredit)}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
            {totalCredit > 0 ? 'Outstanding credit dues' : 'No active credit liabilities'}
          </p>
        </div>
      </div>

      {/* Account Cards Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Your Accounts ({wallets.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Click an account to transfer or edit
          </span>
        </div>

        {wallets.length === 0 ? (
          <div 
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'var(--card-bg, #FFFFFF)',
              borderRadius: '20px',
              border: '1px dashed #D1D5DB',
            }}
          >
            <Wallet size={48} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No accounts found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Add your primary bank account or cash wallet to start tracking.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingWallet(null);
                setIsWalletModalOpen(true);
              }}
              style={{ borderRadius: '12px' }}
            >
              Add First Account
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {wallets.map((w) => {
              const typeCfg = TYPE_CONFIG[w.wallet_type] || TYPE_CONFIG.OTHER;
              const IconComp = typeCfg.icon;
              const cardBg = w.color || typeCfg.defaultBg;

              return (
                <div
                  key={w.id}
                  style={{
                    background: cardBg,
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '170px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 14px 28px -5px rgba(0, 0, 0, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.15)';
                  }}
                >
                  {/* Decorative background watermark */}
                  <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.12, pointerEvents: 'none' }}>
                    <IconComp size={110} color="#FFFFFF" />
                  </div>

                  {/* Card Top Row */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            backdropFilter: 'blur(8px)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                        >
                          <IconComp size={20} color="#FFFFFF" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: '1.2' }}>
                            {w.name}
                          </div>
                          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                            {typeCfg.label}
                          </span>
                        </div>
                      </div>

                      {w.is_default && (
                        <span 
                          style={{
                            background: 'rgba(255, 255, 255, 0.25)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Balance */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', opacity: 0.75, display: 'block' }}>Current Balance</span>
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {formatCurrency(w.balance)}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                      marginTop: '1rem',
                      zIndex: 1,
                      gap: '0.4rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => openDepositModal(w.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.28)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.65rem',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backdropFilter: 'blur(8px)',
                        }}
                        title="Add money to this account"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Add Money</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openTransferFrom(w.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.18)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.65rem',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <ArrowRightLeft size={13} />
                        <span>Transfer</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWallet(w);
                          setIsWalletModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          borderRadius: '8px',
                          width: '28px',
                          height: '28px',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Edit Account"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWallet(w)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          borderRadius: '8px',
                          width: '28px',
                          height: '28px',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Delete Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Activity / Transfer Ledger */}
      <div 
        className="dashboard-card"
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: '20px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Recent Account Activity & Ledger
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Transfers, deposits, withdrawals, and expense deductions
            </p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9CA3AF' }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>No recent account activity recorded.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transactions.map((tx) => {
              const isPositive = tx.transaction_type === 'DEPOSIT' || tx.transaction_type === 'TRANSFER_IN';
              const isTransfer = tx.transaction_type === 'TRANSFER_IN' || tx.transaction_type === 'TRANSFER_OUT';
              const walletObj = wallets.find((w) => w.id === tx.wallet_id);

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: '#F9FAFB',
                    borderRadius: '12px',
                    border: '1px solid #F3F4F6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isTransfer 
                          ? 'rgba(99, 102, 241, 0.1)' 
                          : isPositive 
                          ? 'rgba(22, 163, 74, 0.1)' 
                          : 'rgba(220, 38, 38, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isTransfer ? '#6366F1' : isPositive ? '#16A34A' : '#DC2626',
                      }}
                    >
                      {isTransfer ? (
                        <ArrowRightLeft size={18} />
                      ) : isPositive ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                        {tx.description || (isTransfer ? 'Account Transfer' : tx.transaction_type)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{walletObj?.name || `Account #${tx.wallet_id}`}</span>
                        <span>•</span>
                        <span>{formatDate(tx.transaction_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '0.95rem', 
                        color: isPositive ? '#16A34A' : '#DC2626' 
                      }}
                    >
                      {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>
                      {tx.transaction_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wallet Modal (Add / Edit) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setEditingWallet(null);
        }}
        onSave={handleSaveWallet}
        wallet={editingWallet}
        isSaving={isSavingWallet}
      />

      {/* Transfer Funds Modal */}
      <WalletTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferFromWalletId(null);
        }}
        onTransfer={handleExecuteTransfer}
        wallets={wallets}
        initialFromWalletId={transferFromWalletId}
        isTransferring={isTransferring}
      />

      {/* Add Money / Deposit Modal */}
      <WalletDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setDepositWalletId(null);
        }}
        onDeposit={handleExecuteDeposit}
        wallets={wallets}
        initialWalletId={depositWalletId}
        isDepositing={isDepositing}
      />
    </div>
  );
};

export default WalletsPage;
