'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-32 h-10 bg-white/5 rounded-xl animate-pulse" />
    );
  }

  return (
    <WalletMultiButton 
      className="!bg-gradient-to-r !from-purple-600/80 !to-blue-600/80 !border !border-purple-500/30 !rounded-xl !text-sm !font-medium !text-white hover:!from-purple-600 hover:!to-blue-600 !transition-all !h-10 !px-4"
    />
  );
}

export default ConnectButton;
