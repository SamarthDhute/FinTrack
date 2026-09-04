import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Mail, Key } from 'lucide-react';
import '../styles/auth.css';

export default function VerifyEmailPage({ token: initialToken, onBackToLogin }) {
  const [token, setToken] = useState(initialToken || '');
  const [status, setStatus] = useState(initialToken ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (tokenToVerify) => {
    const trimmed = (tokenToVerify || '').trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('Verification token is missing. Please check the link in your email.');
      return;
    }

    setStatus('verifying');
    setMessage('');
    try {
      const res = await api.auth.verifyEmail({ token: trimmed });
      setStatus('success');
      setMessage(res.message || 'Email verified successfully! You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Verification link is invalid or has expired.');
    }
  };

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleVerify(token);
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResending(true);
    try {
      await api.auth.resendVerification({ email: resendEmail.trim() });
      setResendSent(true);
    } catch (err) {
      setMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
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
          <h1 className="auth-title">Email Verification</h1>
          <p className="auth-subtitle">Verify your email to activate your FinTrack account.</p>
        </div>

        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2
              size={44}
              style={{
                animation: 'spin 1s linear infinite',
                color: '#3B82F6',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
              Verifying your email address, please wait...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={32} color="#16A34A" />
            </div>
            <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Email Verified!
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
              {message || 'Your email address has been verified successfully. You can now sign in.'}
            </p>
            <button type="button" className="auth-submit-btn" onClick={onBackToLogin}>
              Sign In to Your Account
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="auth-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{message}</span>
            </div>

            {resendSent ? (
              <div
                style={{
                  background: 'rgba(22, 163, 74, 0.08)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                  borderRadius: 8,
                  padding: '1rem',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <p style={{ color: '#16A34A', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>
                  A new verification link has been sent to <strong>{resendEmail}</strong>. Please check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Need a new verification link? Enter your email:
                </p>
                <div className="auth-field">
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      required
                      className="auth-input"
                      placeholder="name@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="auth-secondary-btn"
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="auth-forgot-link"
                onClick={onBackToLogin}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <form className="auth-form" onSubmit={handleManualSubmit}>
            <div className="auth-field">
              <label className="auth-label">Verification Token</label>
              <div className="auth-input-wrapper">
                <Key size={16} className="auth-input-icon" />
                <input
                  type="text"
                  required
                  className="auth-input"
                  placeholder="Paste verification token from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              Verify Email
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
