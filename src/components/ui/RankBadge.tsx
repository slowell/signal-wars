'use client';

import { motion } from 'framer-motion';
import { Rank } from '@/types';
import { rankColors, rankBgColors, rankGlowColors, rankEmojis, rankProgression } from '@/lib/utils';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function RankBadge({ 
  rank, 
  size = 'md', 
  showLabel = true,
  animated = true,
  className = ''
}: RankBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
    xl: 'text-lg px-5 py-2',
  };

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <motion.span
      initial={animated ? { scale: 0, rotate: -180 } : false}
      animate={animated ? { scale: 1, rotate: 0 } : false}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold
        border-2 ${rankColors[rank]} ${rankGlowColors[rank]}
        ${sizeClasses[size]}
        bg-gray-900/50 backdrop-blur-sm
        ${className}
      `}
    >
      <span className={emojiSizes[size]}>{rankEmojis[rank]}</span>
      {showLabel && (
        <span className="uppercase tracking-wide">{rank}</span>
      )}
    </motion.span>
  );
}

interface RankProgressBarProps {
  currentRank: Rank;
  progress: number; // 0-100
  showTiers?: boolean;
  className?: string;
}

export function RankProgressBar({ 
  currentRank, 
  progress, 
  showTiers = true,
  className = ''
}: RankProgressBarProps) {
  const currentIndex = rankProgression.indexOf(currentRank);
  const nextRank = rankProgression[currentIndex + 1];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Rank Progress</span>
        {nextRank ? (
          <span className="text-gray-400">
            Next: <span className={rankColors[nextRank]}>{rankEmojis[nextRank]} {nextRank}</span>
          </span>
        ) : (
          <span className="text-legend">🔥 Max Rank Reached!</span>
        )}
      </div>
      
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`
            absolute inset-y-0 left-0 rounded-full
            bg-gradient-to-r from-bronze via-silver via-gold via-diamond to-legend
          `}
        />
        
        {/* Glow effect */}
        <div 
          className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white/20 to-transparent"
          style={{ left: `${progress - 5}%` }}
        />
      </div>

      {showTiers && (
        <div className="flex justify-between text-xs">
          {rankProgression.map((r, i) => (
            <motion.div
              key={r}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`
                flex flex-col items-center
                ${i <= currentIndex ? rankColors[r] : 'text-gray-600'}
              `}
            >
              <span className="text-base">{rankEmojis[r]}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Rank change indicator for leaderboard
interface RankChangeProps {
  previousRank: number;
  currentRank: number;
  className?: string;
}

export function RankChange({ previousRank, currentRank, className = '' }: RankChangeProps) {
  const change = previousRank - currentRank;
  
  if (change === 0) {
    return (
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-gray-500 text-sm ${className}`}
      >
        —
      </motion.span>
    );
  }

  const isUp = change > 0;
  
  return (
    <motion.span
      initial={{ opacity: 0, y: isUp ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-0.5 text-sm font-medium
        ${isUp ? 'text-green-400' : 'text-red-400'}
        ${className}
      `}
    >
      <motion.span
        animate={isUp ? { y: [0, -2, 0] } : { y: [0, 2, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {isUp ? '↑' : '↓'}
      </motion.span>
      {Math.abs(change)}
    </motion.span>
  );
}

// Animated rank up celebration
export function RankUpCelebration({ newRank }: { newRank: Rank }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="text-8xl mb-4"
        >
          {rankEmojis[newRank]}
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-white mb-2"
        >
          Rank Up!
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-full
            text-2xl font-bold border-2 ${rankColors[newRank]} ${rankGlowColors[newRank]}
            bg-gray-900
          `}
        >
          {newRank.toUpperCase()}
        </motion.div>
      </motion.div>

      {/* Confetti-like particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            x: 0, 
            y: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            opacity: 0,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400 - 200,
          }}
          transition={{ duration: 1.5, delay: i * 0.05 }}
          className={`
            absolute w-3 h-3 rounded-full
            ${rankBgColors[newRank]}
          `}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}
    </motion.div>
  );
}
