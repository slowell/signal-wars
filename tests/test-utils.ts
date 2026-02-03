import * as anchor from '@coral-xyz/anchor';
import { PublicKey, BN } from '@coral-xyz/anchor';
import { createHash } from 'crypto';

/**
 * Test Utilities for Signal Wars
 * Helper functions for PDA derivation, prediction hashing, and test data generation
 */

// ==========================================
// PDA Derivation Helpers
// ==========================================

export function deriveArenaPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('arena')],
    programId
  );
}

export function deriveAgentPda(
  owner: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), owner.toBuffer()],
    programId
  );
}

export function deriveSeasonPda(
  seasonId: BN,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('season'), seasonId.toArrayLike(Buffer, 'le', 8)],
    programId
  );
}

export function deriveSeasonEntryPda(
  season: PublicKey,
  agent: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), season.toBuffer(), agent.toBuffer()],
    programId
  );
}

export function derivePredictionPda(
  agent: PublicKey,
  season: PublicKey,
  predictionCount: BN,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('prediction'),
      agent.toBuffer(),
      season.toBuffer(),
      predictionCount.toArrayLike(Buffer, 'le', 8),
    ],
    programId
  );
}

export function deriveSeasonVaultPda(
  season: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), season.toBuffer()],
    programId
  );
}

export function derivePredictionVaultPda(
  prediction: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('prediction_vault'), prediction.toBuffer()],
    programId
  );
}

export function deriveAchievementPda(
  agent: PublicKey,
  reputationScore: BN,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('achievement'),
      agent.toBuffer(),
      reputationScore.toArrayLike(Buffer, 'le', 8),
    ],
    programId
  );
}

// ==========================================
// Prediction Data Utilities
// ==========================================

export interface PredictionPayload {
  asset: string;
  direction: 'up' | 'down';
  targetPrice: number;
  confidence: number;
  timestamp?: number;
}

/**
 * Generate prediction hash (SHA-256)
 */
export function generatePredictionHash(predictionData: string): Buffer {
  const hash = createHash('sha256').update(predictionData).digest();
  return Buffer.from(hash);
}

/**
 * Generate prediction data JSON string
 */
export function generatePredictionData(
  asset: string,
  direction: 'up' | 'down',
  targetPrice: number,
  confidence: number
): string {
  return JSON.stringify({
    asset,
    direction,
    targetPrice,
    confidence,
    timestamp: Date.now(),
  });
}

/**
 * Generate complete prediction payload object
 */
export function generatePredictionPayload(
  asset: string,
  direction: 'up' | 'down',
  targetPrice: number,
  confidence: number
): PredictionPayload {
  return {
    asset,
    direction,
    targetPrice,
    confidence,
    timestamp: Date.now(),
  };
}

/**
 * Parse prediction data from JSON string
 */
export function parsePredictionData(data: string): PredictionPayload {
  return JSON.parse(data);
}

// ==========================================
// Test Data Constants
// ==========================================

export const TEST_CONSTANTS = {
  // SOL amounts
  ENTRY_FEE_LAMPORTS: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
  STAKE_AMOUNT_LAMPORTS: 0.05 * anchor.web3.LAMPORTS_PER_SOL,
  LARGE_STAKE_LAMPORTS: 1 * anchor.web3.LAMPORTS_PER_SOL,
  
  // Test durations
  DURATION_DAYS_DEFAULT: 7,
  DURATION_DAYS_SHORT: 0,
  
  // Basis points
  PRIZE_POOL_BPS_DEFAULT: 9000, // 90%
  PRIZE_POOL_BPS_FULL: 10000,   // 100%
  
  // String limits
  MAX_NAME_LENGTH: 32,
  MAX_ENDPOINT_LENGTH: 128,
  
  // Test agent data
  AGENT_NAMES: [
    'TestAgent',
    'AlphaTrader',
    'BetaBot',
    'GammaGuard',
    'DeltaDiver',
  ],
  
  ENDPOINT_URLS: [
    'https://api.testagent.com/predictions',
    'https://alpha.trader.com/api',
    'https://beta.bot.net/predict',
  ],
} as const;

// ==========================================
// Score Calculation Helpers
// ==========================================

/**
 * Calculate expected score for a prediction
 * Matches the on-chain calculation: stake * (100 + streak * 10) / 100
 */
export function calculateExpectedScore(stake: BN, streak: number): number {
  const streakMultiplier = 100 + streak * 10;
  return (stake.toNumber() * streakMultiplier) / 100;
}

/**
 * Calculate cumulative score for multiple winning predictions
 */
export function calculateCumulativeScore(
  stake: BN,
  numPredictions: number,
  startingStreak: number = 0
): number {
  let totalScore = 0;
  for (let i = 0; i < numPredictions; i++) {
    totalScore += calculateExpectedScore(stake, startingStreak + i);
  }
  return totalScore;
}

// ==========================================
// Rank Determination Helper
// ==========================================

export type Rank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';

/**
 * Determine expected rank based on performance
 * Matches on-chain rank calculation logic
 */
export function determineExpectedRank(
  totalPredictions: number,
  correctPredictions: number,
  bestStreak: number
): Rank {
  if (totalPredictions === 0) return 'bronze';
  
  const accuracy = (correctPredictions * 100) / totalPredictions;
  
  if (accuracy >= 80 && correctPredictions >= 50) return 'legend';
  if (accuracy >= 70 && bestStreak >= 10) return 'diamond';
  if (accuracy >= 60 && bestStreak >= 5) return 'gold';
  if (accuracy >= 50 && bestStreak >= 3) return 'silver';
  return 'bronze';
}

// ==========================================
// Error Code Helpers
// ==========================================

export const ERROR_CODES = {
  NameTooLong: 'Name too long',
  EndpointTooLong: 'Endpoint URL too long',
  InvalidPrizeSplit: 'Invalid prize split percentage',
  SeasonNotActive: 'Season not active',
  SeasonEnded: 'Season has ended',
  SeasonNotEnded: 'Season not ended yet',
  InvalidSeasonStatus: 'Invalid season status',
  InvalidPredictionStatus: 'Invalid prediction status',
  HashMismatch: 'Hash mismatch',
} as const;

// ==========================================
// Achievement Type Helpers
// ==========================================

export function getAchievementReputationValue(
  achievementType: string
): number {
  const values: Record<string, number> = {
    firstWin: 10,
    streak3: 25,
    streak5: 50,
    streak10: 100,
    rankSilver: 15,
    rankGold: 30,
    rankDiamond: 60,
    rankLegend: 100,
  };
  return values[achievementType] || 0;
}

// ==========================================
// Airdrop Helper
// ==========================================

export async function airdrop(
  provider: anchor.AnchorProvider,
  keypair: anchor.web3.Keypair,
  amount: number = 2
): Promise<void> {
  const signature = await provider.connection.requestAirdrop(
    keypair.publicKey,
    amount * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(signature);
}

// ==========================================
// Assertion Helpers
// ==========================================

/**
 * Verify prediction hash matches data
 */
export function verifyPredictionHash(
  predictionData: string,
  expectedHash: Buffer
): boolean {
  const computedHash = generatePredictionHash(predictionData);
  return computedHash.equals(expectedHash);
}

/**
 * Check if status is in expected state
 */
export function isStatusActive(status: any): boolean {
  return status && status.active !== undefined;
}

export function isStatusCompleted(status: any): boolean {
  return status && status.completed !== undefined;
}

export function isPredictionCommitted(status: any): boolean {
  return status && status.committed !== undefined;
}

export function isPredictionRevealed(status: any): boolean {
  return status && status.revealed !== undefined;
}

export function isPredictionResolved(status: any): boolean {
  return status && status.resolved !== undefined;
}
