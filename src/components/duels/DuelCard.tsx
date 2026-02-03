'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Clock, Users, ChevronRight, Trophy,
  TrendingUp, TrendingDown, Target, Zap
} from 'lucide-react';

import { Duel } from '@/types';
import { CountdownTimer, CountdownCompact, LiveIndicator } from '@/components/ui/Countdown';
import { RankBadge } from '@/components/ui/RankBadge';
import { AgentAvatar, AgentHoverCard } from '@/components/ui/AgentAvatar';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { assetIcons, formatCurrency, shortenAddress } from '@/lib/utils';

interface DuelCardProps {
  duel: Duel;
  onVote?: (duelId: string, agent: 'A' | 'B') => void;
  onViewDetails?: (duel: Duel) => void;
  compact?: boolean;
}

export function DuelCard({ duel, onVote, onViewDetails, compact = false }: DuelCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [votingFor, setVotingFor] = useState<'A' | 'B' | null>(null);

  const handleVote = (agent: 'A' | 'B') => {
    setVotingFor(agent);
    setTimeout(() => {
      onVote?.(duel.id, agent);
      setVotingFor(null);
    }, 500);
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => onViewDetails?.(duel)}
        className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-orange-500/50 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{assetIcons[duel.asset] || '📊'}</span>
            <div>
              <p className="font-bold">{duel.asset} Battle</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{duel.agentA.name}</span>
                <span className="text-orange-500">vs</span>
                <span>{duel.agentB.name}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-yellow-400">{formatCurrency(duel.prizePool)}</p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              <CountdownCompact targetDate={duel.expiresAt} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isExpired = new Date(duel.expiresAt) < new Date();
  const winner = duel.winner ? (duel.winner === 'A' ? duel.agentA : duel.agentB) : null;

  return (
    <>
      <motion.div
        layoutId={`duel-${duel.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        className={`
          relative overflow-hidden rounded-2xl border
          ${duel.status === 'active' ? 'border-orange-500/30 bg-orange-500/5' : ''}
          ${duel.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : ''}
          ${duel.status === 'open' ? 'border-gray-800 bg-gray-900/50' : ''}
          transition-all
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <span className="text-2xl">{assetIcons[duel.asset] || '📊'}</span>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">{duel.asset} Prediction Battle</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">{duel.timeframe}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">{duel.totalBets} bets</span>
                  {duel.status === 'active' && <LiveIndicator />}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-400">{formatCurrency(duel.prizePool)}</p>
              {duel.status !== 'completed' && (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <CountdownCompact targetDate={duel.expiresAt} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agents */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Agent A */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`
                flex-1 p-4 rounded-xl border-2 transition-all
                ${duel.winner === 'A' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800/30'}
                ${duel.yourBet?.agent === 'A' ? 'ring-2 ring-purple-500' : ''}
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <AgentHoverCard agent={{ ...duel.agentA, id: duel.agentA.id, predictions: 0, streak: 0, winRate: 0, roi: 0 }}>
                  <AgentAvatar agent={{ ...duel.agentA, id: duel.agentA.id, predictions: 0, streak: 0, winRate: 0, roi: 0 }} size="md" />
                </AgentHoverCard>
                
                <div>
                  <h4 className="font-bold">{duel.agentA.name}</h4>
                  <RankBadge rank={duel.agentA.rank} size="sm" />
                </div>
              </div>

              {duel.predictionA && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    {duel.predictionA.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">${duel.predictionA.targetPrice}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${duel.predictionA.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{duel.predictionA.confidence}% confidence</p>
                </div>
              )}

              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{duel.agentA.accuracy}%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>

              {duel.status === 'open' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote('A')}
                  disabled={votingFor !== null}
                  className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {votingFor === 'A' ? 'Voting...' : `Vote ${duel.agentA.name}`}
                </motion.button>
              )}

              {duel.yourBet?.agent === 'A' && (
                <div className="mt-3 p-2 bg-purple-500/20 rounded-lg text-center">
                  <p className="text-sm text-purple-400">💰 You bet {duel.yourBet.amount} SOL</p>
                </div>
              )}

              {duel.winner === 'A' && (
                <div className="mt-3 flex items-center justify-center gap-2 text-green-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">Winner!</span>
                </div>
              )}
            </motion.div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-orange-500">VS</span>
              {duel.status === 'active' && (
                <CountdownTimer 
                  targetDate={duel.expiresAt} 
                  size="sm"
                  showLabels={false}
                />
              )}
            </div>

            {/* Agent B */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`
                flex-1 p-4 rounded-xl border-2 transition-all
                ${duel.winner === 'B' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800/30'}
                ${duel.yourBet?.agent === 'B' ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <AgentHoverCard agent={{ ...duel.agentB, id: duel.agentB.id, predictions: 0, streak: 0, winRate: 0, roi: 0 }}>
                  <AgentAvatar agent={{ ...duel.agentB, id: duel.agentB.id, predictions: 0, streak: 0, winRate: 0, roi: 0 }} size="md" />
                </AgentHoverCard>
                
                <div>
                  <h4 className="font-bold">{duel.agentB.name}</h4>
                  <RankBadge rank={duel.agentB.rank} size="sm" />
                </div>
              </div>

              {duel.predictionB && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    {duel.predictionB.direction === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">${duel.predictionB.targetPrice}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${duel.predictionB.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{duel.predictionB.confidence}% confidence</p>
                </div>
              )}

              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{duel.agentB.accuracy}%</p>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>

              {duel.status === 'open' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote('B')}
                  disabled={votingFor !== null}
                  className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {votingFor === 'B' ? 'Voting...' : `Vote ${duel.agentB.name}`}
                </motion.button>
              )}

              {duel.yourBet?.agent === 'B' && (
                <div className="mt-3 p-2 bg-blue-500/20 rounded-lg text-center">
                  <p className="text-sm text-blue-400">💰 You bet {duel.yourBet.amount} SOL</p>
                </div>
              )}

              {duel.winner === 'B' && (
                <div className="mt-3 flex items-center justify-center gap-2 text-green-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">Winner!</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-800/50">
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Duel Details"
        maxWidth="lg"
      >
        <DuelDetails duel={duel} />
      </Modal>
    </>
  );
}

// Duel Details Component
function DuelDetails({ duel }: { duel: Duel }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Prize Pool"
          value={formatCurrency(duel.prizePool)}
          color="yellow"
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard
          label="Total Bets"
          value={duel.totalBets}
          color="blue"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h4 className="font-bold mb-4">Duel Timeline</h4>
        <div className="space-y-3">
          <TimelineItem
            time={new Date(duel.createdAt).toLocaleString()}
            label="Duel Created"
            isActive={true}
          />
          <TimelineItem
            time={new Date(duel.expiresAt).toLocaleString()}
            label="Voting Closes"
            isActive={duel.status !== 'open'}
          />
          
          {duel.status === 'completed' && (
            <TimelineItem
              time="Completed"
              label={`Winner: ${duel.winner === 'A' ? duel.agentA.name : duel.agentB.name}`}
              isActive={true}
              isSuccess={true}
            />
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h4 className="font-bold mb-4">Rules</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Winner determined by prediction accuracy at duel end</li>
          <li>• Minimum bet: 1 SOL</li>
          <li>• Prize pool distributed proportionally to winning bets</li>
          <li>• 5% platform fee applies</li>
        </ul>
      </div>
    </div>
  );
}

function TimelineItem({ 
  time, 
  label, 
  isActive, 
  isSuccess 
}: { 
  time: string; 
  label: string; 
  isActive: boolean;
  isSuccess?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-3 h-3 rounded-full
        ${isSuccess ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-gray-600'}
      `} />
      <div>
        <p className="text-sm text-gray-500">{time}</p>
        <p className={`text-sm ${isSuccess ? 'text-green-400 font-medium' : 'text-white'}`}>
          {label}
        </p>
      </div>
    </div>
  );
}
