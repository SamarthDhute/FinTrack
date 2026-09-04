import React, { useState } from 'react';
import { api } from '../api/client';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function ForgotPasswordPage({ onBackToLogin, onGoToReset }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.auth.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="auth-back-btn"
            onClick={onBackToLogin}
          >
            <ArrowLeft size={14} />
            <span>Back to login</span>
          </button>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your account email and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: '#16A34A', display: 'inline-flex', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check your email</h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              If an account exists for <strong style={{ color: '#111827' }}>{email}</strong>, you will receive a reset link shortly.
            </p>
            {onGoToReset && (
              <button
                type="button"
                className="auth-submit-btn"
                style={{ marginBottom: '0.75rem' }}
                onClick={onGoToReset}
              >
                Enter Reset Token Manually
              </button>
            )}
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={onBackToLogin}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  required
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              {!isLoading && <Send size={16} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="auth-forgot-link"
                onClick={onBackToLogin}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
