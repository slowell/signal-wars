/**
 * Blockchain SDK Wrapper for API Routes
 * Server-side interactions with Signal Wars smart contracts
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
// import { SignalWars } from '../types/signal_wars';
import { 
  AgentProfile, 
  AgentStats, 
  AgentWithStats,
  AgentRank,
  Prediction,
  PredictionStatus,
  Duel,
  DuelStatus,
  Season,
  SeasonStatus,
  SeasonStanding,
  LeaderboardEntry,
} from './api-types';
import { ApiErrorException, ErrorCodes } from './api-utils';

// ============================================================================
// Configuration
// ============================================================================

const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
const PROGRAM_ID = process.env.SIGNAL_WARS_PROGRAM_ID 
  ? new PublicKey(process.env.SIGNAL_WARS_PROGRAM_ID)
  : null;

// ============================================================================
// Connection & Provider
// ============================================================================

let connection: Connection | null = null;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }
  return connection;
}

function getProvider(): AnchorProvider {
  const conn = getConnection();
  // Create a dummy wallet for read-only operations
  const dummyKeypair = new PublicKey('11111111111111111111111111111111');
  const wallet = new NodeWallet(new PublicKey(dummyKeypair) as any);
  
  return new AnchorProvider(conn, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}

// Mock program for development - returns null until deployed
function getProgram(): Program<any> | null {
  // Program not yet deployed - using mock data
  return null;
}

// ============================================================================
// Mock Data Generators (for development before contract deployment)
// ============================================================================

const MOCK_AGENTS: AgentWithStats[] = [
  {
    id: 'agent1',
    name: 'AlphaOracle',
    address: 'AlphaOracle111111111111111111111111111111111',
    owner: 'Owner111111111111111111111111111111111111111',
    rank: 'legend',
    tier: 5,
    avatar: '🤖',
    description: 'The ultimate prediction machine',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 1,
    stats: {
      totalPredictions: 342,
      correctPredictions: 269,
      accuracy: 78.5,
      currentStreak: 12,
      bestStreak: 24,
      totalStaked: '15000000000', // 15 SOL
      totalWon: '24500000000',
      totalLost: '8900000000',
      roi: 245,
      winRate: 78.5,
      reputationScore: 9850,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 80 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
      { id: 'streak_10', name: 'On Fire', description: 'Achieve a 10-win streak', icon: '🔥', unlockedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, progress: 10, maxProgress: 10 },
      { id: 'streak_25', name: 'Legendary', description: 'Achieve a 25-win streak', icon: '👑', unlockedAt: null, progress: 12, maxProgress: 25 },
    ],
  },
  {
    id: 'agent2',
    name: 'WhaleWatcher',
    address: 'WhaleWatcher2222222222222222222222222222222',
    owner: 'Owner222222222222222222222222222222222222222',
    rank: 'diamond',
    tier: 4,
    avatar: '🐋',
    description: 'Tracking the big moves',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 2,
    stats: {
      totalPredictions: 289,
      correctPredictions: 206,
      accuracy: 71.2,
      currentStreak: 8,
      bestStreak: 15,
      totalStaked: '12000000000',
      totalWon: '19800000000',
      totalLost: '7500000000',
      roi: 198,
      winRate: 71.2,
      reputationScore: 7820,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 50 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
      { id: 'streak_10', name: 'On Fire', description: 'Achieve a 10-win streak', icon: '🔥', unlockedAt: Date.now() - 20 * 24 * 60 * 60 * 1000, progress: 10, maxProgress: 10 },
    ],
  },
  {
    id: 'agent3',
    name: 'TrendMaster',
    address: 'TrendMaster3333333333333333333333333333333',
    owner: 'Owner333333333333333333333333333333333333333',
    rank: 'diamond',
    tier: 4,
    avatar: '📈',
    description: 'Riding the waves',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 3,
    stats: {
      totalPredictions: 412,
      correctPredictions: 284,
      accuracy: 68.9,
      currentStreak: 5,
      bestStreak: 18,
      totalStaked: '18000000000',
      totalWon: '16700000000',
      totalLost: '12000000000',
      roi: 167,
      winRate: 68.9,
      reputationScore: 6540,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 40 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
  {
    id: 'agent4',
    name: 'SentimentAI',
    address: 'SentimentAI44444444444444444444444444444444',
    owner: 'Owner444444444444444444444444444444444444444',
    rank: 'gold',
    tier: 3,
    avatar: '🧠',
    description: 'Reading the market mood',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 4,
    stats: {
      totalPredictions: 234,
      correctPredictions: 153,
      accuracy: 65.4,
      currentStreak: 3,
      bestStreak: 9,
      totalStaked: '8500000000',
      totalWon: '13400000000',
      totalLost: '5200000000',
      roi: 134,
      winRate: 65.4,
      reputationScore: 5210,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 25 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
  {
    id: 'agent5',
    name: 'ChartWhisperer',
    address: 'ChartWhisperer55555555555555555555555555555',
    owner: 'Owner555555555555555555555555555555555555555',
    rank: 'gold',
    tier: 3,
    avatar: '📊',
    description: 'Technical analysis expert',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 5,
    stats: {
      totalPredictions: 189,
      correctPredictions: 117,
      accuracy: 62.1,
      currentStreak: 4,
      bestStreak: 11,
      totalStaked: '6500000000',
      totalWon: '11200000000',
      totalLost: '4300000000',
      roi: 112,
      winRate: 62.1,
      reputationScore: 4450,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 20 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
  {
    id: 'agent6',
    name: 'NewsHawk',
    address: 'NewsHawk66666666666666666666666666666666666',
    owner: 'Owner666666666666666666666666666666666666666',
    rank: 'silver',
    tier: 2,
    avatar: '📰',
    description: 'News-based predictions',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 6,
    stats: {
      totalPredictions: 156,
      correctPredictions: 92,
      accuracy: 58.7,
      currentStreak: 2,
      bestStreak: 6,
      totalStaked: '4800000000',
      totalWon: '8900000000',
      totalLost: '3800000000',
      roi: 89,
      winRate: 58.7,
      reputationScore: 3120,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 15 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
  {
    id: 'agent7',
    name: 'MoonShot',
    address: 'MoonShot7777777777777777777777777777777777',
    owner: 'Owner777777777777777777777777777777777777777',
    rank: 'silver',
    tier: 2,
    avatar: '🚀',
    description: 'Always bullish',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 7,
    stats: {
      totalPredictions: 98,
      correctPredictions: 54,
      accuracy: 55.3,
      currentStreak: 1,
      bestStreak: 5,
      totalStaked: '3200000000',
      totalWon: '6700000000',
      totalLost: '2800000000',
      roi: 67,
      winRate: 55.3,
      reputationScore: 2340,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
  {
    id: 'agent8',
    name: 'DipBuyer',
    address: 'DipBuyer88888888888888888888888888888888888',
    owner: 'Owner888888888888888888888888888888888888888',
    rank: 'bronze',
    tier: 1,
    avatar: '💎',
    description: 'Buying every dip',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    isActive: true,
    globalRank: 8,
    stats: {
      totalPredictions: 76,
      correctPredictions: 40,
      accuracy: 52.1,
      currentStreak: 0,
      bestStreak: 4,
      totalStaked: '2100000000',
      totalWon: '3400000000',
      totalLost: '1900000000',
      roi: 34,
      winRate: 52.1,
      reputationScore: 1450,
    },
    achievements: [
      { id: 'first_win', name: 'First Blood', description: 'Win your first prediction', icon: '🩸', unlockedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, progress: 1, maxProgress: 1 },
    ],
  },
];

const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred1',
    agentId: 'agent1',
    agentName: 'AlphaOracle',
    seasonId: 'season1',
    asset: 'SOL',
    direction: 'up',
    targetPrice: 125.50,
    currentPrice: 118.20,
    confidence: 85,
    stakeAmount: '1000000000',
    timeframe: 60,
    status: 'resolved',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    revealedAt: Date.now() - 1.9 * 60 * 60 * 1000,
    resolvedAt: Date.now() - 0.5 * 60 * 60 * 1000,
    actualPrice: 126.80,
    wasCorrect: true,
    payout: '1800000000',
  },
  {
    id: 'pred2',
    agentId: 'agent2',
    agentName: 'WhaleWatcher',
    seasonId: 'season1',
    asset: 'BTC',
    direction: 'down',
    targetPrice: 42500,
    currentPrice: 43800,
    confidence: 72,
    stakeAmount: '2000000000',
    timeframe: 120,
    status: 'resolved',
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    revealedAt: Date.now() - 3.9 * 60 * 60 * 1000,
    resolvedAt: Date.now() - 1 * 60 * 60 * 1000,
    actualPrice: 42100,
    wasCorrect: true,
    payout: '3400000000',
  },
  {
    id: 'pred3',
    agentId: 'agent3',
    asset: 'ETH',
    agentName: 'TrendMaster',
    seasonId: 'season1',
    direction: 'up',
    targetPrice: 2650,
    currentPrice: 2580,
    confidence: 65,
    stakeAmount: '1500000000',
    timeframe: 90,
    status: 'committed',
    createdAt: Date.now() - 0.5 * 60 * 60 * 1000,
    revealedAt: null,
    resolvedAt: null,
    actualPrice: null,
    wasCorrect: null,
    payout: null,
  },
];

const MOCK_DUELS: Duel[] = [
  {
    id: 'duel1',
    challenger: {
      agentId: 'agent1',
      agentName: 'AlphaOracle',
      avatar: '🤖',
      predictionId: 'pred1',
      direction: 'up',
      stakeAmount: '5000000000',
      revealed: true,
    },
    opponent: {
      agentId: 'agent2',
      agentName: 'WhaleWatcher',
      avatar: '🐋',
      predictionId: 'pred2',
      direction: 'down',
      stakeAmount: '5000000000',
      revealed: true,
    },
    asset: 'SOL',
    totalStake: '10000000000',
    status: 'completed',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    startedAt: Date.now() - 23 * 60 * 60 * 1000,
    endedAt: Date.now() - 20 * 60 * 60 * 1000,
    winnerId: 'agent1',
    resolutionPrice: 126.80,
  },
  {
    id: 'duel2',
    challenger: {
      agentId: 'agent3',
      agentName: 'TrendMaster',
      avatar: '📈',
      stakeAmount: '3000000000',
      revealed: false,
    },
    opponent: {
      agentId: 'agent4',
      agentName: 'SentimentAI',
      avatar: '🧠',
      stakeAmount: '3000000000',
      revealed: false,
    },
    asset: 'BTC',
    totalStake: '6000000000',
    status: 'active',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    startedAt: Date.now() - 1.9 * 60 * 60 * 1000,
    endedAt: null,
    winnerId: null,
    resolutionPrice: null,
  },
];

const MOCK_SEASONS: Season[] = [
  {
    id: 'season1',
    seasonNumber: 1,
    name: 'Genesis Season',
    description: 'The first season of Signal Wars',
    status: 'active',
    entryFee: '1000000000',
    prizePool: '50000000000',
    prizePoolBps: 500, // 5%
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 60 * 24 * 60 * 60 * 1000,
    duration: 90,
    participantCount: 156,
    predictionCount: 4523,
    totalStaked: '125000000000',
  },
  {
    id: 'season2',
    seasonNumber: 2,
    name: 'Alpha Trials',
    description: 'Advanced strategies unleashed',
    status: 'upcoming',
    entryFee: '2000000000',
    prizePool: '100000000000',
    prizePoolBps: 500,
    startTime: Date.now() + 65 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 155 * 24 * 60 * 60 * 1000,
    duration: 90,
    participantCount: 0,
    predictionCount: 0,
    totalStaked: '0',
  },
  {
    id: 'season0',
    seasonNumber: 0,
    name: 'Beta Launch',
    description: 'Initial testing phase',
    status: 'completed',
    entryFee: '500000000',
    prizePool: '10000000000',
    prizePoolBps: 500,
    startTime: Date.now() - 120 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
    duration: 90,
    participantCount: 45,
    predictionCount: 1234,
    totalStaked: '25000000000',
  },
];

// ============================================================================
// SDK Functions
// ============================================================================

export async function fetchLeaderboard(
  sortBy: string = 'score',
  rank?: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  const program = getProgram();
  
  // If program is not available, return mock data
  if (!program) {
    let agents = [...MOCK_AGENTS];
    
    // Filter by rank
    if (rank && rank !== 'all') {
      agents = agents.filter(a => a.rank === rank);
    }
    
    // Sort
    agents.sort((a, b) => {
      switch (sortBy) {
        case 'accuracy': return b.stats.accuracy - a.stats.accuracy;
        case 'streak': return b.stats.currentStreak - a.stats.currentStreak;
        case 'roi': return b.stats.roi - a.stats.roi;
        case 'predictions': return b.stats.totalPredictions - a.stats.totalPredictions;
        case 'rank': return a.globalRank - b.globalRank;
        case 'score':
        default:
          // Calculate composite score
          const scoreA = a.stats.accuracy * 0.4 + a.stats.roi * 0.3 + a.stats.reputationScore / 100 * 0.3;
          const scoreB = b.stats.accuracy * 0.4 + b.stats.roi * 0.3 + b.stats.reputationScore / 100 * 0.3;
          return scoreB - scoreA;
      }
    });
    
    const entries: LeaderboardEntry[] = agents.slice(offset, offset + limit).map((agent, idx) => ({
      rank: offset + idx + 1,
      agent: {
        id: agent.id,
        name: agent.name,
        address: agent.address,
        owner: agent.owner,
        rank: agent.rank,
        tier: agent.tier,
        avatar: agent.avatar,
        description: agent.description,
        createdAt: agent.createdAt,
        isActive: agent.isActive,
      },
      stats: agent.stats,
      score: Math.round(agent.stats.accuracy * 0.4 + agent.stats.roi * 0.3 + agent.stats.reputationScore / 100 * 0.3),
    }));
    
    return { entries, total: agents.length };
  }
  
  // Real on-chain data fetching would go here
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain leaderboard fetching not yet implemented',
    501
  );
}

export async function fetchAgent(agentId: string): Promise<AgentWithStats | null> {
  const program = getProgram();
  
  if (!program) {
    const agent = MOCK_AGENTS.find(a => a.id === agentId || a.address === agentId);
    return agent || null;
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain agent fetching not yet implemented',
    501
  );
}

export async function fetchAgents(
  offset: number = 0,
  limit: number = 20,
  filters?: { rank?: string; search?: string; minAccuracy?: number }
): Promise<{ agents: AgentWithStats[]; total: number }> {
  const program = getProgram();
  
  if (!program) {
    let agents = [...MOCK_AGENTS];
    
    if (filters?.rank) {
      agents = agents.filter(a => a.rank === filters.rank);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      agents = agents.filter(a => 
        a.name.toLowerCase().includes(search) || 
        a.description?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.minAccuracy) {
      agents = agents.filter(a => a.stats.accuracy >= filters.minAccuracy!);
    }
    
    const total = agents.length;
    agents = agents.slice(offset, offset + limit);
    
    return { agents, total };
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain agents fetching not yet implemented',
    501
  );
}

export async function fetchPredictions(
  offset: number = 0,
  limit: number = 20,
  filters?: { agentId?: string; seasonId?: string; asset?: string; status?: string }
): Promise<{ predictions: Prediction[]; total: number }> {
  const program = getProgram();
  
  if (!program) {
    let predictions = [...MOCK_PREDICTIONS];
    
    if (filters?.agentId) {
      predictions = predictions.filter(p => p.agentId === filters.agentId);
    }
    
    if (filters?.seasonId) {
      predictions = predictions.filter(p => p.seasonId === filters.seasonId);
    }
    
    if (filters?.asset) {
      predictions = predictions.filter(p => p.asset === filters.asset);
    }
    
    if (filters?.status) {
      predictions = predictions.filter(p => p.status === filters.status);
    }
    
    // Sort by createdAt descending
    predictions.sort((a, b) => b.createdAt - a.createdAt);
    
    const total = predictions.length;
    predictions = predictions.slice(offset, offset + limit);
    
    return { predictions, total };
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain predictions fetching not yet implemented',
    501
  );
}

export async function createPrediction(
  agentId: string,
  asset: string,
  direction: 'up' | 'down',
  targetPrice: number,
  confidence: number,
  stakeAmount: string,
  timeframe: number
): Promise<Prediction> {
  const program = getProgram();
  
  if (!program) {
    // Mock creation - would submit to blockchain in production
    const agent = MOCK_AGENTS.find(a => a.id === agentId);
    if (!agent) {
      throw new ApiErrorException(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found', 404);
    }
    
    const newPrediction: Prediction = {
      id: `pred${Date.now()}`,
      agentId,
      agentName: agent.name,
      seasonId: 'season1',
      asset: asset as any,
      direction,
      targetPrice,
      currentPrice: targetPrice * (direction === 'up' ? 0.95 : 1.05),
      confidence,
      stakeAmount,
      timeframe,
      status: 'committed',
      createdAt: Date.now(),
      revealedAt: null,
      resolvedAt: null,
      actualPrice: null,
      wasCorrect: null,
      payout: null,
    };
    
    return newPrediction;
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain prediction creation not yet implemented',
    501
  );
}

export async function fetchDuels(
  offset: number = 0,
  limit: number = 20,
  filters?: { agentId?: string; status?: string; asset?: string }
): Promise<{ duels: Duel[]; total: number }> {
  const program = getProgram();
  
  if (!program) {
    let duels = [...MOCK_DUELS];
    
    if (filters?.agentId) {
      duels = duels.filter(d => 
        d.challenger.agentId === filters.agentId || 
        d.opponent.agentId === filters.agentId
      );
    }
    
    if (filters?.status) {
      duels = duels.filter(d => d.status === filters.status);
    }
    
    if (filters?.asset) {
      duels = duels.filter(d => d.asset === filters.asset);
    }
    
    // Sort by createdAt descending
    duels.sort((a, b) => b.createdAt - a.createdAt);
    
    const total = duels.length;
    duels = duels.slice(offset, offset + limit);
    
    return { duels, total };
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain duels fetching not yet implemented',
    501
  );
}

export async function createDuel(
  challengerAgentId: string,
  opponentAgentId: string,
  asset: string,
  stakeAmount: string
): Promise<Duel> {
  const program = getProgram();
  
  if (!program) {
    const challenger = MOCK_AGENTS.find(a => a.id === challengerAgentId);
    const opponent = MOCK_AGENTS.find(a => a.id === opponentAgentId);
    
    if (!challenger) {
      throw new ApiErrorException(ErrorCodes.AGENT_NOT_FOUND, 'Challenger agent not found', 404);
    }
    
    if (!opponent) {
      throw new ApiErrorException(ErrorCodes.AGENT_NOT_FOUND, 'Opponent agent not found', 404);
    }
    
    const newDuel: Duel = {
      id: `duel${Date.now()}`,
      challenger: {
        agentId: challenger.id,
        agentName: challenger.name,
        avatar: challenger.avatar,
        stakeAmount,
        revealed: false,
      },
      opponent: {
        agentId: opponent.id,
        agentName: opponent.name,
        avatar: opponent.avatar,
        stakeAmount,
        revealed: false,
      },
      asset: asset as any,
      totalStake: String(Number(stakeAmount) * 2),
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      winnerId: null,
      resolutionPrice: null,
    };
    
    return newDuel;
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain duel creation not yet implemented',
    501
  );
}

export async function fetchSeasons(): Promise<{ current: Season | null; upcoming: Season[]; past: Season[] }> {
  const program = getProgram();
  
  if (!program) {
    const current = MOCK_SEASONS.find(s => s.status === 'active') || null;
    const upcoming = MOCK_SEASONS.filter(s => s.status === 'upcoming');
    const past = MOCK_SEASONS.filter(s => s.status === 'completed');
    
    return { current, upcoming, past };
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain seasons fetching not yet implemented',
    501
  );
}

export async function fetchSeasonStandings(
  seasonId: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ standings: SeasonStanding[]; season: Season; total: number }> {
  const program = getProgram();
  
  if (!program) {
    const season = MOCK_SEASONS.find(s => s.id === seasonId);
    if (!season) {
      throw new ApiErrorException(ErrorCodes.SEASON_NOT_FOUND, 'Season not found', 404);
    }
    
    // Generate mock standings from agents
    const standings: SeasonStanding[] = MOCK_AGENTS
      .sort((a, b) => b.stats.reputationScore - a.stats.reputationScore)
      .slice(offset, offset + limit)
      .map((agent, idx) => ({
        rank: offset + idx + 1,
        agentId: agent.id,
        agentName: agent.name,
        avatar: agent.avatar,
        score: agent.stats.reputationScore,
        correctPredictions: agent.stats.correctPredictions,
        totalPredictions: agent.stats.totalPredictions,
        accuracy: agent.stats.accuracy,
        totalStaked: agent.stats.totalStaked,
        totalWon: agent.stats.totalWon,
        roi: agent.stats.roi,
      }));
    
    return { standings, season, total: MOCK_AGENTS.length };
  }
  
  throw new ApiErrorException(
    ErrorCodes.NOT_IMPLEMENTED,
    'On-chain season standings not yet implemented',
    501
  );
}
