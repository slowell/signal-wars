/**
 * Demo Agent Utilities
 * 
 * Helper functions for wallet generation, funding, price fetching,
 * and other common operations used in the demo simulation.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { AgentPersonalityType, AgentRank } from './types';

// node-fetch import for CommonJS compatibility
let fetch: typeof globalThis.fetch;
try {
  fetch = require('node-fetch');
} catch {
  fetch = globalThis.fetch;
}
import {
  DemoAgent,
  AssetSymbol,
  AssetPrice,
  AgentPrediction,
  PredictionDirection,
  PythPriceFeed,
} from './types';
import {
  PERSONALITY_CONFIGS,
  AGENT_NAMES,
  AGENT_DESCRIPTIONS,
  selectWeightedAsset,
  determineDirection,
  calculateStake,
} from './agent-personalities';
import * as anchor from '@coral-xyz/anchor';

/** Directory for storing generated wallets */
export const WALLETS_DIR = path.join(__dirname, '.wallets');

/** Ensure wallets directory exists */
export function ensureWalletsDir(): void {
  if (!fs.existsSync(WALLETS_DIR)) {
    fs.mkdirSync(WALLETS_DIR, { recursive: true });
  }
}

/** Generate a new agent with random personality */
export function generateAgent(id: string, personalityOverride?: string): DemoAgent {
  const keypair = Keypair.generate();
  
  // Use getRandomPersonality from agent-personalities
  const personalities: AgentPersonalityType[] = [
    'aggressive', 'conservative', 'random', 'trend-follower',
    'contrarian', 'whale', 'meme', 'analytical',
  ];
  const personality = (personalityOverride as AgentPersonalityType) || personalities[Math.floor(Math.random() * personalities.length)];
  
  const names = AGENT_NAMES[personality];
  const descriptions = AGENT_DESCRIPTIONS[personality];
  
  const name = names[Math.floor(Math.random() * names.length)];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // Ensure unique name by appending ID
  const uniqueName = `${name}_${id.slice(0, 4)}`;
  
  return {
    id,
    name: uniqueName,
    personality,
    keypair,
    description,
    balance: 0,
    stats: {
      totalPredictions: 0,
      correctPredictions: 0,
      streak: 0,
      bestStreak: 0,
      rank: 'Bronze',
      reputationScore: 0,
      totalStaked: 0,
      totalProfit: 0,
      winRate: 0,
    },
    isRegistered: false,
    hasEnteredSeason: false,
  };
}

/** Save agent wallet to file */
export function saveAgentWallet(agent: DemoAgent): void {
  ensureWalletsDir();
  
  const walletData = {
    id: agent.id,
    name: agent.name,
    personality: agent.personality,
    description: agent.description,
    publicKey: agent.keypair.publicKey.toBase58(),
    secretKey: Array.from(agent.keypair.secretKey),
    stats: agent.stats,
    createdAt: new Date().toISOString(),
  };
  
  const filePath = path.join(WALLETS_DIR, `agent-${agent.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
}

/** Load agent wallet from file */
export function loadAgentWallet(id: string): DemoAgent | null {
  const filePath = path.join(WALLETS_DIR, `agent-${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const secretKey = new Uint8Array(data.secretKey);
  const keypair = Keypair.fromSecretKey(secretKey);
  
  return {
    id: data.id,
    name: data.name,
    personality: data.personality,
    keypair,
    description: data.description,
    balance: 0,
    stats: data.stats,
    isRegistered: false,
    hasEnteredSeason: false,
  };
}

/** Load all saved agent wallets */
export function loadAllAgentWallets(): DemoAgent[] {
  ensureWalletsDir();
  
  const files = fs.readdirSync(WALLETS_DIR);
  const agents: DemoAgent[] = [];
  
  for (const file of files) {
    if (file.startsWith('agent-') && file.endsWith('.json')) {
      const id = file.replace('agent-', '').replace('.json', '');
      const agent = loadAgentWallet(id);
      if (agent) agents.push(agent);
    }
  }
  
  return agents;
}

/** Fund agent wallet via airdrop (devnet only) */
export async function fundWalletAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amountSol: number
): Promise<boolean> {
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amountSol * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    return true;
  } catch (error) {
    console.error(`Airdrop failed for ${publicKey.toBase58()}:`, error);
    return false;
  }
}

/** Fund agent wallet from a funded payer wallet */
export async function fundWalletTransfer(
  connection: Connection,
  payer: Keypair,
  recipient: PublicKey,
  amountSol: number
): Promise<boolean> {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient,
        lamports: amountSol * LAMPORTS_PER_SOL,
      })
    );
    
    const signature = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(signature, 'confirmed');
    return true;
  } catch (error) {
    console.error(`Transfer failed to ${recipient.toBase58()}:`, error);
    return false;
  }
}

/** Get wallet balance */
export async function getWalletBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error(`Failed to get balance for ${publicKey.toBase58()}:`, error);
    return 0;
  }
}

/** Fetch prices from Pyth Network */
export async function fetchPythPrices(): Promise<Record<AssetSymbol, AssetPrice>> {
  // Pyth price feed IDs for main assets
  const priceFeedIds: Record<AssetSymbol, string> = {
    SOL: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    BTC: '0xe62df6c8b4a85fe1f67ebb44ce7bf2e16e9eb2d7',
    ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    JUP: '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be920996',
    BONK: '0x72b0211ca21b16d55b5204f4e845c9637b71b76e',
    WIF: '0x4ca4be016f34e46b602d50d574c46f5d5b41f6e2',
  };
  
  const prices: Partial<Record<AssetSymbol, AssetPrice>> = {};
  
  try {
    // Fetch from Pyth Hermes API
    const ids = Object.values(priceFeedIds).join(',');
    const response = await fetch(
      `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${ids.replace(/,/g, '&ids[]=')}`
    );
    
    if (!response.ok) {
      throw new Error(`Pyth API error: ${response.status}`);
    }
    
    const feeds: PythPriceFeed[] = await response.json() as any;
    
    for (const [asset, feedId] of Object.entries(priceFeedIds)) {
      const feed = feeds.find(f => f.id === feedId);
      if (feed) {
        const price = parseInt(feed.price.price) * Math.pow(10, feed.price.expo);
        prices[asset as AssetSymbol] = {
          asset: asset as AssetSymbol,
          price,
          change24h: 0, // Would need historical data
          timestamp: feed.price.publishTime * 1000,
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch Pyth prices:', error);
    // Fallback to mock prices
    return getMockPrices();
  }
  
  return prices as Record<AssetSymbol, AssetPrice>;
}

/** Get mock prices for testing (fallback) */
export function getMockPrices(): Record<AssetSymbol, AssetPrice> {
  const now = Date.now();
  return {
    SOL: {
      asset: 'SOL',
      price: 105.42 + (Math.random() - 0.5) * 10,
      change24h: (Math.random() - 0.5) * 20,
      timestamp: now,
    },
    BTC: {
      asset: 'BTC',
      price: 98500 + (Math.random() - 0.5) * 5000,
      change24h: (Math.random() - 0.5) * 10,
      timestamp: now,
    },
    ETH: {
      asset: 'ETH',
      price: 2850 + (Math.random() - 0.5) * 200,
      change24h: (Math.random() - 0.5) * 15,
      timestamp: now,
    },
    JUP: {
      asset: 'JUP',
      price: 0.89 + (Math.random() - 0.5) * 0.2,
      change24h: (Math.random() - 0.5) * 30,
      timestamp: now,
    },
    BONK: {
      asset: 'BONK',
      price: 0.000025 + (Math.random() - 0.5) * 0.00001,
      change24h: (Math.random() - 0.5) * 50,
      timestamp: now,
    },
    WIF: {
      asset: 'WIF',
      price: 1.45 + (Math.random() - 0.5) * 0.5,
      change24h: (Math.random() - 0.5) * 40,
      timestamp: now,
    },
  };
}

/** Generate a prediction for an agent */
export function generatePrediction(
  agent: DemoAgent,
  prices: Record<AssetSymbol, AssetPrice>,
  predictionCount: number
): AgentPrediction {
  const params = PERSONALITY_CONFIGS[agent.personality];
  
  // Select asset based on preferences
  const asset = selectWeightedAsset(params.preferredAssets);
  const assetPrice = prices[asset];
  
  // Generate confidence with variance
  const confidenceVariance = (Math.random() - 0.5) * 2 * params.confidenceVariance;
  const confidence = Math.max(10, Math.min(99, params.baseConfidence + confidenceVariance));
  
  // Determine direction based on personality and market
  const direction = determineDirection(
    agent.personality,
    assetPrice.change24h,
    params
  );
  
  // Calculate stake
  const stakeSol = calculateStake(agent.personality, confidence, params);
  
  // Calculate target price based on direction and timeframe
  const priceChangePercent = (confidence / 100) * 5 * (direction === 'up' ? 1 : -1);
  const targetPrice = assetPrice.price * (1 + priceChangePercent / 100);
  
  // Create prediction data
  const predictionData = JSON.stringify({
    asset,
    direction,
    targetPrice: parseFloat(targetPrice.toFixed(asset === 'BONK' ? 10 : 2)),
    currentPrice: parseFloat(assetPrice.price.toFixed(asset === 'BONK' ? 10 : 2)),
    timeframe: `${params.timeframeMinutes}m`,
    confidence: parseFloat(confidence.toFixed(1)),
    timestamp: Date.now(),
    agent: agent.name,
  });
  
  // Create hash
  const predictionHash = Buffer.from(
    anchor.utils.sha256.hash(predictionData),
    'hex'
  );
  
  return {
    agentId: agent.id,
    asset,
    direction,
    targetPrice,
    currentPrice: assetPrice.price,
    confidence,
    stakeAmount: Math.floor(stakeSol * LAMPORTS_PER_SOL),
    timestamp: Date.now(),
    timeframe: params.timeframeMinutes,
    predictionHash,
    predictionData,
    status: 'Committed',
  };
}

/** Format SOL amount for display */
export function formatSol(lamports: number): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
}

/** Format timestamp for display */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/** Sleep utility */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Generate random ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** Calculate win rate */
export function calculateWinRate(correct: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((correct / total) * 100).toFixed(1));
}

/** Calculate agent rank based on performance */
function calculateAgentRank(
  totalPredictions: number,
  correctPredictions: number,
  bestStreak: number
): AgentRank {
  if (totalPredictions === 0) return 'Bronze';
  
  const accuracy = (correctPredictions / totalPredictions) * 100;
  
  if (accuracy >= 80 && correctPredictions >= 50) return 'Legend';
  if (accuracy >= 70 && bestStreak >= 10) return 'Diamond';
  if (accuracy >= 60 && bestStreak >= 5) return 'Gold';
  if (accuracy >= 50 && bestStreak >= 3) return 'Silver';
  return 'Bronze';
}

/** Update agent stats after prediction resolution */
export function updateAgentStats(
  agent: DemoAgent,
  wasCorrect: boolean,
  stakeAmount: number,
  wonAmount: number
): void {
  agent.stats.totalPredictions++;
  agent.stats.totalStaked += stakeAmount;
  
  if (wasCorrect) {
    agent.stats.correctPredictions++;
    agent.stats.streak++;
    agent.stats.totalProfit += wonAmount;
    
    if (agent.stats.streak > agent.stats.bestStreak) {
      agent.stats.bestStreak = agent.stats.streak;
    }
  } else {
    agent.stats.streak = 0;
    agent.stats.totalProfit -= stakeAmount;
  }
  
  agent.stats.winRate = calculateWinRate(
    agent.stats.correctPredictions,
    agent.stats.totalPredictions
  );
  
  // Update rank
  agent.stats.rank = calculateAgentRank(
    agent.stats.totalPredictions,
    agent.stats.correctPredictions,
    agent.stats.bestStreak
  );
}

/** Print agent summary table */
export function printAgentSummary(agents: DemoAgent[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('AGENT PERFORMANCE SUMMARY');
  console.log('='.repeat(100));
  console.log(
    `${'Name'.padEnd(20)} ${'Personality'.padEnd(15)} ${'Rank'.padEnd(10)} ${'Predictions'.padEnd(12)} ${'Win Rate'.padEnd(10)} ${'Streak'.padEnd(8)} ${'Profit (SOL)'.padEnd(15)}`
  );
  console.log('-'.repeat(100));
  
  // Sort by profit
  const sorted = [...agents].sort((a, b) => b.stats.totalProfit - a.stats.totalProfit);
  
  for (const agent of sorted) {
    const profitStr = (agent.stats.totalProfit / LAMPORTS_PER_SOL).toFixed(4);
    const profitFormatted = agent.stats.totalProfit >= 0 
      ? `+${profitStr}` 
      : profitStr;
    
    console.log(
      `${agent.name.slice(0, 20).padEnd(20)} ` +
      `${agent.personality.padEnd(15)} ` +
      `${agent.stats.rank.padEnd(10)} ` +
      `${`${agent.stats.correctPredictions}/${agent.stats.totalPredictions}`.padEnd(12)} ` +
      `${`${agent.stats.winRate}%`.padEnd(10)} ` +
      `${agent.stats.streak.toString().padEnd(8)} ` +
      `${profitFormatted.padEnd(15)}`
    );
  }
  
  console.log('='.repeat(100));
}
