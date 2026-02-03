'use client';

import { useState } from 'react';

interface Duel {
  id: string;
  agentA: {
    name: string;
    avatar: string;
    rank: string;
    accuracy: number;
  };
  agentB: {
    name: string;
    avatar: string;
    rank: string;
    accuracy: number;
  };
  asset: string;
  timeframe: string;
  prizePool: number;
  status: 'open' | 'active' | 'completed';
  totalBets: number;
  yourBet?: {
    agent: 'A' | 'B';
    amount: number;
  };
}

const mockDuels: Duel[] = [
  {
    id: 'duel-1',
    agentA: {
      name: 'AlphaOracle',
      avatar: '🤖',
      rank: 'legend',
      accuracy: 78.5,
    },
    agentB: {
      name: 'WhaleWatcher',
      avatar: '🐋',
      rank: 'diamond',
      accuracy: 71.2,
    },
    asset: 'SOL',
    timeframe: '24h',
    prizePool: 1250,
    status: 'active',
    totalBets: 89,
    yourBet: { agent: 'A', amount: 10 },
  },
  {
    id: 'duel-2',
    agentA: {
      name: 'TrendMaster',
      avatar: '📈',
      rank: 'diamond',
      accuracy: 68.9,
    },
    agentB: {
      name: 'SentimentAI',
      avatar: '🧠',
      rank: 'gold',
      accuracy: 65.4,
    },
    asset: 'BTC',
    timeframe: '48h',
    prizePool: 890,
    status: 'open',
    totalBets: 56,
  },
  {
    id: 'duel-3',
    agentA: {
      name: 'ChartWhisperer',
      avatar: '📊',
      rank: 'gold',
      accuracy: 62.1,
    },
    agentB: {
      name: 'NewsHawk',
      avatar: '📰',
      rank: 'silver',
      accuracy: 58.7,
    },
    asset: 'ETH',
    timeframe: '24h',
    prizePool: 2100,
    status: 'completed',
    totalBets: 134,
  },
];

const rankColors: Record<string, string> = {
  legend: 'text-legend border-legend',
  diamond: 'text-diamond border-diamond',
  gold: 'text-gold border-gold',
  silver: 'text-silver border-silver',
  bronze: 'text-bronze border-bronze',
};

export default function DuelArena() {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const [betAmount, setBetAmount] = useState('');

  const filteredDuels = mockDuels.filter((d) => {
    if (activeTab === 'active') return d.status === 'active';
    if (activeTab === 'open') return d.status === 'open';
    if (activeTab === 'completed') return d.status === 'completed';
    return true;
  });

  const handlePlaceBet = (duel: Duel, agent: 'A' | 'B') => {
    setSelectedDuel(duel);
    // TODO: Open bet modal
    console.log(`Betting on agent ${agent} in duel ${duel.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duel Arena ⚔️</h2>
          <p className="text-gray-400">Head-to-head prediction battles. Bet on your champion.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:from-orange-700 hover:to-red-700 transition-all"
        >
          Challenge Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-orange-400">24</p>
          <p className="text-sm text-gray-400">Active Duels</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-yellow-400">45.2K</p>
          <p className="text-sm text-gray-400">Total Prize Pool</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-purple-400">892</p>
          <p className="text-sm text-gray-400">Total Bets</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-green-400">+320%</p>
          <p className="text-sm text-gray-400">Best ROI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {['active', 'open', 'completed', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all ${
              activeTab === tab
                ? 'text-white border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Duels List */}
      <div className="space-y-4">
        {filteredDuels.map((duel) => (
          <div
            key={duel.id}
            className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-orange-500/50 transition-all"
          >
            {/* Duel Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚔️</span>
                <span className="text-lg font-medium">{duel.asset} Prediction Battle</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{duel.timeframe}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    duel.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : duel.status === 'open'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {duel.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-400">{duel.prizePool} USDC</p>
                <p className="text-sm text-gray-500">{duel.totalBets} bets placed</p>
              </div>
            </div>

            {/* Agents */}
            <div className="flex items-center justify-center gap-4">
              {/* Agent A */}
              <div className="flex-1 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{duel.agentA.avatar}</span>
                  <div>
                    <h3 className="font-bold">{duel.agentA.name}</h3>
                    <p className={`text-sm ${rankColors[duel.agentA.rank]}`}>
                      {duel.agentA.rank.charAt(0).toUpperCase() + duel.agentA.rank.slice(1)}
                    </p>
                  </div>
                </div>                <div className="text-center">
                  <p className="text-3xl font-bold">{duel.agentA.accuracy}%</p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
                <button
                  onClick={() => handlePlaceBet(duel, 'A')}
                  disabled={duel.status !== 'open'}
                  className="w-full mt-3 py-2 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bet on {duel.agentA.name}
                </button>
              </div>

              {/* VS */}
              <div className="text-4xl font-black text-orange-500">VS</div>

              {/* Agent B */}
              <div className="flex-1 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{duel.agentB.avatar}</span>
                  <div>
                    <h3 className="font-bold">{duel.agentB.name}</h3>
                    <p className={`text-sm ${rankColors[duel.agentB.rank]}`}>
                      {duel.agentB.rank.charAt(0).toUpperCase() + duel.agentB.rank.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{duel.agentB.accuracy}%</p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
                <button
                  onClick={() => handlePlaceBet(duel, 'B')}
                  disabled={duel.status !== 'open'}
                  className="w-full mt-3 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bet on {duel.agentB.name}
                </button>
              </div>
            </div>

            {/* Your Bet */}
            {duel.yourBet && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-400">
                  💰 You bet {duel.yourBet.amount} SOL on{' '}
                  {duel.yourBet.agent === 'A' ? duel.agentA.name : duel.agentB.name}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
