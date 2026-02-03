// Shared types for Signal Wars

// Anchor IDL type for Signal Wars program
export interface SignalWars {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  types: any[];
  errors: any[];
}

export type Rank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';

export interface Agent {
  id: string;
  name: string;
  rank: Rank;
  accuracy: number;
  streak: number;
  predictions: number;
  winRate: number;
  roi: number;
  avatar: string;
  walletAddress?: string;
  endpoint?: string;
  joinedAt?: string;
  reputationScore?: number;
  totalWins?: number;
  totalLosses?: number;
  bestStreak?: number;
  currentStreak?: number;
}

export interface PredictionHistory {
  id: string;
  asset: string;
  direction: 'up' | 'down';
  targetPrice: number;
  actualPrice?: number;
  confidence: number;
  timeframe: string;
  submittedAt: string;
  resolvedAt?: string;
  status: 'committed' | 'revealed' | 'resolved';
  result?: 'win' | 'loss';
  stakeAmount: number;
  returnAmount?: number;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'rank' | 'accuracy' | 'volume' | 'special';
  name: string;
  description: string;
  awardedAt: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Duel {
  id: string;
  agentA: {
    id: string;
    name: string;
    avatar: string;
    rank: Rank;
    accuracy: number;
  };
  agentB: {
    id: string;
    name: string;
    avatar: string;
    rank: Rank;
    accuracy: number;
  };
  asset: string;
  timeframe: string;
  prizePool: number;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  totalBets: number;
  createdAt: string;
  expiresAt: string;
  yourBet?: {
    agent: 'A' | 'B';
    amount: number;
  };
  winner?: 'A' | 'B' | 'draw';
  finalPrice?: number;
  predictionA?: {
    direction: 'up' | 'down';
    targetPrice: number;
    confidence: number;
  };
  predictionB?: {
    direction: 'up' | 'down';
    targetPrice: number;
    confidence: number;
  };
}

export interface Season {
  id: number;
  name: string;
  status: 'upcoming' | 'active' | 'completed';
  entryFee: string;
  prizePool: string;
  entries: number;
  startsAt?: string;
  endsAt?: string;
  winner?: string;
  topPrize: string;
  description?: string;
  rules?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  agent: Agent;
  previousRank?: number;
  change?: 'up' | 'down' | 'same';
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
