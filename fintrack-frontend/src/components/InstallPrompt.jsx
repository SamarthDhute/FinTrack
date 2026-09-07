import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { Download, ShieldCheck, X } from 'lucide-react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { success, info } = useToast();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      success('FinTrack installed successfully! 🎉');
    } else {
      info('Installation dismissed');
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible && !showPrivacy) return null;

  return (
    <>
      {visible && (
        <aside aria-label="Install FinTrack Application" style={bannerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconBadgeStyle}>
              <Download size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Install FinTrack App
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span>Fast & offline mobile experience</span>
                <span>•</span>
                <button 
                  type="button" 
                  onClick={() => setShowPrivacy(true)}
                  style={privacyLinkStyle}
                >
                  <ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Privacy Policy
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <button type="button" onClick={handleInstall} style={buttonStyle}>
              Install
            </button>
            <button type="button" onClick={() => setVisible(false)} style={closeStyle} aria-label="Close install prompt">
              <X size={16} />
            </button>
          </div>
        </aside>
      )}

      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
};

const bannerStyle = {
  position: 'fixed',
  bottom: '1.25rem',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--bg-card, #FFFFFF)',
  color: 'var(--text-main, #0F172A)',
  padding: '0.75rem 1rem',
  borderRadius: '16px',
  boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0,0,0,0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  zIndex: 1050,
  width: 'calc(100% - 2rem)',
  maxWidth: '480px',
  backdropFilter: 'blur(12px)',
};

const iconBadgeStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const privacyLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--primary, #10B981)',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'underline',
};

const buttonStyle = {
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '0.45rem 0.9rem',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
};

const closeStyle = {
  background: 'rgba(0, 0, 0, 0.05)',
  border: 'none',
  borderRadius: '50%',
  color: 'var(--text-dim, #64748B)',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
