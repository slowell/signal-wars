'use client';

import { motion } from 'framer-motion';
import { Achievement } from '@/types';
import { Trophy, Star, Zap, Target, Flame, Award, Crown, Gem } from 'lucide-react';

interface AchievementShowcaseProps {
  achievements: Achievement[];
  compact?: boolean;
}

const rarityConfig = {
  common: {
    color: 'text-gray-400',
    bg: 'bg-gray-800/50',
    border: 'border-gray-700',
    glow: '',
  },
  rare: {
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]',
  },
  epic: {
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  },
  legendary: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    glow: 'shadow-[0_0_30px_rgba(250,204,21,0.4)]',
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  streak: <Flame className="w-5 h-5" />,
  rank: <Crown className="w-5 h-5" />,
  accuracy: <Target className="w-5 h-5" />,
  volume: <Zap className="w-5 h-5" />,
  special: <Star className="w-5 h-5" />,
};

export function AchievementShowcase({ achievements, compact = false }: AchievementShowcaseProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            whileHover={{ scale: 1.1 }}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${rarityConfig[achievement.rarity].bg}
              ${rarityConfig[achievement.rarity].border}
              border ${rarityConfig[achievement.rarity].glow}
              cursor-help
            `}
            title={`${achievement.name}: ${achievement.description}`}
          >
            <span className="text-lg">{achievement.icon}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {achievements.map((achievement, index) => {
        const config = rarityConfig[achievement.rarity];
        
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`
              p-4 rounded-xl border ${config.border} ${config.bg} ${config.glow}
              transition-all duration-300
            `}
          >
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                  bg-gray-900/50 border border-gray-700
                `}
              >
                {achievement.icon}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold ${config.color}`}>
                  {achievement.name}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {achievement.description}
                </p>
                
                <div className="flex items-center justify-between mt-3">
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full uppercase tracking-wide font-medium
                    ${config.color} bg-gray-900/50
                  `}>
                    {achievement.rarity}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(achievement.awardedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Achievement badge for inline display
export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const config = rarityConfig[achievement.rarity];
  
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${config.bg} ${config.color} border ${config.border}
      `}
    >
      <span>{achievement.icon}</span>
      {achievement.name}
    </motion.span>
  );
}

// Achievement progress for locked achievements
interface AchievementProgressProps {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  max: number;
}

export function AchievementProgress({
  name,
  description,
  icon,
  rarity,
  progress,
  max,
}: AchievementProgressProps) {
  const config = rarityConfig[rarity];
  const percentage = (progress / max) * 100;

  return (
    <div className={`
      p-4 rounded-xl border border-gray-800 bg-gray-900/30
      opacity-70
    `}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-800 text-gray-600">
          {icon}
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-gray-400">{name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className={config.color}>{progress}/{max}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  rarity === 'legendary' ? 'bg-yellow-500' :
                  rarity === 'epic' ? 'bg-purple-500' :
                  rarity === 'rare' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Achievement unlock animation
export function AchievementUnlock({ achievement }: { achievement: Achievement }) {
  const config = rarityConfig[achievement.rarity];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -50 }}
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        px-6 py-4 rounded-xl border ${config.border} ${config.bg} ${config.glow}
        flex items-center gap-4
      `}
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 1 }}
        className="text-4xl"
      >
        {achievement.icon}
      </motion.div>
      
      <div>
        <p className="text-sm text-gray-400">Achievement Unlocked!</p>
        <h4 className={`font-bold ${config.color}`}>{achievement.name}</h4>
        <p className="text-xs text-gray-500">{achievement.description}</p>
      </div>
    </motion.div>
  );
}
