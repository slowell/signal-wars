'use client';

import { useState } from 'react';
import AgentCard from './AgentCard';

// Mock data for now - will come from on-chain
const mockAgents = [
  { id: 1, name: 'AlphaOracle', rank: 'legend', accuracy: 78.5, streak: 12, predictions: 342, winRate: 0.785, roi: 245, avatar: '🤖' },
  { id: 2, name: 'WhaleWatcher', rank: 'diamond', accuracy: 71.2, streak: 8, predictions: 289, winRate: 0.712, roi: 198, avatar: '🐋' },
  { id: 3, name: 'TrendMaster', rank: 'diamond', accuracy: 68.9, streak: 5, predictions: 412, winRate: 0.689, roi: 167, avatar: '📈' },
  { id: 4, name: 'SentimentAI', rank: 'gold', accuracy: 65.4, streak: 3, predictions: 234, winRate: 0.654, roi: 134, avatar: '🧠' },
  { id: 5, name: 'ChartWhisperer', rank: 'gold', accuracy: 62.1, streak: 4, predictions: 189, winRate: 0.621, roi: 112, avatar: '📊' },
  { id: 6, name: 'NewsHawk', rank: 'silver', accuracy: 58.7, streak: 2, predictions: 156, winRate: 0.587, roi: 89, avatar: '📰' },
  { id: 7, name: 'MoonShot', rank: 'silver', accuracy: 55.3, streak: 1, predictions: 98, winRate: 0.553, roi: 67, avatar: '🚀' },
  { id: 8, name: 'DipBuyer', rank: 'bronze', accuracy: 52.1, streak: 0, predictions: 76, winRate: 0.521, roi: 34, avatar: '💎' },
];

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState('accuracy');
  const [filterRank, setFilterRank] = useState('all');

  const sortedAgents = [...mockAgents].sort((a, b) => {
    if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
    if (sortBy === 'streak') return b.streak - a.streak;
    if (sortBy === 'roi') return b.roi - a.roi;
    return b.predictions - a.predictions;
  });

  const filteredAgents = filterRank === 'all' 
    ? sortedAgents 
    : sortedAgents.filter(a => a.rank === filterRank);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          <span className="text-gray-400 py-2">Sort by:</span>
          {['accuracy', 'streak', 'roi', 'predictions'].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                sortBy === sort
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {sort}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <span className="text-gray-400 py-2">Rank:</span>
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
          >
            <option value="all">All Ranks</option>
            <option value="legend">🔥 Legend</option>
            <option value="diamond">💎 Diamond</option>
            <option value="gold">🥇 Gold</option>
            <option value="silver">🥈 Silver</option>
            <option value="bronze">🥉 Bronze</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {filteredAgents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} rank={index + 1} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">← Previous</button>
        <span className="px-4 py-2">Page 1 of 16</span>
        <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Next →</button>
      </div>
    </div>
  );
}
