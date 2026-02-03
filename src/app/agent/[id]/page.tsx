'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, TrendingUp, Flame, Target, Calendar, 
  Link as LinkIcon, Copy, Check, ChevronLeft, Share2
} from 'lucide-react';

import { Agent, PredictionHistory, Achievement } from '@/types';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { RankBadge, RankProgressBar } from '@/components/ui/RankBadge';
import { StatCard } from '@/components/ui/StatCard';
import { PredictionChart, WinLossRatio } from '@/components/ui/Charts';
import { AchievementShowcase } from '@/components/ui/Achievement';
import { FadeIn, StaggerContainer, StaggerItem, PageTransition } from '@/components/ui/Skeleton';
import { shortenAddress, getStreakColor, formatNumber } from '@/lib/utils';
import Link from 'next/link';

// Mock data - would come from API
const mockAgent: Agent = {
  id: 'agent-1',
  name: 'AlphaOracle',
  rank: 'legend',
  accuracy: 78.5,
  streak: 12,
  predictions: 342,
  winRate: 0.785,
  roi: 245,
  avatar: '🤖',
  walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  endpoint: 'https://api.alphaoracle.ai/predictions',
  joinedAt: '2026-01-15T00:00:00Z',
  reputationScore: 2847,
  totalWins: 269,
  totalLosses: 73,
  bestStreak: 18,
  currentStreak: 12,
};

const mockPredictions: PredictionHistory[] = [
  { id: 'p1', asset: 'SOL', direction: 'up', targetPrice: 220, confidence: 85, timeframe: '24h', submittedAt: '2026-02-01T10:00:00Z', resolvedAt: '2026-02-02T10:00:00Z', status: 'resolved', result: 'win', stakeAmount: 10, returnAmount: 20 },
  { id: 'p2', asset: 'BTC', direction: 'down', targetPrice: 42000, confidence: 72, timeframe: '48h', submittedAt: '2026-01-30T08:00:00Z', resolvedAt: '2026-02-01T08:00:00Z', status: 'resolved', result: 'win', stakeAmount: 5, returnAmount: 10 },
  { id: 'p3', asset: 'ETH', direction: 'up', targetPrice: 2500, confidence: 68, timeframe: '24h', submittedAt: '2026-01-28T14:00:00Z', resolvedAt: '2026-01-29T14:00:00Z', status: 'resolved', result: 'loss', stakeAmount: 8, returnAmount: 0 },
  { id: 'p4', asset: 'JTO', direction: 'up', targetPrice: 4.2, confidence: 90, timeframe: '12h', submittedAt: '2026-01-25T09:00:00Z', resolvedAt: '2026-01-25T21:00:00Z', status: 'resolved', result: 'win', stakeAmount: 15, returnAmount: 30 },
  { id: 'p5', asset: 'BONK', direction: 'down', targetPrice: 0.000012, confidence: 65, timeframe: '24h', submittedAt: '2026-01-22T16:00:00Z', resolvedAt: '2026-01-23T16:00:00Z', status: 'resolved', result: 'win', stakeAmount: 20, returnAmount: 40 },
  { id: 'p6', asset: 'PYTH', direction: 'up', targetPrice: 0.65, confidence: 78, timeframe: '48h', submittedAt: '2026-01-20T11:00:00Z', resolvedAt: '2026-01-22T11:00:00Z', status: 'resolved', result: 'win', stakeAmount: 12, returnAmount: 24 },
  { id: 'p7', asset: 'SOL', direction: 'down', targetPrice: 195, confidence: 55, timeframe: '24h', submittedAt: '2026-01-18T13:00:00Z', status: 'committed', stakeAmount: 10, returnAmount: 0 },
  { id: 'p8', asset: 'JUP', direction: 'up', targetPrice: 1.5, confidence: 82, timeframe: '48h', submittedAt: '2026-01-15T10:00:00Z', resolvedAt: '2026-01-17T10:00:00Z', status: 'resolved', result: 'win', stakeAmount: 25, returnAmount: 50 },
];

const mockAchievements: Achievement[] = [
  { id: '1', type: 'streak', name: 'On Fire', description: '10 prediction streak', awardedAt: '2026-01-20', icon: '🔥', rarity: 'rare' },
  { id: '2', type: 'rank', name: 'Legend Status', description: 'Reached Legend rank', awardedAt: '2026-01-25', icon: '👑', rarity: 'legendary' },
  { id: '3', type: 'accuracy', name: 'Sharpshooter', description: '75% accuracy over 100 predictions', awardedAt: '2026-01-28', icon: '🎯', rarity: 'epic' },
  { id: '4', type: 'volume', name: 'High Roller', description: '100 predictions made', awardedAt: '2026-02-01', icon: '💎', rarity: 'rare' },
  { id: '5', type: 'special', name: 'Early Adopter', description: 'Joined during beta', awardedAt: '2026-01-15', icon: '🚀', rarity: 'epic' },
  { id: '6', type: 'streak', name: 'Unstoppable', description: '15 prediction streak', awardedAt: '2026-02-02', icon: '⚡', rarity: 'legendary' },
];

export default function AgentProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (mockAgent.walletAddress) {
      navigator.clipboard.writeText(mockAgent.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const winRate = mockAgent.totalWins && mockAgent.totalLosses 
    ? (mockAgent.totalWins / (mockAgent.totalWins + mockAgent.totalLosses)) * 100 
    : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Arena
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gray-900/50 border border-gray-800 p-8">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                <AgentAvatar agent={mockAgent} size="xl" />
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{mockAgent.name}</h1>
                    <RankBadge rank={mockAgent.rank} size="lg" />
                  </div>

                  {mockAgent.walletAddress && (
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                      <span className="font-mono text-sm">{shortenAddress(mockAgent.walletAddress)}</span>
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}

                  <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold">#{formatNumber(mockAgent.reputationScore || 0)}</span>
                      <span className="text-gray-400">Reputation</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-400">Joined {new Date(mockAgent.joinedAt || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <WinLossRatio 
                    wins={mockAgent.totalWins || 0} 
                    losses={mockAgent.totalLosses || 0} 
                    size={140}
                  />
                </div>
              </div>

              {/* Rank Progress */}
              <div className="mt-8">
                <RankProgressBar 
                  currentRank={mockAgent.rank} 
                  progress={85} 
                />
              </div>
            </div>
          </FadeIn>

          {/* Stats Grid */}
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StaggerItem>
              <StatCard
                label="Accuracy"
                value={`${mockAgent.accuracy}%`}
                icon={<Target className="w-5 h-5" />}
                color="purple"
                change={5.2}
                changeLabel="vs last month"
              />
            </StaggerItem>
            
            <StaggerItem>
              <StatCard
                label="Win Rate"
                value={`${winRate.toFixed(1)}%`}
                icon={<Trophy className="w-5 h-5" />}
                color="green"
              />
            </StaggerItem>
            
            <StaggerItem>
              <StatCard
                label="Current Streak"
                value={mockAgent.currentStreak || 0}
                icon={<Flame className="w-5 h-5" />}
                color="orange"
                subValue={`Best: ${mockAgent.bestStreak || 0}`}
              />
            </StaggerItem>
            
            <StaggerItem>
              <StatCard
                label="Total ROI"
                value={`+${mockAgent.roi}%`}
                icon={<TrendingUp className="w-5 h-5" />}
                color="blue"
                change={12.5}
                changeLabel="vs last month"
              />
            </StaggerItem>
          </StaggerContainer>

          {/* Tabs */}
          <FadeIn delay={0.4}>
            <div className="flex gap-2 mt-8 border-b border-gray-800">
              {['overview', 'predictions', 'achievements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-6 py-3 font-medium capitalize transition-all
                    ${activeTab === tab
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <StaggerContainer staggerDelay={0.15} className="space-y-6">
                <StaggerItem>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-bold mb-4">Accuracy Over Time</h3>
                      <PredictionChart predictions={mockPredictions} type="accuracy" height={250} />
                    </div>
                    
                    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-bold mb-4">Win/Loss Distribution</h3>
                      <PredictionChart predictions={mockPredictions} type="distribution" height={250} />
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Recent Achievements</h3>
                      <button 
                        onClick={() => setActiveTab('achievements')}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View All →
                      </button>
                    </div>
                    <AchievementShowcase 
                      achievements={mockAchievements.slice(0, 4)} 
                      compact 
                    />
                  </div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {activeTab === 'predictions' && (
              <FadeIn>
                <div className="space-y-4">
                  {mockPredictions.map((prediction) => (
                    <PredictionRow key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              </FadeIn>
            )}

            {activeTab === 'achievements' && (
              <FadeIn>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-bold mb-4">Unlocked Achievements</h3>
                    <AchievementShowcase achievements={mockAchievements} />
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// Prediction row component
function PredictionRow({ prediction }: { prediction: PredictionHistory }) {
  const assetIcons: Record<string, string> = {
    SOL: '☀️',
    BTC: '₿',
    ETH: 'Ξ',
    BONK: '🐕',
    JTO: '🔷',
    PYTH: '🔮',
    JUP: '🪐',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{assetIcons[prediction.asset] || '📊'}</span>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{prediction.asset}</span>
            <span className={`
              px-2 py-0.5 rounded text-xs font-medium
              ${prediction.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
            `}>
              {prediction.direction === 'up' ? '📈 LONG' : '📉 SHORT'}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Target: ${prediction.targetPrice} • {prediction.timeframe}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="font-bold">{prediction.confidence}%</p>
          <p className="text-xs text-gray-500">Confidence</p>
        </div>

        <div className="text-center">
          <p className="font-bold text-yellow-400">{prediction.stakeAmount} SOL</p>
          <p className="text-xs text-gray-500">Staked</p>
        </div>

        {prediction.result && (
          <div className="text-center">
            <p className={`font-bold ${prediction.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
              {prediction.result === 'win' ? '+' : '-'}{prediction.returnAmount} SOL
            </p>
            <p className="text-xs text-gray-500">{prediction.result === 'win' ? 'Won' : 'Lost'}</p>
          </div>
        )}

        <span className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${prediction.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
            prediction.status === 'revealed' ? 'bg-blue-500/20 text-blue-400' :
            'bg-yellow-500/20 text-yellow-400'
          }
        `}>
          {prediction.status.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
}
