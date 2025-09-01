import React from 'react';
import blockies from 'ethereum-blockies-base64';

export function BlockiesAvatar({ address, diameter = 32 }: { address: string; diameter?: number }) {
  const dataUrl = address ? blockies(address) : '';
  return (
    <img
      src={dataUrl}
      alt="Blockies Avatar"
      style={{ width: diameter, height: diameter, borderRadius: '50%', background: '#fff' }}
    />
  );
}
