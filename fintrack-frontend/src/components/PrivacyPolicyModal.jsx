import React from 'react';
import { X, ShieldCheck, Lock, Eye, Database, Cpu, CheckCircle2, UserCheck } from 'lucide-react';

export const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94%',
          maxHeight: '85vh',
          borderRadius: '24px',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid #E5E7EB',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Privacy Policy
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                FinTrack Personal Expense & Wealth Management • Last updated: September 2026
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Policy Body */}
        <div 
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontSize: '0.88rem',
            lineHeight: '1.6',
            color: '#374151',
          }}
        >
          {/* Summary Box */}
          <div 
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <Lock size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#065F46', display: 'block', marginBottom: '0.2rem' }}>
                Your Privacy is Our Top Priority
              </strong>
              <span style={{ color: '#047857', fontSize: '0.82rem' }}>
                FinTrack does NOT sell your financial information, transaction records, or personal data to third parties, advertisers, or loan providers.
              </span>
            </div>
          </div>

          {/* Section 1 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#3B82F6" />
              1. Information We Collect
            </h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              We only collect data necessary to provide accurate budgeting, analytics, and personal finance tracking:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li><strong>Account Credentials:</strong> Email address, optional display name, and securely hashed passwords (or Google OAuth user ID).</li>
              <li><strong>Financial Transactions:</strong> Expense title, amount, category, payment method, date, optional receipt images, and wallet accounts that you manually log or scan.</li>
              <li><strong>Debts & Udhaar Records:</strong> Person names, lent/borrowed amounts, due dates, and settlement repayments that you track.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#10B981" />
              2. How Your Data is Secured
            </h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              All user data is strictly isolated on our backend database:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li><strong>Encryption:</strong> Password hashes use industry-standard <code>bcrypt</code>. API traffic is encrypted via HTTPS / TLS.</li>
              <li><strong>Strict Isolation:</strong> Every category, expense, wallet, and debt query is scoped to your verified account ID (`user_id`). No user can access or view another user's financial ledger.</li>
              <li><strong>Stateless JWT Tokens:</strong> Short-lived Access Tokens (15 min) and HttpOnly secure Refresh Tokens protect against CSRF and session hijacking.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#8B5CF6" />
              3. AI Insights & Receipt Scanner Privacy
            </h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              When you use AI Features (Smart Insights, Receipt Scanner, Chat Advisor, Goal Planner):
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li>Only anonymized, aggregated numeric spending totals are passed to the AI provider.</li>
              <li>Your sensitive credentials, personal names, and bank details are never sent or stored in public LLM training datasets.</li>
              <li>Offline Heuristic Engine operates 100% locally on your server without sending any data over external AI networks.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#F59E0B" />
              4. Mobile Installation & PWA Offline Storage
            </h3>
            <p style={{ margin: 0 }}>
              When installed as a mobile app (Progressive Web App), offline financial metrics are securely cached on your device storage via service workers for fast load times. You can uninstall or clear device cache anytime.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} color="#EF4444" />
              5. Your Rights & Data Deletion
            </h3>
            <p style={{ margin: 0 }}>
              You have complete ownership over your financial data. You can edit or delete any expense, debt record, or wallet at any time. To request full account termination and database wipe, contact support.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #E5E7EB',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            🔒 Safe • Encrypted • Confidential
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '10px', padding: '0.5rem 1.25rem' }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
