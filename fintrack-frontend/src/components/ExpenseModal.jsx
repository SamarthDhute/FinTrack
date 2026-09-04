import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Receipt, 
  Sparkles, 
  Camera, 
  Upload, 
  Loader2, 
  Check, 
  Mic, 
  MicOff, 
  Zap, 
  Delete, 
  Hash, 
  Tag 
} from 'lucide-react';
import { getTodayDateString } from '../utils/formatters';
import { api } from '../api/client';

const VIBE_TAGS = [
  { label: '🍕 Food / Swiggy', title: 'Swiggy Food', catHint: 'Food' },
  { label: '✨ Flex & Outing', title: 'Weekend Outing', catHint: 'Entertainment' },
  { label: '📦 Subs & Bills', title: 'Subscription', catHint: 'Utilities' },
  { label: '🚀 Tech & Tools', title: 'Tech Gadget', catHint: 'Shopping' },
  { label: '🤡 Regret Buys', title: 'Impulse Buy', catHint: 'Shopping' },
];

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

  // Numpad toggle
  const [showNumpad, setShowNumpad] = useState(false);

  // Voice-to-Expense state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const speechRecognitionRef = useRef(null);

  // AI Auto-Categorization state
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const categorizeTimer = useRef(null);

  // AI Receipt Scanner state
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptScanSuccess, setReceiptScanSuccess] = useState(false);
  const [receiptScanData, setReceiptScanData] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const fileInputRef = useRef(null);

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
    setAiSuggestion(null);
    setReceiptScanSuccess(false);
    setReceiptScanData(null);
    setReceiptPreview(null);
    setIsAddingNewCat(false);
    setNewCatName('');
    setErrors({});
    setShowNumpad(false);
    setIsListening(false);
  }, [expense, isOpen, categories, paymentMethods]);

  // Voice to expense recognition handler
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('Listening... Speak (e.g. "250 rupees on Momos")');
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setVoiceTranscript(text);
        parseVoiceExpense(text);
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        setVoiceTranscript('Could not capture audio.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech init error:', err);
      setIsListening(false);
    }
  };

  // Helper to parse spoken string into amount & title
  const parseVoiceExpense = (text) => {
    // Look for numbers (e.g., "250 rupees on Swiggy" or "Swiggy 500")
    const matchAmount = text.match(/(\d+(?:\.\d{1,2})?)/);
    let extractedAmount = matchAmount ? matchAmount[1] : '';
    let cleanedTitle = text
      .replace(/(\d+(?:\.\d{1,2})?)/g, '')
      .replace(/(rupees|rs|inr|spent on|spent for|for|on|bought|paid)/gi, '')
      .trim();

    if (!cleanedTitle) cleanedTitle = 'Voice Expense';

    if (extractedAmount) setAmount(extractedAmount);
    setTitle(cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1));
  };

  // Numpad input handler
  const handleNumpadPress = (val) => {
    if (val === 'clear') {
      setAmount('');
    } else if (val === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amount.includes('.')) setAmount((prev) => (prev ? prev + '.' : '0.'));
    } else {
      setAmount((prev) => prev + val);
    }
  };

  // Debounced auto-categorization when title changes
  useEffect(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 2 || expense) {
      setAiSuggestion(null);
      return;
    }

    if (categorizeTimer.current) clearTimeout(categorizeTimer.current);

    categorizeTimer.current = setTimeout(async () => {
      try {
        setIsCategorizing(true);
        const res = await api.ai.categorize({
          title: trimmedTitle,
          amount: parseFloat(amount) || null,
        });

        if (res && res.suggested_category_id) {
          setAiSuggestion(res);
          setCategoryId(String(res.suggested_category_id));

          if (res.suggested_payment_method) {
            const matchedPm = paymentMethods.find(
              (p) => p.name.toLowerCase() === res.suggested_payment_method.toLowerCase()
            );
            if (matchedPm) setPaymentMethodId(String(matchedPm.id));
          }
        }
      } catch (err) {
        console.log('Auto-categorize error:', err);
      } finally {
        setIsCategorizing(false);
      }
    }, 250);

    return () => {
      if (categorizeTimer.current) clearTimeout(categorizeTimer.current);
    };
  }, [title, paymentMethods]);

  // Handle Receipt Upload & Vision OCR
  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningReceipt(true);
      setReceiptScanSuccess(false);
      setReceiptScanData(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        setReceiptPreview(base64Data);

        try {
          const res = await api.ai.scanReceipt({
            image_base64: base64Data,
            mime_type: file.type || 'image/jpeg',
          });

          if (res) {
            setReceiptScanData(res);
            if (res.title && res.title !== 'Receipt Expense' && res.title !== 'Scanned Expense') {
              setTitle(res.title);
            } else if (res.merchant_name) {
              setTitle(res.merchant_name);
            }

            if (res.amount !== null && res.amount !== undefined) {
              setAmount(String(res.amount));
            }
            if (res.date) {
              setDate(res.date);
            }
            if (res.category_id) {
              setCategoryId(String(res.category_id));
            }
            if (res.payment_method_hint) {
              const matchedPm = paymentMethods.find(
                (p) => p.name.toLowerCase() === res.payment_method_hint.toLowerCase() ||
                       res.payment_method_hint.toLowerCase().includes(p.name.toLowerCase())
              );
              if (matchedPm) setPaymentMethodId(String(matchedPm.id));
            }
            setReceiptScanSuccess(true);
          }
        } catch (err) {
          console.error('Scan receipt error:', err);
        } finally {
          setIsScanningReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setIsScanningReceipt(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const today = getTodayDateString();

  const handleCreateCategoryInline = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    try {
      setIsCreatingCat(true);
      if (onQuickAddCategory) {
        const newCat = await onQuickAddCategory(trimmed);
        if (newCat && newCat.id) {
          setCategoryId(String(newCat.id));
          setIsAddingNewCat(false);
          setNewCatName('');
        }
      }
    } catch (err) {
      console.error('Failed to create category inline:', err);
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleSelectVibeTag = (tag) => {
    setTitle(tag.title);
    const matchedCat = categories.find((c) => c.name.toLowerCase().includes(tag.catHint.toLowerCase()));
    if (matchedCat) setCategoryId(String(matchedCat.id));
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    else if (title.trim().length > 50) newErrors.title = 'Title must be 50 characters or less';

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (numAmount > 99999999.99) {
      newErrors.amount = 'Amount exceeds maximum limit';
    }

    if (!categoryId) newErrors.categoryId = 'Please select a category';
    if (!paymentMethodId) newErrors.paymentMethodId = 'Please select a payment method';

    if (!date) {
      newErrors.date = 'Date is required';
    } else if (date > today) {
      newErrors.date = 'Expense date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      amount: parseFloat(amount),
      category_id: parseInt(categoryId, 10),
      payment_method_id: parseInt(paymentMethodId, 10),
      date: date,
      notes: notes.trim() || null,
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={20} style={{ color: '#3B82F6' }} />
            <h3>{expense ? 'Edit Expense' : 'Speed Log Expense ⚡'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* AI Receipt OCR Scanner Bar */}
        {!expense && (
          <div 
            style={{
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              {receiptPreview ? (
                <img 
                  src={receiptPreview} 
                  alt="Receipt Preview" 
                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #E5E7EB' }} 
                />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={15} style={{ color: '#3B82F6' }} />
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <span style={{ fontSize: '0.82rem', color: receiptScanSuccess ? '#16A34A' : '#4B5563', fontWeight: receiptScanSuccess ? 700 : 500, display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {isScanningReceipt
                    ? 'AI reading receipt text...'
                    : receiptScanSuccess
                    ? `✓ Bill Auto-filled (${receiptScanData?.merchant_name || receiptScanData?.title || 'Extracted'})`
                    : 'Upload receipt image to auto-fill:'}
                </span>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleReceiptFileChange}
            />

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningReceipt}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: receiptScanSuccess ? 'rgba(22, 163, 74, 0.1)' : '#FFFFFF',
                  color: receiptScanSuccess ? '#16A34A' : '#111827',
                  border: `1px solid ${receiptScanSuccess ? 'rgba(22, 163, 74, 0.3)' : '#D1D5DB'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {isScanningReceipt ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : receiptScanSuccess ? (
                  <>
                    <Check size={12} />
                    <span>Re-scan</span>
                  </>
                ) : (
                  <>
                    <Upload size={12} />
                    <span>Scan Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 1-Tap Vibe Tags */}
        {!expense && (
          <div style={{ padding: '0.65rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <span style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', fontWeight: 600 }}>
              1-Tap Tags:
            </span>
            {VIBE_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleSelectVibeTag(tag)}
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '999px',
                  padding: '3px 9px',
                  color: '#374151',
                  fontSize: '0.74rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title & Voice-to-Expense Mic */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="expense-title" style={{ margin: 0 }}>
                  Expense Title *
                </label>
                
                {/* Voice-to-Expense Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  style={{
                    background: isListening ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${isListening ? '#DC2626' : 'rgba(59, 130, 246, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '2px 8px',
                    color: isListening ? '#DC2626' : '#3B82F6',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  title="Voice to expense: Tap and speak your expense"
                >
                  {isListening ? <MicOff size={12} className="animate-pulse" /> : <Mic size={12} />}
                  <span>{isListening ? 'Listening...' : 'Voice Log 🎙️'}</span>
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="expense-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Swiggy Lunch, Uber Cab, Starbucks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  required
                  autoFocus
                />
              </div>
              {errors.title && <p className="input-error-msg">{errors.title}</p>}
              {voiceTranscript && (
                <p style={{ fontSize: '0.72rem', color: '#6366F1', marginTop: '3px', fontWeight: 500 }}>
                  🎙️ Spoken: "{voiceTranscript}"
                </p>
              )}

              {/* AI Auto-Categorization Pill */}
              {aiSuggestion && !expense && (
                <div 
                  style={{
                    marginTop: '0.45rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    color: '#3B82F6',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => setCategoryId(String(aiSuggestion.suggested_category_id))}
                >
                  <Sparkles size={12} style={{ color: '#3B82F6' }} />
                  <span>AI Selected: <strong style={{ color: '#111827' }}>{aiSuggestion.category_name}</strong> {aiSuggestion.suggested_payment_method ? `• ${aiSuggestion.suggested_payment_method}` : ''}</span>
                </div>
              )}
            </div>

            {/* Amount & Date in 2-column row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="expense-amount" style={{ margin: 0 }}>
                    Amount (₹) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNumpad(!showNumpad)}
                    style={{
                      background: showNumpad ? 'rgba(59, 130, 246, 0.1)' : '#F3F4F6',
                      border: `1px solid ${showNumpad ? '#3B82F6' : '#E5E7EB'}`,
                      borderRadius: '6px',
                      padding: '2px 6px',
                      color: showNumpad ? '#3B82F6' : '#6B7280',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <Hash size={11} /> Numpad
                  </button>
                </div>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="99999999.99"
                  className="form-input"
                  placeholder="0.00"
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

            {/* Fast Numpad Keypad (Toggleable) */}
            {showNumpad && (
              <div 
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  padding: '10px',
                  marginBottom: '1.25rem',
                }}
              >
                <div className="numpad-grid">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="numpad-btn"
                      onClick={() => handleNumpadPress(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleNumpadPress('backspace')}
                    style={{ fontSize: '0.8rem' }}
                  >
                    ⌫ Backspace
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleNumpadPress('clear')}
                    style={{ fontSize: '0.8rem', color: '#DC2626' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Category Dropdown */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="expense-category" style={{ margin: 0 }}>
                  Category *
                </label>
                {onQuickAddCategory && !isAddingNewCat && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsAddingNewCat(true)}
                    style={{ fontSize: '0.75rem', padding: '0 4px', height: 'auto', color: '#3B82F6' }}
                  >
                    + Add New Category
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    maxLength={30}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCreateCategoryInline}
                    disabled={isCreatingCat || !newCatName.trim()}
                  >
                    {isCreatingCat ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
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
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoryId && <p className="input-error-msg">{errors.categoryId}</p>}
            </div>

            {/* Payment Method */}
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
                    {pm.name}
                  </option>
                ))}
              </select>
              {errors.paymentMethodId && <p className="input-error-msg">{errors.paymentMethodId}</p>}
            </div>

            {/* Notes (Optional) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="expense-notes">
                Notes (Optional)
              </label>
              <textarea
                id="expense-notes"
                className="form-textarea"
                placeholder="Add context, friend tags, or location..."
                rows={2}
                maxLength={200}
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
                  <span>Logging...</span>
                </>
              ) : (
                <span>{expense ? 'Save Changes' : 'Log Expense ⚡'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
