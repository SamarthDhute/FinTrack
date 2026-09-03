import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { success, error: showErrorToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFormError('');
    onClose();
  };

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!currentPassword) {
      setFormError('Please enter your current password.');
      return;
    }

    if (!isPasswordValid) {
      setFormError('New password does not meet all security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setFormError('New password must be different from your current password.');
      return;
    }

    try {
      setIsLoading(true);
      await api.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      success('Password updated successfully!');
      handleClose();
    } catch (err) {
      const msg = err.message || 'Failed to update password. Please check your current password.';
      setFormError(msg);
      showErrorToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '90%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <ShieldCheck size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Update Password</h3>
          </div>
          <button 
            type="button" 
            onClick={handleClose} 
            className="btn btn-ghost" 
            style={{ padding: '4px', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formError && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Security checklist */}
            {newPassword && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '8px',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.78rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem 0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasMinLength ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: hasMinLength ? 1 : 0.4 }} />
                  <span>8+ Characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasUppercase ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: hasUppercase ? 1 : 0.4 }} />
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasLowercase ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: hasLowercase ? 1 : 0.4 }} />
                  <span>1 Lowercase (a-z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasNumber ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: hasNumber ? 1 : 0.4 }} />
                  <span>1 Number (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasSpecial ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: hasSpecial ? 1 : 0.4 }} />
                  <span>1 Special char</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: passwordsMatch ? '#34d399' : '#64748b' }}>
                  <Check size={13} style={{ opacity: passwordsMatch ? 1 : 0.4 }} />
                  <span>Passwords match</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !currentPassword || !isPasswordValid || !passwordsMatch}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
