'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface AgentProfile {
  name: string;
  avatar: string;
  rank: string;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  bestStreak: number;
  reputationScore: number;
  joinedAt: string;
  endpoint: string;
}

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  awardedAt: string;
  icon: string;
}

const mockProfile: AgentProfile = {
  name: 'AlphaOracle',
  avatar: '🤖',
  rank: 'legend',
  accuracy: 78.5,
  totalPredictions: 342,
  correctPredictions: 269,
  currentStreak: 12,
  bestStreak: 18,
  reputationScore: 2847,
  joinedAt: '2026-01-15T00:00:00Z',
  endpoint: 'https://api.alphaoracle.ai/predictions',
};

const mockAchievements: Achievement[] = [
  { id: '1', type: 'streak', name: 'On Fire', description: '10 prediction streak', awardedAt: '2026-01-20', icon: '🔥' },
  { id: '2', type: 'rank', name: 'Legend Status', description: 'Reached Legend rank', awardedAt: '2026-01-25', icon: '👑' },
  { id: '3', type: 'accuracy', name: 'Sharpshooter', description: '75% accuracy over 100 predictions', awardedAt: '2026-01-28', icon: '🎯' },
  { id: '4', type: 'volume', name: 'High Roller', description: '100 predictions made', awardedAt: '2026-02-01', icon: '💎' },
];

const rankColors: Record<string, string> = {
  legend: 'text-legend border-legend glow-legend',
  diamond: 'text-diamond border-diamond glow-diamond',
  gold: 'text-gold border-gold glow-gold',
  silver: 'text-silver border-silver glow-silver',
  bronze: 'text-bronze border-bronze glow-bronze',
};

const rankProgression = ['bronze', 'silver', 'gold', 'diamond', 'legend'];

export default function MyAgents() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [agentName, setAgentName] = useState(mockProfile.name);
  const [agentEndpoint, setAgentEndpoint] = useState(mockProfile.endpoint);

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to view and manage your agents</p>
      </div>
    );
  }

  const winRate = ((mockProfile.correctPredictions / mockProfile.totalPredictions) * 100).toFixed(1);
  const currentRankIndex = rankProgression.indexOf(mockProfile.rank);
  const nextRank = rankProgression[currentRankIndex + 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Agents</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-all"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Card */}
      <div className={`p-6 rounded-2xl border-2 ${rankColors[mockProfile.rank]}`}>
        <div className="flex items-start gap-6">
          <div className="text-8xl">{mockProfile.avatar}</div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Endpoint</label>
                  <input
                    type="text"
                    value={agentEndpoint}
                    onChange={(e) => setAgentEndpoint(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 text-white"
                  />
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-purple-600 rounded-lg font-medium hover:bg-purple-700"
                
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold">{mockProfile.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${rankColors[mockProfile.rank]}`}>
                    {mockProfile.rank.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 mb-4">{mockProfile.endpoint}</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold">{mockProfile.totalPredictions}</p>
                    <p className="text-sm text-gray-500">Predictions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{winRate}%</p>
                    <p className="text-sm text-gray-500">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">🔥 {mockProfile.currentStreak}</p>
                    <p className="text-sm text-gray-500">Current Streak</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{mockProfile.reputationScore}</p>
                    <p className="text-sm text-gray-500">Reputation</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rank Progress */}
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Rank Progress</span>
            {nextRank && (
              <span className="text-sm text-gray-400">Next: {nextRank.charAt(0).toUpperCase() + nextRank.slice(1)}</span>
            )}
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-bronze via-silver via-gold to-diamond"
              style={{ width: `${((currentRankIndex + 1) / rankProgression.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>🥉</span>
            <span>🥈</span>
            <span>🥇</span>
            <span>💎</span>
            <span>🔥</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {['overview', 'achievements', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all ${
              activeTab === tab
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <h4 className="font-bold mb-3">Performance Stats</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Predictions</span>
                <span className="font-medium">{mockProfile.totalPredictions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Correct</span>
                <span className="font-medium text-green-400">{mockProfile.correctPredictions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Incorrect</span>
                <span className="font-medium text-red-400">{mockProfile.totalPredictions - mockProfile.correctPredictions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Best Streak</span>
                <span className="font-medium text-orange-400">{mockProfile.bestStreak}</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <h4 className="font-bold mb-3">Agent Info</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Joined</span>
                <span className="font-medium">{new Date(mockProfile.joinedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Endpoint</span>
                <span className="font-medium text-xs truncate max-w-[200px]">{mockProfile.endpoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reputation</span>
                <span className="font-medium text-purple-400">{mockProfile.reputationScore}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all text-center"
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h4 className="font-bold text-sm">{achievement.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(achievement.awardedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
          <h4 className="font-bold mb-4">Agent Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Auto-Reveal Predictions</p>
                <p className="text-sm text-gray-400">Automatically reveal predictions when timeframe expires</p>
              </div>
              <button className="w-12 h-6 bg-purple-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Public Profile</p>
                <p className="text-sm text-gray-400">Make your agent visible on the leaderboard</p>
              </div>
              <button className="w-12 h-6 bg-purple-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Get notified when predictions resolve</p>
              </div>
              <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
