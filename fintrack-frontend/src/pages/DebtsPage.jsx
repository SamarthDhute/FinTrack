import React, { useState, useEffect, useCallback } from 'react';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
  History,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import DebtModal from '../components/DebtModal';
import DebtRepaymentModal from '../components/DebtRepaymentModal';

export const DebtsPage = () => {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({
    total_lent_pending: 0,
    total_borrowed_pending: 0,
    total_lent_initial: 0,
    total_borrowed_initial: 0,
    active_count: 0,
    settled_count: 0,
    total_debts_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, LENT, BORROWED, ACTIVE, SETTLED

  // Modals state
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedDebtForEdit, setSelectedDebtForEdit] = useState(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedDebtForRepayment, setSelectedDebtForRepayment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Accordion for showing repayments history per debt card
  const [expandedDebts, setExpandedDebts] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [debtsRes, summaryRes] = await Promise.all([
        api.debts.list(),
        api.debts.summary(),
      ]);
      setDebts(debtsRes.items || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to fetch debt data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id) => {
    setExpandedDebts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle Add/Edit Debt Save
  const handleSaveDebt = async (payload) => {
    try {
      setIsSaving(true);
      if (selectedDebtForEdit) {
        await api.debts.update(selectedDebtForEdit.id, payload);
      } else {
        await api.debts.create(payload);
      }
      setIsDebtModalOpen(false);
      setSelectedDebtForEdit(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to save debt entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Debt
  const handleDeleteDebt = async (id, personName) => {
    if (!window.confirm(`Are you sure you want to delete the debt record for "${personName}"? All repayment history will also be removed.`)) {
      return;
    }
    try {
      await api.debts.delete(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete debt entry');
    }
  };

  // Handle Add Repayment Save
  const handleSaveRepayment = async (debtId, payload) => {
    try {
      setIsSaving(true);
      await api.debts.addRepayment(debtId, payload);
      setIsRepaymentModalOpen(false);
      setSelectedDebtForRepayment(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to record repayment');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Repayment
  const handleDeleteRepayment = async (debtId, repaymentId) => {
    if (!window.confirm('Are you sure you want to delete this repayment record? The remaining balance will be recalculated.')) {
      return;
    }
    try {
      await api.debts.deleteRepayment(debtId, repaymentId);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete repayment');
    }
  };

  // Filter Debts
  const filteredDebts = debts.filter((d) => {
    const matchesSearch =
      d.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'LENT') return d.debt_type === 'LENT';
    if (activeTab === 'BORROWED') return d.debt_type === 'BORROWED';
    if (activeTab === 'ACTIVE') return d.status !== 'SETTLED';
    if (activeTab === 'SETTLED') return d.status === 'SETTLED';
    return true;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <HandCoins size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Udhaar & Debt Tracker
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#6B7280' }}>
            Track money you lent to friends or borrowed, with live partial repayments & settlement tracking.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setSelectedDebtForEdit(null);
            setIsDebtModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            fontWeight: 700,
            borderRadius: '10px',
          }}
        >
          <Plus size={18} />
          <span>New Udhaar Entry</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: To Receive (Maine Diye) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                You Are Owed (Lent)
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '4px 0 2px 0' }}>
                {formatCurrency(summary.total_lent_pending)}
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Pending from friends / contacts
              </span>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
              }}
            >
              <ArrowUpRight size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#9CA3AF' }}>
            Total Lent (Initial): {formatCurrency(summary.total_lent_initial)}
          </div>
        </div>

        {/* Card 2: You Owe (Maine Liye) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                You Owe (Borrowed)
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '4px 0 2px 0' }}>
                {formatCurrency(summary.total_borrowed_pending)}
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Pending to return back
              </span>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <ArrowDownLeft size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#9CA3AF' }}>
            Total Borrowed (Initial): {formatCurrency(summary.total_borrowed_initial)}
          </div>
        </div>

        {/* Card 3: Settlements Overview */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Settlement Health
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '4px 0 2px 0' }}>
                {summary.settled_count} <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 500 }}>/ {summary.total_debts_count} Settled</span>
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                {summary.active_count} active pending debts
              </span>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
            {summary.total_debts_count > 0
              ? `${Math.round((summary.settled_count / summary.total_debts_count) * 100)}% Cleared`
              : 'No entries yet'}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Entries' },
            { id: 'LENT', label: 'Maine Diye (Lent)' },
            { id: 'BORROWED', label: 'Maine Liye (Borrowed)' },
            { id: 'ACTIVE', label: 'Active Pending' },
            { id: 'SETTLED', label: 'Settled 🎉' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                border: activeTab === tab.id ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                background: activeTab === tab.id ? '#3B82F6' : '#FFFFFF',
                color: activeTab === tab.id ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', paddingRight: '12px', height: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Debts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6B7280' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
            <HandCoins size={32} />
          </div>
          <p>Loading debt records...</p>
        </div>
      ) : filteredDebts.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed #D1D5DB',
            borderRadius: '16px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <HandCoins size={44} style={{ color: '#9CA3AF', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
            No Udhaar Records Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            {searchQuery
              ? `No matches found for "${searchQuery}". Try changing your filters.`
              : 'Track money you give to friends or borrow. Log installments as they return it!'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedDebtForEdit(null);
              setIsDebtModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Add First Udhaar Entry</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDebts.map((debt) => {
            const isLent = debt.debt_type === 'LENT';
            const isSettled = debt.status === 'SETTLED';
            const isPartiallyPaid = debt.status === 'PARTIALLY_PAID';
            const initialAmount = parseFloat(debt.initial_amount) || 0;
            const remainingAmount = parseFloat(debt.remaining_amount) || 0;
            const totalRepaid = parseFloat(debt.total_repaid) || 0;
            const progressPercent = initialAmount > 0
              ? Math.min(100, Math.round((totalRepaid / initialAmount) * 100))
              : 0;
            const isExpanded = !!expandedDebts[debt.id];

            return (
              <div
                key={debt.id}
                style={{
                  background: '#FFFFFF',
                  border: isSettled ? '1px solid #E5E7EB' : isLent ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Top Row: Person, Type Badge, Status, Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {/* Left: Avatar + Name + Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: isLent ? 'rgba(22, 163, 74, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: isLent ? '#16A34A' : '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {debt.person_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                          {debt.person_name}
                        </h3>
                        {/* Type Pill */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isLent ? 'rgba(22, 163, 74, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: isLent ? '#16A34A' : '#3B82F6',
                          }}
                        >
                          {isLent ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                          {isLent ? 'Maine Diye' : 'Maine Liye'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        Added on {formatDate(debt.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Pill & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status Pill */}
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isSettled
                          ? 'rgba(22, 163, 74, 0.1)'
                          : isPartiallyPaid
                          ? 'rgba(234, 179, 8, 0.12)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: isSettled
                          ? '#16A34A'
                          : isPartiallyPaid
                          ? '#B45309'
                          : '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isSettled ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Fully Settled</span>
                        </>
                      ) : isPartiallyPaid ? (
                        <>
                          <Clock size={12} />
                          <span>Partially Returned</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} />
                          <span>Pending (0% Paid)</span>
                        </>
                      )}
                    </span>

                    {/* Edit button */}
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => {
                        setSelectedDebtForEdit(debt);
                        setIsDebtModalOpen(true);
                      }}
                      title="Edit Debt Details"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Delete button */}
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleDeleteDebt(debt.id, debt.person_name)}
                      title="Delete Debt"
                      style={{ color: '#DC2626' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Numbers & Progress Bar */}
                <div
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Initial Amount</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                        {formatCurrency(initialAmount)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#16A34A' }}>Already Returned</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16A34A' }}>
                        {formatCurrency(totalRepaid)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: isLent ? '#DC2626' : '#3B82F6' }}>
                        Remaining Balance
                      </span>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: isSettled ? '#16A34A' : isLent ? '#DC2626' : '#3B82F6',
                        }}
                      >
                        {formatCurrency(remainingAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: isSettled ? '#16A34A' : isLent ? '#16A34A' : '#3B82F6',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                    <span>{progressPercent}% Repaid</span>
                    {debt.due_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={11} /> Due: {formatDate(debt.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes if any */}
                {debt.notes && (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#4B5563', fontStyle: 'italic' }}>
                    "{debt.notes}"
                  </p>
                )}

                {/* Bottom Action Strip */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    paddingTop: '8px',
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  {/* Toggle Repayment Timeline */}
                  <button
                    onClick={() => toggleExpand(debt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#4B5563',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    <History size={14} />
                    <span>
                      {debt.repayments?.length || 0} Return Installment{debt.repayments?.length === 1 ? '' : 's'}
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Add Repayment Button (disabled if settled) */}
                  {!isSettled ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedDebtForRepayment(debt);
                        setIsRepaymentModalOpen(true);
                      }}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Plus size={14} />
                      <span>{isLent ? 'Log Received Return' : 'Log Return Payment'}</span>
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#16A34A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={15} /> All Settled Up!
                    </span>
                  )}
                </div>

                {/* Expanded Repayment History Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed #E5E7EB',
                    }}
                  >
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', margin: '0 0 8px 0' }}>
                      Payment Return History Timeline
                    </h4>

                    {(!debt.repayments || debt.repayments.length === 0) ? (
                      <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
                        No installments logged yet. Click "{isLent ? 'Log Received Return' : 'Log Return Payment'}" to record partial payments.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {debt.repayments.map((rep) => (
                          <div
                            key={rep.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                              <div>
                                <strong style={{ color: '#111827' }}>{formatCurrency(rep.amount)}</strong>
                                {rep.payment_method && (
                                  <span
                                    style={{
                                      marginLeft: '6px',
                                      fontSize: '0.7rem',
                                      background: '#E5E7EB',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      color: '#4B5563',
                                    }}
                                  >
                                    {rep.payment_method}
                                  </span>
                                )}
                                {rep.notes && (
                                  <span style={{ marginLeft: '6px', color: '#6B7280', fontSize: '0.75rem' }}>
                                    • {rep.notes}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                {formatDate(rep.payment_date)}
                              </span>
                              <button
                                onClick={() => handleDeleteRepayment(debt.id, rep.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#DC2626',
                                  cursor: 'pointer',
                                  padding: '2px',
                                }}
                                title="Delete installment"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Debt Add/Edit Modal */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setSelectedDebtForEdit(null);
        }}
        onSave={handleSaveDebt}
        debt={selectedDebtForEdit}
        isSaving={isSaving}
      />

      {/* Debt Repayment Modal */}
      <DebtRepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => {
          setIsRepaymentModalOpen(false);
          setSelectedDebtForRepayment(null);
        }}
        onSave={handleSaveRepayment}
        debt={selectedDebtForRepayment}
        isSaving={isSaving}
      />
    </div>
  );
};

export default DebtsPage;
