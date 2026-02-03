/**
 * API Types for Signal Wars
 * Shared type definitions for all API routes
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ============================================================================
// Agent Types
// ============================================================================

export type AgentRank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';

export interface AgentProfile {
  id: string;
  name: string;
  address: string;
  owner: string;
  rank: AgentRank;
  tier: number;
  avatar?: string;
  description?: string;
  createdAt: number;
  isActive: boolean;
}

export interface AgentStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  totalStaked: string; // Lamports as string
  totalWon: string;    // Lamports as string
  totalLost: string;   // Lamports as string
  roi: number;         // Percentage
  winRate: number;     // Percentage
  reputationScore: number;
}

export interface AgentAchievements {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  progress: number;
  maxProgress: number;
}

export interface AgentWithStats extends AgentProfile {
  stats: AgentStats;
  achievements: AgentAchievements[];
  globalRank: number;
}

// ============================================================================
// Leaderboard Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  agent: AgentProfile;
  stats: AgentStats;
  score: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  perPage: number;
  lastUpdated: number;
}

export type LeaderboardSortBy = 'accuracy' | 'streak' | 'roi' | 'score' | 'predictions' | 'rank';

// ============================================================================
// Prediction Types
// ============================================================================

export type PredictionDirection = 'up' | 'down';
export type PredictionStatus = 'committed' | 'revealed' | 'resolved' | 'expired';
export type AssetSymbol = 'SOL' | 'BTC' | 'ETH' | 'JUP' | 'BONK' | 'WIF' | 'USDC' | 'USDT';

export interface Prediction {
  id: string;
  agentId: string;
  agentName: string;
  seasonId: string;
  asset: AssetSymbol;
  direction: PredictionDirection;
  targetPrice: number;
  currentPrice: number;
  confidence: number;
  stakeAmount: string; // Lamports as string
  timeframe: number;   // Minutes
  status: PredictionStatus;
  createdAt: number;
  revealedAt: number | null;
  resolvedAt: number | null;
  actualPrice: number | null;
  wasCorrect: boolean | null;
  payout: string | null; // Lamports as string
}

export interface CreatePredictionRequest {
  agentId: string;
  asset: AssetSymbol;
  direction: PredictionDirection;
  targetPrice: number;
  confidence: number;
  stakeAmount: string; // Lamports as string
  timeframe: number;   // Minutes
}

export interface PredictionHistoryResponse {
  predictions: Prediction[];
  total: number;
  page: number;
  perPage: number;
}

// ============================================================================
// Duel Types
// ============================================================================

export type DuelStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface DuelParticipant {
  agentId: string;
  agentName: string;
  avatar?: string;
  predictionId?: string;
  direction?: PredictionDirection;
  stakeAmount: string;
  revealed: boolean;
}

export interface Duel {
  id: string;
  challenger: DuelParticipant;
  opponent: DuelParticipant;
  asset: AssetSymbol;
  totalStake: string;
  status: DuelStatus;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  winnerId: string | null;
  resolutionPrice: number | null;
}

export interface CreateDuelRequest {
  challengerAgentId: string;
  opponentAgentId: string;
  asset: AssetSymbol;
  stakeAmount: string;
}

export interface DuelResponse {
  duels: Duel[];
  total: number;
  page: number;
  perPage: number;
}

// ============================================================================
// Season Types
// ============================================================================

export type SeasonStatus = 'upcoming' | 'active' | 'completed';

export interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  description: string;
  status: SeasonStatus;
  entryFee: string;      // Lamports as string
  prizePool: string;     // Lamports as string
  prizePoolBps: number;  // Basis points
  startTime: number;
  endTime: number;
  duration: number;      // Days
  participantCount: number;
  predictionCount: number;
  totalStaked: string;
}

export interface SeasonStanding {
  rank: number;
  agentId: string;
  agentName: string;
  avatar?: string;
  score: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  totalStaked: string;
  totalWon: string;
  roi: number;
}

export interface SeasonResponse {
  currentSeason: Season | null;
  upcomingSeasons: Season[];
  pastSeasons: Season[];
}

export interface SeasonStandingsResponse {
  season: Season;
  standings: SeasonStanding[];
  totalParticipants: number;
  page: number;
  perPage: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: number;
    requestId: string;
    cached?: boolean;
  };
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface LeaderboardQueryParams extends PaginationParams {
  sortBy?: LeaderboardSortBy;
  rank?: AgentRank | 'all';
  minAccuracy?: number;
  minPredictions?: number;
}

export interface PredictionsQueryParams extends PaginationParams {
  agentId?: string;
  seasonId?: string;
  asset?: AssetSymbol;
  status?: PredictionStatus;
  from?: number; // Timestamp
  to?: number;   // Timestamp
}

export interface DuelsQueryParams extends PaginationParams {
  agentId?: string;
  status?: DuelStatus;
  asset?: AssetSymbol;
}

export interface AgentsQueryParams extends PaginationParams {
  rank?: AgentRank;
  search?: string;
  minAccuracy?: number;
}
