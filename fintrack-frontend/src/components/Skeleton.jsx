import React from 'react';

export const Skeleton = ({ width = '100%', height = '1rem', style = {} }) => (
  <div style={{ background: 'var(--skeleton-bg)', width, height, borderRadius: '4px', ...style }} />
);
