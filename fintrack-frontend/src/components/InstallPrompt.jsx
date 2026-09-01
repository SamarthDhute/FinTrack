import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
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
      success('FinTrack installed!');
    } else {
      info('Installation dismissed');
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="install-banner" style={bannerStyle}>
      <span>FinTrack is ready to install.</span>
      <button onClick={handleInstall} style={buttonStyle}>Install</button>
      <button onClick={() => setVisible(false)} style={closeStyle}>✕</button>
    </div>
  );
};

const bannerStyle = {
  position: 'fixed',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  padding: '0.8rem 1.2rem',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  zIndex: 1000,
};

const buttonStyle = {
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '0.4rem 0.8rem',
  cursor: 'pointer',
};

const closeStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-dim)',
  fontSize: '1.2rem',
  cursor: 'pointer',
};
