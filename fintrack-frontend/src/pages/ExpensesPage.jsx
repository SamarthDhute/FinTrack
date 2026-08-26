import React, { useState, useEffect, useCallback } from 'react';
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
  Tag
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { ExpenseModal } from '../components/ExpenseModal';
import { DeleteModal } from '../components/DeleteModal';
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

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Expenses Log</h1>
          <p className="page-subtitle">Track, filter, and manage all your individual transactions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        {/* Primary Row: Search + Quick Category + Sort + Filter Toggle */}
        <div className="filter-row-primary">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              className="form-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 160 }}
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
            className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="More filter options"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>

          {(search || selectedCategory || selectedPaymentMethod || dateFrom || dateTo || amountMin || amountMax) && (
            <button className="btn btn-ghost btn-sm" onClick={handleResetFilters} title="Reset all filters">
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Secondary Row: Date and Amount range filters */}
        {showAdvancedFilters && (
          <div className="filter-row-secondary">
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
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
              <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
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
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Min Amount (₹)</label>
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
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Max Amount (₹)</label>
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
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
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
                <option value="date:desc">Date (Newest First)</option>
                <option value="date:asc">Date (Oldest First)</option>
                <option value="amount:desc">Amount (Highest First)</option>
                <option value="amount:asc">Amount (Lowest First)</option>
                <option value="title:asc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fetching expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon-circle">
            <Receipt size={32} />
          </div>
          <h3 className="empty-title">No expenses found</h3>
          <p className="empty-desc">
            {search || selectedCategory || selectedPaymentMethod || dateFrom || dateTo || amountMin || amountMax
              ? 'Try changing or clearing your search filters.'
              : 'Start tracking your spending by adding your first expense.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title & Notes</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center', width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{expense.title}</div>
                      {expense.notes && (
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={12} />
                          <span>{expense.notes}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-indigo">
                        <Tag size={12} />
                        {expense.category_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        <CreditCard size={12} />
                        {expense.payment_method_name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(expense.date)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit Expense"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsExpenseModalOpen(true);
                          }}
                        >
                          <Edit3 size={15} color="var(--text-muted)" />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete Expense"
                          onClick={() => {
                            setExpenseToDelete(expense);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={15} color="var(--rose-danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-bar">
            <span>
              Showing {expenses.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
              {Math.min(page * limit, totalCount)} of {totalCount} transactions
            </span>

            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span style={{ padding: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Page {page} of {totalPages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
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
