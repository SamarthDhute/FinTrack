import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import '../styles/auth.css';

export default function ResetPasswordPage({ token: initialToken, onBackToLogin }) {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedToken = token ? token.trim() : '';
    if (!trimmedToken) {
      setError('Password reset token is required. Please check your email or paste the reset token.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({ token: trimmedToken, new_password: newPassword });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. The link may have expired or is invalid.');
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
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">Choose a secure password for your FinTrack account.</p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: '#16A34A', display: 'inline-flex', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Password Reset Complete</h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <button type="button" className="auth-submit-btn" onClick={onBackToLogin}>
              Sign In Now
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {!initialToken && (
              <div className="auth-field">
                <label className="auth-label">Reset Token</label>
                <div className="auth-input-wrapper">
                  <Key size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    required
                    className="auth-input"
                    placeholder="Paste reset token from email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type="password"
                  required
                  minLength={8}
                  className="auth-input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm New Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type="password"
                  required
                  minLength={8}
                  className="auth-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                className="auth-forgot-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={onBackToLogin}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
