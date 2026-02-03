/**
 * Demo Agent Types and Interfaces
 * 
 * Type definitions for the Signal Wars demo agent simulation system.
 */

import { PublicKey, Keypair } from '@solana/web3.js';

/** Agent personality types that determine prediction behavior */
export type AgentPersonalityType = 
  | 'aggressive'      // High confidence, high stakes, frequent predictions
  | 'conservative'    // Low confidence, low stakes, selective predictions
  | 'random'          // Completely random predictions
  | 'trend-follower'  // Follows recent price momentum
  | 'contrarian'      // Bets against recent trends
  | 'whale'           // Massive stakes, rare predictions
  | 'meme'            // Unpredictable, meme-based logic
  | 'analytical';     // Balanced, calculated approach

/** Direction of price prediction */
export type PredictionDirection = 'up' | 'down';

/** Asset symbols supported for predictions */
export type AssetSymbol = 'SOL' | 'BTC' | 'ETH' | 'JUP' | 'BONK' | 'WIF';

/** Agent rank tiers */
export type AgentRank = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Legend';

/** Prediction status */
export type PredictionStatus = 'Committed' | 'Revealed' | 'Resolved';

/** Represents a simulated agent wallet and identity */
export interface DemoAgent {
  /** Unique identifier */
  id: string;
  
  /** Agent name */
  name: string;
  
  /** Trading persona/strategy */
  personality: AgentPersonalityType;
  
  /** Solana keypair for transactions */
  keypair: Keypair;
  
  /** Agent PDA on-chain */
  agentPda?: PublicKey;
  
  /** Agent description/backstory */
  description: string;
  
  /** Current balance in lamports */
  balance: number;
  
  /** Performance statistics */
  stats: AgentStats;
  
  /** Whether agent is registered on-chain */
  isRegistered: boolean;
  
  /** Whether agent has entered current season */
  hasEnteredSeason: boolean;
  
  /** Season entry PDA */
  seasonEntryPda?: PublicKey;
}

/** Agent performance statistics */
export interface AgentStats {
  /** Total predictions made */
  totalPredictions: number;
  
  /** Correct predictions */
  correctPredictions: number;
  
  /** Current win streak */
  streak: number;
  
  /** Best win streak achieved */
  bestStreak: number;
  
  /** Current rank */
  rank: AgentRank;
  
  /** Reputation score */
  reputationScore: number;
  
  /** Total SOL staked */
  totalStaked: number;
  
  /** Total SOL won/lost */
  totalProfit: number;
  
  /** Win rate percentage */
  winRate: number;
}

/** Personality parameters that influence predictions */
export interface PersonalityParams {
  /** Base confidence level (0-100) */
  baseConfidence: number;
  
  /** Confidence variance (randomness added) */
  confidenceVariance: number;
  
  /** Base stake amount in SOL */
  baseStake: number;
  
  /** Stake multiplier range [min, max] */
  stakeRange: [number, number];
  
  /** Prediction frequency (predictions per hour) */
  predictionFrequency: number;
  
  /** Preferred assets (weighted) */
  preferredAssets: { asset: AssetSymbol; weight: number }[];
  
  /** Timeframe preference in minutes */
  timeframeMinutes: number;
  
  /** Direction bias (-1 = always down, 0 = neutral, 1 = always up) */
  directionBias: number;
}

/** A prediction made by an agent */
export interface AgentPrediction {
  /** Prediction PDA */
  predictionPda?: PublicKey;
  
  /** Agent that made the prediction */
  agentId: string;
  
  /** Asset being predicted */
  asset: AssetSymbol;
  
  /** Direction prediction */
  direction: PredictionDirection;
  
  /** Target price */
  targetPrice: number;
  
  /** Current price at prediction time */
  currentPrice: number;
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** Amount staked in lamports */
  stakeAmount: number;
  
  /** Prediction timestamp */
  timestamp: number;
  
  /** Timeframe in minutes */
  timeframe: number;
  
  /** Prediction hash (commit) */
  predictionHash: Buffer;
  
  /** Full prediction data string */
  predictionData: string;
  
  /** Current status */
  status: PredictionStatus;
  
  /** Whether prediction was correct (after resolution) */
  wasCorrect?: boolean;
}

/** Duel between two agents */
export interface AgentDuel {
  /** Duel ID */
  id: string;
  
  /** Challenger agent */
  challenger: DemoAgent;
  
  /** Opponent agent */
  opponent: DemoAgent;
  
  /** Asset being predicted */
  asset: AssetSymbol;
  
  /** Challenger's prediction */
  challengerPrediction?: AgentPrediction;
  
  /** Opponent's prediction */
  opponentPrediction?: AgentPrediction;
  
  /** Duel stake amount */
  stakeAmount: number;
  
  /** Duel start time */
  startTime: number;
  
  /** Duel end time */
  endTime: number;
  
  /** Whether duel is complete */
  isComplete: boolean;
  
  /** Winner (if resolved) */
  winner?: DemoAgent;
}

/** Vote on a duel outcome */
export interface DuelVote {
  /** Voter agent */
  voter: DemoAgent;
  
  /** Duel being voted on */
  duelId: string;
  
  /** Agent being voted for */
  votedFor: DemoAgent;
  
  /** Vote amount in lamports */
  amount: number;
  
  /** Vote timestamp */
  timestamp: number;
}

/** Simulation configuration */
export interface SimulationConfig {
  /** Number of agents to create */
  agentCount: number;
  
  /** RPC endpoint */
  rpcEndpoint: string;
  
  /** Program ID */
  programId: PublicKey;
  
  /** Season ID to participate in */
  seasonId: number;
  
  /** Whether to use airdrops for funding */
  useAirdrop: boolean;
  
  /** Faucet URL for funding (if not using airdrop) */
  faucetUrl?: string;
  
  /** Amount to fund each agent (in SOL) */
  fundingAmount: number;
  
  /** Entry fee for season (in SOL) */
  entryFee: number;
  
  /** Simulation duration in minutes */
  durationMinutes: number;
  
  /** Delay between predictions (ms) */
  predictionDelayMs: number;
}

/** Simulation results */
export interface SimulationResults {
  /** Agents that participated */
  agents: DemoAgent[];
  
  /** All predictions made */
  predictions: AgentPrediction[];
  
  /** All duels created */
  duels: AgentDuel[];
  
  /** All votes cast */
  votes: DuelVote[];
  
  /** Simulation start time */
  startTime: number;
  
  /** Simulation end time */
  endTime: number;
  
  /** Total transactions sent */
  totalTransactions: number;
  
  /** Success rate of transactions */
  successRate: number;
}

/** Asset price data */
export interface AssetPrice {
  /** Asset symbol */
  asset: AssetSymbol;
  
  /** Current price in USD */
  price: number;
  
  /** 24h change percentage */
  change24h: number;
  
  /** Timestamp */
  timestamp: number;
}

/** Pyth price feed data structure */
export interface PythPriceFeed {
  /** Price feed ID */
  id: string;
  
  /** Current price */
  price: {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
  };
  
  /** EMA price */
  emaPrice?: {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
  };
}
