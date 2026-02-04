'use client';

import { useState, useEffect, useCallback } from 'react';

interface PhantomWindow extends Window {
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      publicKey?: { toString(): string } | null;
      isConnected?: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
      on(event: string, callback: () => void): void;
      removeListener(event: string, callback: () => void): void;
    };
  };
}

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  hasPhantom: boolean;
}

// Singleton state
let globalPublicKey: string | null = null;
let globalIsConnected = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useWallet(): WalletContextType {
  const [, forceUpdate] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const win = window as PhantomWindow;
      const phantomExists = !!win.phantom?.solana?.isPhantom;
      setHasPhantom(phantomExists);
    };

    checkPhantom();
    // Check again after a short delay in case Phantom loads slowly
    const timer = setTimeout(checkPhantom, 500);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const connect = useCallback(async () => {
    const win = window as PhantomWindow;
    const provider = win.phantom?.solana;

    if (!provider) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const resp = await provider.connect();
      globalPublicKey = resp.publicKey.toString();
      globalIsConnected = true;
      notifyListeners();
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const win = window as PhantomWindow;
    const provider = win.phantom?.solana;

    if (!provider) return;

    try {
      await provider.disconnect();
      globalPublicKey = null;
      globalIsConnected = false;
      notifyListeners();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    const win = window as PhantomWindow;
    const provider = win.phantom?.solana;

    if (!provider) return;

    const handleAccountChange = () => {
      if (provider.publicKey) {
        globalPublicKey = provider.publicKey.toString();
        globalIsConnected = true;
      } else {
        globalPublicKey = null;
        globalIsConnected = false;
      }
      notifyListeners();
    };

    provider.on('accountChanged', handleAccountChange);
    return () => {
      provider.removeListener('accountChanged', handleAccountChange);
    };
  }, [hasPhantom]);

  return {
    publicKey: globalPublicKey,
    isConnected: globalIsConnected,
    isConnecting,
    connect,
    disconnect,
    hasPhantom,
  };
}

// Simple connect button component
export function ConnectButton() {
  const { publicKey, isConnected, isConnecting, connect, disconnect, hasPhantom } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-32 h-10 bg-white/5 rounded-xl animate-pulse" />
    );
  }

  if (isConnected && publicKey) {
    return (
      <button
        onClick={disconnect}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>{publicKey.slice(0, 4)}...{publicKey.slice(-4)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="px-4 py-2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-500/30 rounded-xl text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
    >
      {isConnecting ? (
        'Connecting...'
      ) : hasPhantom ? (
        'Connect Wallet'
      ) : (
        'Install Phantom'
      )}
    </button>
  );
}

export default useWallet;
