import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  FileText,
  CreditCard,
  Tag,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Maximize2,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { ExpenseModal } from '../components/ExpenseModal';
import { DeleteModal } from '../components/DeleteModal';
import { CardZoomModal } from '../components/CardZoomModal';
import { CountUpNumber } from '../components/CountUpNumber';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ExpensesPage = ({ categories = [], paymentMethods = [], onRefreshGlobalData }) => {
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail / Zoom Modal State
  const [zoomedExpense, setZoomedExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedPaymentMethod) params.payment_method_id = selectedPaymentMethod;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (amountMin) params.amount_min = amountMin;
      if (amountMax) params.amount_max = amountMax;

      const res = await api.expenses.list(params);
      if (res && res.items) {
        setExpenses(res.items);
        setTotalCount(res.total || 0);
      } else if (Array.isArray(res)) {
        setExpenses(res);
        setTotalCount(res.length);
      } else {
        setExpenses([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, selectedCategory, selectedPaymentMethod, dateFrom, dateTo, amountMin, amountMax, error]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Compute live quick stats from loaded / filtered expenses
  const stats = useMemo(() => {
    const totalSpend = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const count = expenses.length;
    const avgSpend = count > 0 ? totalSpend / count : 0;
    const maxSpend = count > 0 ? Math.max(...expenses.map((e) => Number(e.amount) || 0)) : 0;
    return { totalSpend, count, avgSpend, maxSpend };
  }, [expenses]);

  // Count active filter conditions
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedCategory) count++;
    if (selectedPaymentMethod) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (amountMin) count++;
    if (amountMax) count++;
    return count;
  }, [search, selectedCategory, selectedPaymentMethod, dateFrom, dateTo, amountMin, amountMax]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedPaymentMethod('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSaveExpense = async (payload) => {
    try {
      setIsSavingExpense(true);
      if (editingExpense) {
        await api.expenses.update(editingExpense.id, payload);
        success('Expense updated successfully!');
      } else {
        await api.expenses.create(payload);
        success('Expense added successfully!');
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Save expense error:', err);
      error(err.message || 'Failed to save expense');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      await api.expenses.delete(expenseToDelete.id);
      success('Expense deleted successfully!');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      if (zoomedExpense?.id === expenseToDelete.id) {
        setZoomedExpense(null);
      }
      fetchExpenses();
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err) {
      console.error('Delete expense error:', err);
      error(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAddCategory = async (catData) => {
    const newCat = await api.categories.create(catData);
    if (onRefreshGlobalData) onRefreshGlobalData();
    return newCat;
  };

  // Export current list to CSV
  const handleExportCSV = () => {
    if (!expenses || expenses.length === 0) {
      error('No expenses to export');
      return;
    }

    try {
      const headers = ['ID', 'Title', 'Amount', 'Category', 'Payment Method', 'Date', 'Notes'];
      const rows = expenses.map((e) => [
        e.id,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        e.amount,
        `"${(e.category_name || '').replace(/"/g, '""')}"`,
        `"${(e.payment_method_name || '').replace(/"/g, '""')}"`,
        e.date,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FinTrack_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Expenses exported to CSV successfully!');
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to export CSV');
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0 }}>Expenses Log</h1>
            <span 
              className="badge badge-indigo" 
              style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '8px' }}
            >
              {totalCount} Total
            </span>
          </div>
          <p className="page-subtitle">Track, filter, and inspect your transactions with rich analytics</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Export filtered transactions to CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Stat Bar (Live on Current View) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card zoom-card-interactive" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Page Total
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
            {formatCurrency(stats.totalSpend)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Across {expenses.length} listed items
          </span>
        </div>

        <div className="card zoom-card-interactive" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Spend
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
            {formatCurrency(stats.avgSpend)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Per transaction average
          </span>
        </div>

        <div className="card zoom-card-interactive" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Highest Expense
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#D97706', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
            {formatCurrency(stats.maxSpend)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Peak item in this list
          </span>
        </div>

        <div className="card zoom-card-interactive" style={{ padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Results
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
            {totalCount}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      {categories.length > 0 && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '0.65rem',
            marginBottom: '0.75rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: selectedCategory === '' ? '1px solid #3B82F6' : '1px solid #E5E7EB',
              background: selectedCategory === '' ? '#3B82F6' : '#FFFFFF',
              color: selectedCategory === '' ? '#FFFFFF' : '#4B5563',
              boxShadow: selectedCategory === '' ? '0 2px 6px rgba(59, 130, 246, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🌟 All Categories
          </button>

          {categories.map((c) => {
            const isSelected = String(selectedCategory) === String(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? '' : c.id);
                  setPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                  background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#FFFFFF',
                  color: isSelected ? '#2563EB' : '#4B5563',
                  boxShadow: isSelected ? '0 2px 6px rgba(59, 130, 246, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🏷️ {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-bar zoom-card-interactive" style={{ marginBottom: '1.25rem' }}>
        {/* Primary Row: Search + Category + Payment Method + Sort + Filter Toggle */}
        <div className="filter-row-primary">
          <div className="search-input-wrapper" style={{ position: 'relative' }}>
            <Search size={18} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search expenses by title or notes..."
              className="form-input"
              style={{ paddingRight: search ? '2.5rem' : '1rem' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#E5E7EB',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  color: '#4B5563',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 150 }}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 160 }}
            value={selectedPaymentMethod}
            onChange={(e) => {
              setSelectedPaymentMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payment Methods</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`btn ${showAdvancedFilters || activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="More filter options"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span 
                style={{ 
                  background: showAdvancedFilters ? '#FFFFFF' : '#3B82F6', 
                  color: showAdvancedFilters ? '#3B82F6' : '#FFFFFF', 
                  padding: '1px 6px', 
                  borderRadius: '999px', 
                  fontSize: '0.7rem', 
                  fontWeight: 700 
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button 
              type="button"
              className="btn btn-ghost btn-sm" 
              onClick={handleResetFilters} 
              title="Reset all filters"
              style={{ color: '#DC2626' }}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Secondary Row: Date, Amount range, Sort filters */}
        {showAdvancedFilters && (
          <div 
            className="filter-row-secondary" 
            style={{ 
              paddingTop: '0.85rem', 
              borderTop: '1px solid #F3F4F6', 
              animation: 'slideUp 0.2s ease-out' 
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>From Date</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>To Date</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Min Amount (₹)</label>
              <input
                type="number"
                placeholder="Min ₹"
                className="form-input"
                value={amountMin}
                onChange={(e) => {
                  setAmountMin(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Max Amount (₹)</label>
              <input
                type="number"
                placeholder="Max ₹"
                className="form-input"
                value={amountMax}
                onChange={(e) => {
                  setAmountMax(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sort By</label>
              <select
                className="form-select"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, ord] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(ord);
                  setPage(1);
                }}
              >
                <option value="date:desc">📅 Date (Newest First)</option>
                <option value="date:asc">📅 Date (Oldest First)</option>
                <option value="amount:desc">💰 Amount (Highest First)</option>
                <option value="amount:asc">💰 Amount (Lowest First)</option>
                <option value="title:asc">🔤 Title (A-Z)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table & Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card empty-state zoom-card-interactive" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div className="empty-icon-circle" style={{ margin: '0 auto 1rem auto' }}>
            <Receipt size={36} color="#9CA3AF" />
          </div>
          <h3 className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            No expenses found
          </h3>
          <p className="empty-desc" style={{ maxWidth: '420px', margin: '0.5rem auto 1.5rem auto' }}>
            {activeFiltersCount > 0
              ? 'No transactions matched your active search & filter criteria. Try clearing some filters.'
              : 'You have not logged any expenses yet. Start taking control of your finances now!'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {activeFiltersCount > 0 ? (
              <button className="btn btn-secondary" onClick={handleResetFilters}>
                <RotateCcw size={16} />
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
              >
                <Plus size={18} />
                <span>+ Fast Log Expense</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card zoom-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Desktop Table View */}
          <div className="table-container hide-on-mobile" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title & Notes</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center', width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr 
                    key={expense.id}
                    className="activity-item-interactive"
                    onClick={() => setZoomedExpense(expense)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        {expense.title}
                      </div>
                      {expense.notes && (
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={12} />
                          <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {expense.notes}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={11} />
                        {expense.category_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={11} />
                        {expense.payment_method_name || 'Standard'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {formatDate(expense.date)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#DC2626', fontSize: '1rem' }}>
                      -{formatCurrency(expense.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Zoom & Inspect Receipt"
                          onClick={() => setZoomedExpense(expense)}
                        >
                          <Maximize2 size={14} color="#3B82F6" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit Expense"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsExpenseModalOpen(true);
                          }}
                        >
                          <Edit3 size={14} color="var(--text-muted)" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete Expense"
                          onClick={() => {
                            setExpenseToDelete(expense);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={14} color="var(--rose-danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Clean touch cards on small screens) */}
          <div className="show-on-mobile" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {expenses.map((expense) => (
              <div 
                key={expense.id}
                className="activity-item-interactive"
                onClick={() => setZoomedExpense(expense)}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', wordBreak: 'break-word' }}>
                      {expense.title}
                    </div>
                    {expense.notes && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.notes}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: '#DC2626', whiteSpace: 'nowrap' }}>
                    -{formatCurrency(expense.amount)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid #EEF2F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span 
                      style={{
                        background: 'rgba(59, 130, 246, 0.08)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Tag size={10} />
                      {expense.category_name}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                      {formatDate(expense.date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsExpenseModalOpen(true);
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', borderRadius: '6px', color: '#DC2626' }}
                      onClick={() => {
                        setExpenseToDelete(expense);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination Controls */}
          <div className="pagination-bar" style={{ padding: '1rem 1.25rem', background: '#FAFAFA', borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Showing {expenses.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalCount)} of {totalCount} transactions
            </span>

            <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                style={{ borderRadius: '8px' }}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span 
                style={{ 
                  padding: '3px 10px', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  fontSize: '0.85rem',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                }}
              >
                {page} / {totalPages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ borderRadius: '8px' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Zoom & Receipt Inspection Modal */}
      {zoomedExpense && (
        <CardZoomModal
          isOpen={Boolean(zoomedExpense)}
          onClose={() => setZoomedExpense(null)}
          title={`🧾 ${zoomedExpense.title}`}
          subtitle={`Transaction ID #${zoomedExpense.id} • ${formatDate(zoomedExpense.date)}`}
          icon={Receipt}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Big Amount Card Banner */}
            <div 
              style={{ 
                textAlign: 'center', 
                padding: '1.75rem 1rem', 
                background: '#FEF2F2', 
                borderRadius: '16px', 
                border: '1px solid #FECACA' 
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Paid Out
              </span>
              <div style={{ fontSize: 'clamp(2.25rem, 6vw, 3rem)', fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
                -{formatCurrency(zoomedExpense.amount)}
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#F9FAFB', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Category</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🏷️ {zoomedExpense.category_name}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Payment Channel</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💳 {zoomedExpense.payment_method_name || 'Standard Payment'}
                </div>
              </div>

              <div style={{ background: '#F9FAFB', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Transaction Date</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '2px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📅 {formatDate(zoomedExpense.date)}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {zoomedExpense.notes ? (
              <div style={{ background: '#F9FAFB', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>Notes & Description</div>
                <div style={{ fontSize: '0.925rem', color: '#374151', lineHeight: '1.5' }}>{zoomedExpense.notes}</div>
              </div>
            ) : (
              <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '12px', border: '1px dashed #E5E7EB', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No additional notes entered for this transaction.
              </div>
            )}

            {/* Quick Actions inside zoom modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingExpense(zoomedExpense);
                  setIsExpenseModalOpen(true);
                  setZoomedExpense(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={15} />
                <span>Edit Expense</span>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setExpenseToDelete(zoomedExpense);
                  setIsDeleteModalOpen(true);
                }}
                style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </CardZoomModal>
      )}

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        categories={categories}
        paymentMethods={paymentMethods}
        expense={editingExpense}
        isSaving={isSavingExpense}
        onQuickAddCategory={handleQuickAddCategory}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.title}" for ${formatCurrency(
                expenseToDelete.amount
              )}? This action cannot be undone.`
            : ''
        }
        isDeleting={isDeleting}
      />
    </div>
  );
};
