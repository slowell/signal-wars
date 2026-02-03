// Utility functions for Signal Wars UI

import { Rank } from '@/types';

export const rankColors: Record<Rank, string> = {
  bronze: 'text-bronze border-bronze',
  silver: 'text-silver border-silver',
  gold: 'text-gold border-gold',
  diamond: 'text-diamond border-diamond',
  legend: 'text-legend border-legend',
};

export const rankBgColors: Record<Rank, string> = {
  bronze: 'bg-bronze',
  silver: 'bg-silver',
  gold: 'bg-gold',
  diamond: 'bg-diamond',
  legend: 'bg-legend',
};

export const rankGlowColors: Record<Rank, string> = {
  bronze: 'shadow-[0_0_20px_rgba(205,127,50,0.4)]',
  silver: 'shadow-[0_0_20px_rgba(192,192,192,0.4)]',
  gold: 'shadow-[0_0_25px_rgba(255,215,0,0.5)]',
  diamond: 'shadow-[0_0_30px_rgba(185,242,255,0.5)]',
  legend: 'shadow-[0_0_40px_rgba(255,107,53,0.6)]',
};

export const rankEmojis: Record<Rank, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
  legend: '🔥',
};

export const rankProgression: Rank[] = ['bronze', 'silver', 'gold', 'diamond', 'legend'];

export function getRankFromAccuracy(accuracy: number): Rank {
  if (accuracy >= 75) return 'legend';
  if (accuracy >= 65) return 'diamond';
  if (accuracy >= 60) return 'gold';
  if (accuracy >= 55) return 'silver';
  return 'bronze';
}

export function formatNumber(num: number, decimals: number = 1): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number, currency: string = 'USDC'): string {
  return `${formatNumber(amount)} ${currency}`;
}

export function formatTimeLeft(targetDate: string): string {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getWinRateColor(winRate: number): string {
  if (winRate >= 70) return 'text-green-400';
  if (winRate >= 60) return 'text-yellow-400';
  if (winRate >= 50) return 'text-orange-400';
  return 'text-red-400';
}

export function getStreakColor(streak: number): string {
  if (streak >= 10) return 'text-orange-400';
  if (streak >= 5) return 'text-yellow-400';
  if (streak >= 3) return 'text-blue-400';
  return 'text-gray-400';
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const assetIcons: Record<string, string> = {
  SOL: '☀️',
  BTC: '₿',
  ETH: 'Ξ',
  BONK: '🐕',
  JTO: '🔷',
  PYTH: '🔮',
  JUP: '🪐',
  RAY: '⚡',
  ORCA: '🐋',
  MSOL: '☀️',
};

export const assetColors: Record<string, string> = {
  SOL: 'from-purple-500 to-blue-500',
  BTC: 'from-orange-500 to-yellow-500',
  ETH: 'from-blue-500 to-purple-500',
  BONK: 'from-yellow-500 to-orange-500',
  JTO: 'from-blue-400 to-cyan-400',
  PYTH: 'from-purple-400 to-pink-400',
  JUP: 'from-orange-400 to-red-400',
};
