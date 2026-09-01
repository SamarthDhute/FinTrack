import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';

export const OfflineBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const { info } = useToast();

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      info('Back online');
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner" style={bannerStyle} role="alert">
      <span>⚠️ You are offline – displaying cached data.</span>
    </div>
  );
};

const bannerStyle = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  padding: '0.5rem 1rem',
  textAlign: 'center',
  zIndex: 999,
  boxShadow: 'var(--shadow-sm)',
};
