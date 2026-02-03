/**
 * Agent Personalities and Strategies
 * 
 * Defines distinct trading personas for demo agents with unique
 * behaviors, strategies, and decision-making patterns.
 */

import {
  AgentPersonalityType,
  PersonalityParams,
  AssetSymbol,
  PredictionDirection,
  AgentRank,
} from './types';

/** Pre-defined personality configurations */
export const PERSONALITY_CONFIGS: Record<AgentPersonalityType, PersonalityParams> = {
  aggressive: {
    baseConfidence: 75,
    confidenceVariance: 20,
    baseStake: 0.5,
    stakeRange: [0.3, 2.0],
    predictionFrequency: 3, // 3 predictions per hour
    preferredAssets: [
      { asset: 'SOL', weight: 30 },
      { asset: 'BONK', weight: 25 },
      { asset: 'WIF', weight: 25 },
      { asset: 'BTC', weight: 10 },
      { asset: 'ETH', weight: 10 },
    ],
    timeframeMinutes: 15,
    directionBias: 0.1, // Slight bullish bias
  },

  conservative: {
    baseConfidence: 45,
    confidenceVariance: 10,
    baseStake: 0.1,
    stakeRange: [0.05, 0.3],
    predictionFrequency: 0.5, // 1 prediction every 2 hours
    preferredAssets: [
      { asset: 'BTC', weight: 40 },
      { asset: 'ETH', weight: 35 },
      { asset: 'SOL', weight: 25 },
    ],
    timeframeMinutes: 60,
    directionBias: 0, // Neutral
  },

  random: {
    baseConfidence: 50,
    confidenceVariance: 50,
    baseStake: 0.2,
    stakeRange: [0.01, 0.5],
    predictionFrequency: 2,
    preferredAssets: [
      { asset: 'SOL', weight: 20 },
      { asset: 'BTC', weight: 20 },
      { asset: 'ETH', weight: 20 },
      { asset: 'JUP', weight: 20 },
      { asset: 'BONK', weight: 20 },
    ],
    timeframeMinutes: 30,
    directionBias: 0, // Completely random
  },

  'trend-follower': {
    baseConfidence: 60,
    confidenceVariance: 15,
    baseStake: 0.3,
    stakeRange: [0.1, 0.8],
    predictionFrequency: 2,
    preferredAssets: [
      { asset: 'SOL', weight: 30 },
      { asset: 'BTC', weight: 30 },
      { asset: 'ETH', weight: 25 },
      { asset: 'JUP', weight: 15 },
    ],
    timeframeMinutes: 30,
    directionBias: 0.3, // Follows trends (adjusted dynamically)
  },

  contrarian: {
    baseConfidence: 55,
    confidenceVariance: 20,
    baseStake: 0.25,
    stakeRange: [0.1, 0.6],
    predictionFrequency: 1.5,
    preferredAssets: [
      { asset: 'SOL', weight: 25 },
      { asset: 'BTC', weight: 25 },
      { asset: 'ETH', weight: 25 },
      { asset: 'BONK', weight: 25 },
    ],
    timeframeMinutes: 45,
    directionBias: -0.3, // Bets against trends (adjusted dynamically)
  },

  whale: {
    baseConfidence: 70,
    confidenceVariance: 10,
    baseStake: 2.0,
    stakeRange: [1.0, 5.0],
    predictionFrequency: 0.25, // Very rare predictions
    preferredAssets: [
      { asset: 'BTC', weight: 50 },
      { asset: 'ETH', weight: 30 },
      { asset: 'SOL', weight: 20 },
    ],
    timeframeMinutes: 120,
    directionBias: 0.05, // Slightly bullish
  },

  meme: {
    baseConfidence: 85, // Very confident (often wrong)
    confidenceVariance: 30,
    baseStake: 0.15,
    stakeRange: [0.05, 0.5],
    predictionFrequency: 4, // Very frequent
    preferredAssets: [
      { asset: 'BONK', weight: 40 },
      { asset: 'WIF', weight: 40 },
      { asset: 'SOL', weight: 20 },
    ],
    timeframeMinutes: 10, // Short-term moon shots
    directionBias: 0.6, // Very bullish on memes
  },

  analytical: {
    baseConfidence: 50,
    confidenceVariance: 5,
    baseStake: 0.2,
    stakeRange: [0.1, 0.4],
    predictionFrequency: 1,
    preferredAssets: [
      { asset: 'BTC', weight: 25 },
      { asset: 'ETH', weight: 25 },
      { asset: 'SOL', weight: 25 },
      { asset: 'JUP', weight: 25 },
    ],
    timeframeMinutes: 60,
    directionBias: 0, // Pure analysis, no bias
  },
};

/** Agent name generators by personality */
export const AGENT_NAMES: Record<AgentPersonalityType, string[]> = {
  aggressive: [
    'AlphaHunter',
    'LeverageLord',
    'MoonShot_Mike',
    'YOLO_Whisperer',
    'FOMO_King',
    'DegenDominator',
    'AllIn_Arthur',
    'RiskRider',
    'PumpChaser',
    'GammaGambler',
  ],
  conservative: [
    'SafeStacker',
    'HODL_Harry',
    'SteadySam',
    'SlowAndSteady',
    'DollarCostDan',
    'BondBot_Bob',
    'PatiencePete',
    'ValueVince',
    'PrudentPaul',
    'SecureSarah',
  ],
  random: [
    'ChaosCharlie',
    'DiceRoller_Dave',
    'RandomRandy',
    'FlipCoin_Fred',
    'Wildcard_Wendy',
    'Chaotic_Chris',
    'Erratic_Ed',
    'Unpredictable_Ursula',
    'MysteryMike',
    'EntropyEve',
  ],
  'trend-follower': [
    'MomentumMax',
    'TrendTracker_Tom',
    'FlowFollower',
    'WaveRider_Rick',
    'DirectionDan',
    'CurrentCarl',
    'SurfTheTrend',
    'MomentumMary',
    'TrendyTina',
    'FlowFinder',
  ],
  contrarian: [
    'InverseIvan',
    'ContrarianCarl',
    'AgainstTheGrain',
    'RebelRobot',
    'OppositeOliver',
    'CounterTrade_Cal',
    'SkepticSteve',
    'DoubtingDave',
    'ContrarianKate',
    'ReverseRachel',
  ],
  whale: [
    'DeepPockets_Dave',
    'MegaWhale_Mark',
    'BigStack_Brian',
    'LiquidityLord',
    'SizeMatters_Sam',
    'HeavyHitter_Hank',
    'BigBallin_Ben',
    'DeepStack_Dan',
    'CapitalChris',
    'WhaleWatcher_Walt',
  ],
  meme: [
    'DogeDisciple',
    'PepeProphet',
    'WIF_Wizard',
    'BONK_Believer',
    'MemeLord_Mike',
    'MoonBoy_Matt',
    'HodlMeme_Hank',
    'ShibaSeer',
    'CryptoComedian',
    'MemeMachine_Max',
  ],
  analytical: [
    'DataDriven_Dan',
    'ChartChampion',
    'QuantQuest_Quinn',
    'AlgoAce_Alex',
    'ModelMaster_Mike',
    'StatsSavant_Sam',
    'AnalysisAndy',
    'NumberNinja_Nick',
    'IndicatorIvan',
    'PatternPatty',
  ],
};

/** Agent descriptions by personality */
export const AGENT_DESCRIPTIONS: Record<AgentPersonalityType, string[]> = {
  aggressive: [
    'High-risk, high-reward. All gas, no brakes.',
    'Fortune favors the bold. And the leveraged.',
    'Why walk when you can sprint? Why predict when you can YOLO?',
    'Every candle is an opportunity to go all-in.',
    'Risk management is for the weak. Full send only.',
  ],
  conservative: [
    'Slow and steady wins the race. Safety first.',
    'Preserve capital, compound gains, sleep well.',
    'The tortoise beat the hare for a reason.',
    'Small wins add up. Risk is the enemy.',
    'Patience is a virtue, especially in crypto.',
  ],
  random: [
    'True randomness is the ultimate strategy.',
    'Let the blockchain decide my fate.',
    'Chaos is a ladder, and I am climbing.',
    'Unpredictable by design, profitable by accident.',
    'Sometimes the best strategy is no strategy.',
  ],
  'trend-follower': [
    'The trend is your friend until it bends.',
    'Ride the wave, catch the momentum.',
    'Flow with the market, never against it.',
    'Success follows momentum. I follow success.',
    'Buy high, sell higher. Trends persist.',
  ],
  contrarian: [
    'When others panic, I profit. Be fearful when others are greedy.',
    'The crowd is usually wrong. I bet against them.',
    'Buy the fear, sell the greed.',
    'Consensus is dangerous. I swim upstream.',
    'The best trades feel uncomfortable at first.',
  ],
  whale: [
    'Size moves markets. I am the market.',
    'Go big or go home. I choose big.',
    'When I enter, the market notices.',
    'Quality over quantity. Few trades, massive impact.',
    'Liquidity is my playground.',
  ],
  meme: [
    'In memes we trust, in pumps we thrust.',
    'Community is the strongest fundamental.',
    'WAGMI fam! To the moon and beyond!',
    'Doge father, meme master, bag holder.',
    'Fundamentals are temporary, memes are forever.',
  ],
  analytical: [
    'Data-driven decisions, algorithmic precision.',
    'Every prediction backed by rigorous analysis.',
    'Remove emotion, add math, profit follows.',
    'Patterns exist for those who look closely.',
    'Objective analysis in a subjective market.',
  ],
};

/** Rank calculation helper */
export function calculateRank(
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

/** Generate a random personality type */
export function getRandomPersonality(): AgentPersonalityType {
  const types: AgentPersonalityType[] = [
    'aggressive',
    'conservative',
    'random',
    'trend-follower',
    'contrarian',
    'whale',
    'meme',
    'analytical',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/** Select weighted random asset */
export function selectWeightedAsset(
  preferences: { asset: AssetSymbol; weight: number }[]
): AssetSymbol {
  const totalWeight = preferences.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pref of preferences) {
    random -= pref.weight;
    if (random <= 0) return pref.asset;
  }
  
  return preferences[0].asset;
}

/** Determine prediction direction based on personality and market conditions */
export function determineDirection(
  personality: AgentPersonalityType,
  priceChange24h: number,
  params: PersonalityParams
): PredictionDirection {
  // Random personality: completely random
  if (personality === 'random') {
    return Math.random() > 0.5 ? 'up' : 'down';
  }
  
  // Trend-follower: follow recent price movement
  if (personality === 'trend-follower') {
    return priceChange24h > 0 ? 'up' : 'down';
  }
  
  // Contrarian: bet against recent price movement
  if (personality === 'contrarian') {
    return priceChange24h > 0 ? 'down' : 'up';
  }
  
  // Meme: strongly bullish
  if (personality === 'meme') {
    return Math.random() > 0.3 ? 'up' : 'down'; // 70% bullish
  }
  
  // Others: use direction bias with some randomness
  const bias = params.directionBias;
  const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
  const combined = bias + randomFactor * 0.5;
  
  return combined > 0 ? 'up' : 'down';
}

/** Calculate stake amount based on personality and confidence */
export function calculateStake(
  personality: AgentPersonalityType,
  confidence: number,
  params: PersonalityParams
): number {
  const [min, max] = params.stakeRange;
  
  // Whale: always near max
  if (personality === 'whale') {
    return max * (0.8 + Math.random() * 0.2);
  }
  
  // Conservative: always near min
  if (personality === 'conservative') {
    return min * (1 + Math.random() * 0.5);
  }
  
  // Aggressive: stake more when confident
  if (personality === 'aggressive') {
    const confidenceFactor = confidence / 100;
    return min + (max - min) * confidenceFactor;
  }
  
  // Analytical: balanced approach
  if (personality === 'analytical') {
    const confidenceFactor = confidence / 100;
    return min + (max - min) * confidenceFactor * 0.8;
  }
  
  // Default: random within range weighted by confidence
  const confidenceFactor = confidence / 100;
  const base = min + (max - min) * confidenceFactor;
  const variance = (max - min) * 0.2;
  return base + (Math.random() - 0.5) * variance;
}
