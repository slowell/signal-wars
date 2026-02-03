'use client';

import { motion } from 'framer-motion';
import { Agent } from '@/types';
import { RankBadge } from './RankBadge';
import { Sparkline } from './Charts';
import { MiniStat } from './StatCard';
import { shortenAddress, rankGlowColors } from '@/lib/utils';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  animate?: boolean;
}

export function AgentAvatar({ 
  agent, 
  size = 'md', 
  showGlow = true,
  animate = true
}: AgentAvatarProps) {
  const sizeClasses = {
    sm: 'text-3xl w-12 h-12',
    md: 'text-5xl w-20 h-20',
    lg: 'text-7xl w-28 h-28',
    xl: 'text-9xl w-40 h-40',
  };

  return (
    <motion.div
      initial={animate ? { scale: 0, rotate: -180 } : false}
      animate={animate ? { scale: 1, rotate: 0 } : false}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative rounded-full flex items-center justify-center
        bg-gradient-to-br from-gray-800 to-gray-900
        border-2 border-gray-700
        ${sizeClasses[size]}
        ${showGlow ? rankGlowColors[agent.rank] : ''}
      `}
    >
      <span className="select-none">{agent.avatar}</span>
      
      {/* Online indicator */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
    </motion.div>
  );
}

interface AgentHoverCardProps {
  agent: Agent;
  children: React.ReactNode;
}

export function AgentHoverCard({ agent, children }: AgentHoverCardProps) {
  // Generate mock sparkline data from agent stats
  const sparklineData = Array.from({ length: 10 }, (_, i) => {
    const variance = Math.sin(i * 0.8) * 10;
    return Math.max(0, Math.min(100, agent.accuracy + variance));
  });

  return (
    <div className="group relative">
      {children}
      
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="
          absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2
          w-72 p-4 rounded-xl
          bg-gray-900/95 backdrop-blur-xl
          border border-gray-700
          shadow-2xl
          opacity-0 group-hover:opacity-100
          pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-200
        "
      >
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-gray-900 border-r border-b border-gray-700 rotate-45" />
        
        <div className="flex items-start gap-3">
          <AgentAvatar agent={agent} size="sm" showGlow={false} animate={false} />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate">{agent.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <RankBadge rank={agent.rank} size="sm" showLabel={false} animated={false} />
              {agent.walletAddress && (
                <span className="text-xs text-gray-500">
                  {shortenAddress(agent.walletAddress)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="mt-3 h-8">
          <Sparkline data={sparklineData} color="#8b5cf6" height={32} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
          <MiniStat label="Accuracy" value={`${agent.accuracy}%`} />
          <MiniStat label="Win Rate" value={`${(agent.winRate * 100).toFixed(0)}%`} />
          <MiniStat label="ROI" value={`+${agent.roi}%`} />
        </div>

        {/* Recent streak */}
        {agent.currentStreak && agent.currentStreak > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-orange-400">🔥</span>
            <span className="text-sm text-gray-400">On a <span className="text-orange-400 font-medium">{agent.currentStreak}</span> prediction streak</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Agent mini card for compact layouts
interface AgentMiniCardProps {
  agent: Agent;
  onClick?: () => void;
  selected?: boolean;
}

export function AgentMiniCard({ agent, onClick, selected }: AgentMiniCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl
        border transition-all
        ${selected 
          ? 'bg-purple-500/20 border-purple-500' 
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
        }
      `}
    >
      <span className="text-3xl">{agent.avatar}</span>
      
      <div className="flex-1 text-left">
        <p className="font-bold text-white">{agent.name}</p>
        <p className="text-xs text-gray-400">{agent.accuracy}% accuracy</p>
      </div>
      
      <RankBadge rank={agent.rank} size="sm" showLabel={false} animated={false} />
    </motion.button>
  );
}
