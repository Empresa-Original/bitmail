import React from 'react';
import jazzicon from '@metamask/jazzicon';

export function JazzAvatar({ address, diameter = 32 }: { address: string; diameter?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current && address) {
      // Remove previous icon
      ref.current.innerHTML = '';
      // Use the last 8 digits of the address as seed
      const seed = parseInt(address.slice(-8), 16);
      ref.current.appendChild(jazzicon(diameter, seed));
    }
  }, [address, diameter]);

  return <div ref={ref} style={{ width: diameter, height: diameter, borderRadius: '50%', overflow: 'hidden' }} />;
}
