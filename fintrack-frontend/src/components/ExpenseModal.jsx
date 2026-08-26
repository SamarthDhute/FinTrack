import React, { useState, useEffect } from 'react';
import { X, Plus, Receipt } from 'lucide-react';
import { getTodayDateString } from '../utils/formatters';

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  categories = [],
  paymentMethods = [],
  expense = null,
  isSaving,
  onQuickAddCategory,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');

  // Inline new category creation state
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setCategoryId(String(expense.category_id || ''));
      setPaymentMethodId(String(expense.payment_method_id || ''));
      setAmount(String(expense.amount || ''));
      setDate(expense.date ? expense.date.split('T')[0] : getTodayDateString());
      setNotes(expense.notes || '');
    } else {
      setTitle('');
      setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
      setPaymentMethodId(paymentMethods.length > 0 ? String(paymentMethods[0].id) : '');
      setAmount('');
      setDate(getTodayDateString());
      setNotes('');
    }
    setIsAddingNewCat(false);
    setNewCatName('');
    setErrors({});
  }, [expense, isOpen, categories, paymentMethods]);

  if (!isOpen) return null;

  const today = getTodayDateString();

  const handleCreateCategoryInline = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    try {
      setIsCreatingCat(true);
      const newCat = await onQuickAddCategory({ name: trimmed });
      if (newCat && newCat.id) {
        setCategoryId(String(newCat.id));
        setIsAddingNewCat(false);
        setNewCatName('');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, category: err.message || 'Failed to create category' }));
    } finally {
      setIsCreatingCat(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Title is required (max 50 chars).';
    } else if (title.trim().length > 50) {
      errs.title = 'Title cannot exceed 50 characters.';
    }

    if (!categoryId) {
      errs.category = 'Please select a category.';
    }

    if (!paymentMethodId) {
      errs.paymentMethod = 'Please select a payment method.';
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Amount must be a positive number (> 0).';
    }

    if (!date) {
      errs.date = 'Date is required.';
    } else if (date > today) {
      errs.date = 'Expense date cannot be in the future.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      category_id: parseInt(categoryId, 10),
      payment_method_id: parseInt(paymentMethodId, 10),
      amount: parseFloat(amount),
      date: date,
      notes: notes.trim() || null,
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={20} color="var(--primary)" />
            <h3>{expense ? 'Edit Expense' : 'Log New Expense'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-title">
                Expense Title *
              </label>
              <input
                id="expense-title"
                type="text"
                className="form-input"
                placeholder="e.g. Swiggy Lunch, Uber Cab, Grocery Run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
                autoFocus
              />
              {errors.title && <p className="input-error-msg">{errors.title}</p>}
            </div>

            {/* Amount & Date in 2-column row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="expense-amount">
                  Amount (₹) *
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {errors.amount && <p className="input-error-msg">{errors.amount}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-date">
                  Date *
                </label>
                <input
                  id="expense-date"
                  type="date"
                  max={today}
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                {errors.date && <p className="input-error-msg">{errors.date}</p>}
              </div>
            </div>

            {/* Category Dropdown & Quick Add */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" htmlFor="expense-category" style={{ marginBottom: 0 }}>
                  Category *
                </label>
                {!isAddingNewCat && onQuickAddCategory && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                    onClick={() => setIsAddingNewCat(true)}
                  >
                    + New Category
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCreateCategoryInline}
                    disabled={isCreatingCat || !newCatName.trim()}
                  >
                    {isCreatingCat ? '...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsAddingNewCat(false);
                      setNewCatName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  id="expense-category"
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category && <p className="input-error-msg">{errors.category}</p>}
            </div>

            {/* Payment Method Dropdown (Predefined: Cash, Card, UPI, Net Banking, Wallet) */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-payment-method">
                Payment Method *
              </label>
              <select
                id="expense-payment-method"
                className="form-select"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                required
              >
                <option value="" disabled>Select payment method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    💳 {pm.name}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && <p className="input-error-msg">{errors.paymentMethod}</p>}
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="expense-notes">
                Notes (Optional)
              </label>
              <textarea
                id="expense-notes"
                className="form-textarea"
                placeholder="Add tags, bill numbers, or any additional context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
