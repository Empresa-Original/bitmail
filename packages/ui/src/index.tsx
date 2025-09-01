import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, ...props }) => (
  <button
    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#111827', color: '#ffffff', cursor: 'pointer', ...style }}
    {...props}
  />
);
