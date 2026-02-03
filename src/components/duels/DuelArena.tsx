'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, Trophy, TrendingUp, Users, Zap, Plus,
  Filter, ChevronDown
} from 'lucide-react';

import { Duel, Agent } from '@/types';
import { DuelCard } from './DuelCard';
import { DuelCreationModal } from './DuelCreationModal';
import { DuelResults } from './DuelResults';
import { StatCard } from '@/components/ui/StatCard';
import { CountdownCompact } from '@/components/ui/Countdown';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/Skeleton';
import { useSuccessToast, useInfoToast } from '@/components/ui/Toast';

// Mock data
const mockDuels: Duel[] = [
  {
    id: 'duel-1',
    agentA: {
      id: 'agent-1',
      name: 'AlphaOracle',
      avatar: '🤖',
      rank: 'legend',
      accuracy: 78.5,
    },
    agentB: {
      id: 'agent-2',
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
    createdAt: '2026-02-01T10:00:00Z',
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    yourBet: { agent: 'A', amount: 10 },
    predictionA: { direction: 'up', targetPrice: 225, confidence: 85 },
    predictionB: { direction: 'up', targetPrice: 218, confidence: 72 },
  },
  {
    id: 'duel-2',
    agentA: {
      id: 'agent-3',
      name: 'TrendMaster',
      avatar: '📈',
      rank: 'diamond',
      accuracy: 68.9,
    },
    agentB: {
      id: 'agent-4',
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
    createdAt: '2026-02-02T08:00:00Z',
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'duel-3',
    agentA: {
      id: 'agent-5',
      name: 'ChartWhisperer',
      avatar: '📊',
      rank: 'gold',
      accuracy: 62.1,
    },
    agentB: {
      id: 'agent-6',
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
    createdAt: '2026-01-28T14:00:00Z',
    expiresAt: '2026-01-29T14:00:00Z',
    winner: 'A',
    finalPrice: 2450,
    predictionA: { direction: 'up', targetPrice: 2400, confidence: 75 },
    predictionB: { direction: 'down', targetPrice: 2300, confidence: 60 },
  },
  {
    id: 'duel-4',
    agentA: {
      id: 'agent-7',
      name: 'MoonShot',
      avatar: '🚀',
      rank: 'silver',
      accuracy: 55.3,
    },
    agentB: {
      id: 'agent-8',
      name: 'DipBuyer',
      avatar: '💎',
      rank: 'bronze',
      accuracy: 52.1,
    },
    asset: 'BONK',
    timeframe: '12h',
    prizePool: 450,
    status: 'open',
    totalBets: 23,
    createdAt: '2026-02-03T09:00:00Z',
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUserAgents: Agent[] = [
  { id: 'my-agent-1', name: 'AlphaOracle', rank: 'legend', accuracy: 78.5, streak: 12, predictions: 342, winRate: 0.785, roi: 245, avatar: '🤖' },
];

const mockOpponents: Agent[] = [
  { id: 'agent-2', name: 'WhaleWatcher', rank: 'diamond', accuracy: 71.2, streak: 8, predictions: 289, winRate: 0.712, roi: 198, avatar: '🐋' },
  { id: 'agent-4', name: 'SentimentAI', rank: 'gold', accuracy: 65.4, streak: 3, predictions: 234, winRate: 0.654, roi: 134, avatar: '🧠' },
  { id: 'agent-6', name: 'NewsHawk', rank: 'silver', accuracy: 58.7, streak: 2, predictions: 156, winRate: 0.587, roi: 89, avatar: '📰' },
  { id: 'agent-8', name: 'DipBuyer', rank: 'bronze', accuracy: 52.1, streak: 0, predictions: 76, winRate: 0.521, roi: 34, avatar: '💎' },
];

export default function DuelArena() {
  const [activeTab, setActiveTab] = useState<'active' | 'open' | 'completed' | 'all'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const [showResults, setShowResults] = useState(false);
  const showSuccess = useSuccessToast();
  const showInfo = useInfoToast();

  const filteredDuels = mockDuels.filter((d) => {
    if (activeTab === 'active') return d.status === 'active';
    if (activeTab === 'open') return d.status === 'open';
    if (activeTab === 'completed') return d.status === 'completed';
    return true;
  });

  const stats = {
    activeDuels: mockDuels.filter(d => d.status === 'active').length,
    totalPrizePool: mockDuels.reduce((acc, d) => acc + d.prizePool, 0),
    totalBets: mockDuels.reduce((acc, d) => acc + d.totalBets, 0),
    bestROI: 320,
  };

  const handleVote = (duelId: string, agent: 'A' | 'B') => {
    showSuccess('Vote Placed!', `You voted for Agent ${agent}`);
  };

  const handleViewDetails = (duel: Duel) => {
    if (duel.status === 'completed') {
      setSelectedDuel(duel);
      setShowResults(true);
    } else {
      setSelectedDuel(duel);
      // Could open a details modal for active/open duels
    }
  };

  const handleCreateDuel = (duelData: Partial<Duel>) => {
    showSuccess('Duel Created!', 'Your duel is now open for voting');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sword className="w-6 h-6 text-orange-500" />
              Duel Arena
            </h2>
            <p className="text-gray-400">Head-to-head prediction battles. Bet on your champion.</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:from-orange-700 hover:to-red-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Challenge Agent
          </motion.button>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Active Duels"
            value={stats.activeDuels}
            icon={<Zap className="w-5 h-5" />}
            color="orange"
          />
        </StaggerItem>
        
        <StaggerItem>
          <StatCard
            label="Total Prize Pool"
            value={`${(stats.totalPrizePool / 1000).toFixed(1)}K USDC`}
            icon={<Trophy className="w-5 h-5" />}
            color="yellow"
          />
        </StaggerItem>
        
        <StaggerItem>
          <StatCard
            label="Total Bets"
            value={stats.totalBets}
            icon={<Users className="w-5 h-5" />}
            color="purple"
          />
        </StaggerItem>
        
        <StaggerItem>
          <StatCard
            label="Best ROI"
            value={`+${stats.bestROI}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Filters */}
      <FadeIn delay={0.3}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 border-b border-gray-800">
            {(['active', 'open', 'completed', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 font-medium capitalize transition-all
                  ${activeTab === tab
                    ? 'text-white border-b-2 border-orange-500'
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm">
              <option>All Assets</option>
              <option>SOL</option>
              <option>BTC</option>
              <option>ETH</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Duels List */}
      <StaggerContainer staggerDelay={0.1} className="space-y-4">
        {filteredDuels.length === 0 ? (
          <StaggerItem>
            <div className="text-center py-12">
              <Sword className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No duels found in this category</p>
            </div>
          </StaggerItem>
        ) : (
          filteredDuels.map((duel) => (
            <StaggerItem key={duel.id}>
              <DuelCard
                duel={duel}
                onVote={handleVote}
                onViewDetails={handleViewDetails}
              />
            </StaggerItem>
          ))
        )}
      </StaggerContainer>

      {/* Modals */}
      <DuelCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateDuel={handleCreateDuel}
        userAgents={mockUserAgents}
        availableOpponents={mockOpponents}
      />

      <DuelResults
        duel={selectedDuel}
        isOpen={showResults}
        onClose={() => {
          setShowResults(false);
          setSelectedDuel(null);
        }}
        userBet={selectedDuel?.yourBet}
      />
    </div>
  );
}
