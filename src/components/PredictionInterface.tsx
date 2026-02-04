'use client';

import { useState } from 'react';
import { SUPPORTED_TOKENS, TOKEN_CATEGORIES, POPULAR_TOKENS, getTokenBySymbol } from '@/lib/tokens';

interface Prediction {
  id: string;
  asset: string;
  direction: 'up' | 'down';
  targetPrice: number;
  currentPrice: number;
  confidence: number;
  timeframe: string;
  submittedAt: string;
  status: 'committed' | 'revealed' | 'resolved';
  stakeAmount: number;
  potentialReturn: number;
}

const mockPredictions: Prediction[] = [
  {
    id: 'pred-1',
    asset: 'SOL',
    direction: 'up',
    targetPrice: 220.50,
    currentPrice: 215.30,
    confidence: 85,
    timeframe: '24h',
    submittedAt: '2026-02-02T20:00:00Z',
    status: 'committed',
    stakeAmount: 10,
    potentialReturn: 20,
  },
  {
    id: 'pred-2',
    asset: 'BONK',
    direction: 'down',
    targetPrice: 0.000012,
    currentPrice: 0.000013,
    confidence: 72,
    timeframe: '12h',
    submittedAt: '2026-02-02T18:30:00Z',
    status: 'revealed',
    stakeAmount: 5,
    potentialReturn: 10,
  },
  {
    id: 'pred-3',
    asset: 'JTO',
    direction: 'up',
    targetPrice: 4.20,
    currentPrice: 3.85,
    confidence: 68,
    timeframe: '48h',
    submittedAt: '2026-02-01T15:00:00Z',
    status: 'resolved',
    stakeAmount: 8,
    potentialReturn: 16,
  },
];

const timeframes = ['1h', '4h', '24h', '48h', '7d'];

export default function PredictionInterface() {
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('SOL');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [targetPrice, setTargetPrice] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPredictions = mockPredictions.filter(p => {
    if (activeTab === 'active') return p.status === 'committed' || p.status === 'revealed';
    if (activeTab === 'history') return p.status === 'resolved';
    return true;
  });

  // Filter tokens based on category and search
  const filteredTokens = SUPPORTED_TOKENS.filter(token => {
    const matchesCategory = tokenFilter === 'all' || token.category === tokenFilter;
    const matchesSearch = token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get popular tokens first
  const popularTokensList = POPULAR_TOKENS.map(sym => getTokenBySymbol(sym)).filter(Boolean);

  const handleCreatePrediction = () => {
    console.log('Creating prediction:', {
      asset: selectedAsset,
      direction,
      targetPrice,
      stakeAmount,
      confidence,
      timeframe: selectedTimeframe,
    });
    setShowCreateModal(false);
  };

  const getTokenIcon = (symbol: string) => {
    const token = getTokenBySymbol(symbol);
    return token?.icon || '🪙';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Predictions</h2>
          <p className="text-gray-400">Commit, reveal, and track your market calls</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          + New Prediction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-green-400">12</p>
          <p className="text-sm text-gray-400">Active Predictions</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-yellow-400">78.5%</p>
          <p className="text-sm text-gray-400">Win Rate</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-blue-400">45.2 SOL</p>
          <p className="text-sm text-gray-400">Total Staked</p>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-2xl font-bold text-purple-400">+128%</p>
          <p className="text-sm text-gray-400">Total Returns</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {['active', 'history', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-all ${
              activeTab === tab
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {filteredPredictions.map((prediction) => (
          <div
            key={prediction.id}
            className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getTokenIcon(prediction.asset)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{prediction.asset}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-sm font-medium ${
                        prediction.direction === 'up'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {prediction.direction === 'up' ? '📈 LONG' : '📉 SHORT'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        prediction.status === 'committed'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : prediction.status === 'revealed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {prediction.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Target: ${prediction.targetPrice} • Timeframe: {prediction.timeframe}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold">{prediction.confidence}%</p>
                  <p className="text-xs text-gray-500">Confidence</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-400">{prediction.stakeAmount} SOL</p>
                  <p className="text-xs text-gray-500">Staked</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">+{prediction.potentialReturn} SOL</p>
                  <p className="text-xs text-gray-500">Potential</p>
                </div>
              </div>

              <div className="flex gap-2">
                {prediction.status === 'committed' && (
                  <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
                    Reveal
                  </button>
                )}
                {prediction.status === 'revealed' && (
                  <button className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium cursor-not-allowed">
                    Pending
                  </button>
                )}
                {prediction.status === 'resolved' && (
                  <button className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium cursor-not-allowed">
                    Won ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Prediction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Prediction</h3>

            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTokenFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tokenFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {TOKEN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTokenFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        tokenFilter === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Tokens */}
              {!searchQuery && tokenFilter === 'all' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Popular</label>
                  <div className="flex gap-2 flex-wrap">
                    {popularTokensList.map((token) => token && (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedAsset(token.symbol)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          selectedAsset === token.symbol
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Tokens Grid */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {searchQuery ? 'Search Results' : 'All Tokens'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => setSelectedAsset(token.symbol)}
                      className={`p-2 rounded-lg font-medium transition-all flex flex-col items-center gap-1 ${
                        selectedAsset === token.symbol
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={token.name}
                    >
                      <span className="text-lg">{token.icon}</span>
                      <span className="text-xs">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Token Display */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTokenIcon(selectedAsset)}</span>
                  <div>
                    <p className="font-bold">{selectedAsset}</p>
                    <p className="text-sm text-gray-400">{getTokenBySymbol(selectedAsset)?.name}</p>
                  </div>
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDirection('up')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      direction === 'up'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    📈 Up
                  </button>
                  <button
                    onClick={() => setDirection('down')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      direction === 'down'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    📉 Down
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Price ($)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="220.50"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
                <div className="flex gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedTimeframe === tf
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Slider */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confidence: {confidence}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Stake Amount */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Stake Amount (SOL)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Potential return: {stakeAmount ? Number(stakeAmount) * 2 : 0} SOL (2x on correct prediction)
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePrediction}
                disabled={!targetPrice || !stakeAmount}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Prediction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
