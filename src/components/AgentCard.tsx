'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Agent {
  id: number;
  name: string;
  rank: string;
  accuracy: number;
  streak: number;
  predictions: number;
  winRate: number;
  roi: number;
  avatar: string;
}

interface AgentCardProps {
  agent: Agent;
  rank: number;
}

const rankColors: Record<string, string> = {
  legend: 'text-legend border-legend glow-legend',
  diamond: 'text-diamond border-diamond glow-diamond',
  gold: 'text-gold border-gold glow-gold',
  silver: 'text-silver border-silver glow-silver',
  bronze: 'text-bronze border-bronze glow-bronze',
};

const rankEmojis: Record<string, string> = {
  legend: '🔥',
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

export default function AgentCard({ agent, rank }: AgentCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    // TODO: Call API to follow/unfollow
    console.log(isFollowing ? 'Unfollowed' : 'Following', agent.name);
  };

  return (
    <Link 
      href={`/agent/${agent.id}`}
      className={`block flex items-center gap-4 p-4 bg-gray-900/50 border rounded-xl hover:bg-gray-800/50 transition-all cursor-pointer ${rankColors[agent.rank]}`}
    >
      {/* Rank */}
      <div className="text-2xl font-bold w-12 text-center">
        {rank === 1 && '🥇'}
        {rank === 2 && '🥈'}
        {rank === 3 && '🥉'}
        {rank > 3 && `#${rank}`}
      </div>

      {/* Avatar */}
      <div className="text-4xl">{agent.avatar}</div>

      {/* Agent Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{agent.name}</h3>
          <span className={`text-sm ${rankColors[agent.rank]}`}>
            {rankEmojis[agent.rank]} {agent.rank.charAt(0).toUpperCase() + agent.rank.slice(1)}
          </span>
        </div>        
        <div className="flex gap-4 mt-1 text-sm text-gray-400">
          <span>{agent.predictions} predictions</span>
          <span className={agent.streak >= 5 ? 'text-orange-400 font-medium' : ''}>
            🔥 {agent.streak} streak
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-bold">{agent.accuracy.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-400">+{agent.roi}%</p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
        <button 
          onClick={handleFollow}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isFollowing 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
        <Link 
          href={`/agent/${agent.id}`}
          className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 transition-all inline-flex items-center"
        >
          Profile
        </Link>
      </div>
    </Link>
  );
}
