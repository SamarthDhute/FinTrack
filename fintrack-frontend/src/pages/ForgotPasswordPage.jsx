import React, { useState } from 'react';
import { api } from '../api/client';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function ForgotPasswordPage({ onBackToLogin }) {
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
        <button
          type="button"
          className="auth-forgot-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}
          onClick={onBackToLogin}
        >
          <ArrowLeft size={14} />
          Back to login
        </button>

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
            <div style={{ color: '#10b981', display: 'inline-flex', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ color: '#f8fafc', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Check your email</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              If an account exists for <strong style={{ color: '#e2e8f0' }}>{email}</strong>, you will receive a reset link shortly. In development, check your backend server console.
            </p>
            <button type="button" className="auth-submit-btn" onClick={onBackToLogin}>
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
          </form>
        )}
      </div>
    </div>
  );
}
