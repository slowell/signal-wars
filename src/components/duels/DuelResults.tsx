'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, TrendingUp, X, Share2, Twitter } from 'lucide-react';

import { Duel } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { RankBadge } from '@/components/ui/RankBadge';
import { formatCurrency } from '@/lib/utils';
import { useSuccessToast } from '@/components/ui/Toast';

interface DuelResultsProps {
  duel: Duel | null;
  isOpen: boolean;
  onClose: () => void;
  userBet?: { agent: 'A' | 'B'; amount: number };
}

export function DuelResults({ duel, isOpen, onClose, userBet }: DuelResultsProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const showToast = useSuccessToast();

  const userWon = userBet && duel?.winner && userBet.agent === duel.winner;
  const winnings = userWon ? userBet.amount * 1.9 : 0; // 95% of 2x (5% fee)

  useEffect(() => {
    if (isOpen && duel) {
      // Stagger the reveal animation
      setRevealed(false);
      setTimeout(() => setRevealed(true), 300);
      
      if (userWon) {
        setTimeout(() => {
          setShowConfetti(true);
          showToast('Congratulations!', `You won ${winnings.toFixed(2)} SOL`);
        }, 1500);
      }
    }
  }, [isOpen, duel, userWon, winnings, showToast]);

  if (!duel) return null;

  const winner = duel.winner === 'A' ? duel.agentA : duel.agentB;
  const loser = duel.winner === 'A' ? duel.agentB : duel.agentA;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton={true}
    >
      <div className="text-center">
        <AnimatePresence>
          {showConfetti && userWon && <Confetti />}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          
          <h2 className="text-3xl font-bold">Duel Complete!</h2>
          <p className="text-gray-400 mt-2">The battle has ended</p>
        </motion.div>

        {/* Winner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative p-6 rounded-2xl bg-gradient-to-b from-yellow-500/20 to-transparent border-2 border-yellow-500/50 mb-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <div className="bg-yellow-500 text-black px-4 py-1 rounded-full font-bold text-sm">
              🏆 WINNER
            </div>
          </motion.div>

          <div className="flex flex-col items-center">
            <AgentAvatar 
              agent={{ 
                ...winner, 
                id: winner.id, 
                predictions: 0, 
                streak: 0, 
                winRate: 0, 
                roi: 0 
              }} 
              size="lg" 
            />
            
            <h3 className="text-2xl font-bold mt-4">{winner.name}</h3>
            <RankBadge rank={winner.rank} size="md" className="mt-2" />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">Winning Accuracy</p>
              <p className="text-3xl font-bold text-green-400">{winner.accuracy}%</p>
            </div>
          </div>
        </motion.div>

        {/* Loser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <AgentAvatar 
            agent={{ 
              ...loser, 
              id: loser.id, 
              predictions: 0, 
              streak: 0, 
              winRate: 0, 
              roi: 0 
            }} 
            size="sm" 
            showGlow={false}
          />
          <div>
            <p className="text-gray-400">{loser.name}</p>
            <p className="text-sm text-gray-500">{loser.accuracy}% accuracy</p>
          </div>
        </motion.div>

        {/* Prize Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-4 bg-gray-800/50 rounded-xl mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400">Total Prize Pool</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {formatCurrency(duel.prizePool)}
          </p>
        </motion.div>

        {/* User Result */}
        {userBet && revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className={`
              p-6 rounded-xl mb-6
              ${userWon 
                ? 'bg-green-500/20 border-2 border-green-500/50' 
                : 'bg-red-500/10 border border-red-500/30'
              }
            `}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              {userWon ? (
                <>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-xl font-bold text-green-400">You Won! 🎉</span>
                </>
              ) : (
                <>
                  <X className="w-6 h-6 text-red-400" />
                  <span className="text-xl font-bold text-red-400">Better luck next time</span>
                </>
              )}
            </div>
            
            {userWon && (
              <>
                <p className="text-center text-gray-400">Your winnings</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: 'spring' }}
                  className="text-4xl font-bold text-green-400 text-center"
                >
                  +{winnings.toFixed(2)} SOL
                </motion.p>
              </>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-3"
        >
          <button
            onClick={() => {
              // Share functionality
              const text = userWon 
                ? `I just won ${winnings.toFixed(2)} SOL in a Signal Wars duel! 🎉`
                : `I participated in a Signal Wars duel between ${duel.agentA.name} and ${duel.agentB.name}! ⚔️`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex-1 px-4 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Share
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-all"
          >
            Close
          </button>
        </motion.div>
      </div>
    </Modal>
  );
}

// Confetti animation component
function Confetti() {
  const colors = ['#ffd700', '#ff6b35', '#8b5cf6', '#10b981', '#3b82f6'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
            y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
            scale: Math.random() * 0.5 + 0.5,
            rotate: Math.random() * 360,
          }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
            rotate: Math.random() * 720 - 360,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 rounded"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
        />
      ))}
    </div>
  );
}
