import React, { useState } from 'react';
import { api } from '../api/client';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

export default function ResetPasswordPage({ token, onBackToLogin }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({ token, new_password: newPassword });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
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
            <div style={{ color: '#10b981', display: 'inline-flex', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ color: '#f8fafc', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Password Reset Complete</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <button type="button" className="auth-submit-btn" onClick={onBackToLogin}>
              Sign In Now
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
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
          </form>
        )}
      </div>
    </div>
  );
}
