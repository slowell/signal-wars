'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, ChevronDown, Sword, Clock, Target } from 'lucide-react';

import { Duel } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { AgentMiniCard } from '@/components/ui/AgentAvatar';
import { Agent } from '@/types';
import { assetIcons } from '@/lib/utils';

interface DuelCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDuel: (duelData: Partial<Duel>) => void;
  userAgents: Agent[];
  availableOpponents: Agent[];
}

const assets = ['SOL', 'BTC', 'ETH', 'BONK', 'JTO', 'PYTH', 'JUP'];
const timeframes = [
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '48h', label: '48 Hours' },
  { value: '7d', label: '7 Days' },
];

export function DuelCreationModal({
  isOpen,
  onClose,
  onCreateDuel,
  userAgents,
  availableOpponents,
}: DuelCreationModalProps) {
  const [step, setStep] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<Agent | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('SOL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [entryFee, setEntryFee] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpponents = availableOpponents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      agent.id !== selectedAgent?.id
  );

  const handleCreate = () => {
    if (!selectedAgent || !selectedOpponent) return;

    const duelData: Partial<Duel> = {
      agentA: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        avatar: selectedAgent.avatar,
        rank: selectedAgent.rank,
        accuracy: selectedAgent.accuracy,
      },
      agentB: {
        id: selectedOpponent.id,
        name: selectedOpponent.name,
        avatar: selectedOpponent.avatar,
        rank: selectedOpponent.rank,
        accuracy: selectedOpponent.accuracy,
      },
      asset: selectedAsset,
      timeframe: selectedTimeframe,
      prizePool: parseFloat(entryFee) * 2,
      status: 'open',
      totalBets: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    onCreateDuel(duelData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedAgent(null);
    setSelectedOpponent(null);
    setSelectedAsset('SOL');
    setSelectedTimeframe('24h');
    setEntryFee('10');
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Duel"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                animate={{
                  backgroundColor: step >= s ? '#8b5cf6' : '#374151',
                  scale: step === s ? 1.1 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              >
                {s}
              </motion.div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 && 'Select Agent'}
                {s === 2 && 'Choose Opponent'}
                {s === 3 && 'Configure'}
              </span>
              {s < 3 && <div className="w-8 h-0.5 bg-gray-700" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Your Agent */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium">Select your agent</h3>
              
              {userAgents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">You don't have any agents yet.</p>
                  <button className="mt-4 px-4 py-2 bg-purple-600 rounded-lg font-medium">
                    Create Agent
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {userAgents.map((agent) => (
                    <AgentMiniCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedAgent?.id === agent.id}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setStep(2);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Opponent */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Choose your opponent</h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  ← Back
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {filteredOpponents.map((agent) => (
                  <AgentMiniCard
                    key={agent.id}
                    agent={agent}
                    selected={selectedOpponent?.id === agent.id}
                    onClick={() => {
                      setSelectedOpponent(agent);
                      setStep(3);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Configure Duel */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Configure duel</h3>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  ← Back
                </button>
              </div>

              {/* Selected Agents Preview */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <span className="text-4xl">{selectedAgent?.avatar}</span>
                    <p className="font-medium mt-1">{selectedAgent?.name}</p>
                    <p className="text-xs text-gray-400">You</p>
                  </div>
                  
                  <span className="text-2xl font-bold text-orange-500">VS</span>
                  
                  <div className="text-center">
                    <span className="text-4xl">{selectedOpponent?.avatar}</span>
                    <p className="font-medium mt-1">{selectedOpponent?.name}</p>
                    <p className="text-xs text-gray-400">Opponent</p>
                  </div>
                </div>
              </div>

              {/* Asset Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Asset</label>
                <div className="flex flex-wrap gap-2">
                  {assets.map((asset) => (
                    <button
                      key={asset}
                      onClick={() => setSelectedAsset(asset)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all
                        flex items-center gap-2
                        ${selectedAsset === asset
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      <span>{assetIcons[asset]}</span>
                      {asset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setSelectedTimeframe(tf.value)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all
                        ${selectedTimeframe === tf.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                      `}
                    >
                      <Clock className="w-4 h-4 inline mr-1" />
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Fee */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Entry Fee (SOL)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    min="1"
                    step="0.5"
                    className="flex-1 px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 text-white focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-gray-400">SOL</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Prize pool: {parseFloat(entryFee) * 2} SOL
                </p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your entry fee</span>
                  <span>{entryFee} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Opponent entry fee</span>
                  <span>{entryFee} SOL</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                  <span className="text-yellow-400">Total Prize Pool</span>
                  <span className="text-yellow-400">{parseFloat(entryFee) * 2} SOL</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          
          {step === 3 && (
            <button
              onClick={handleCreate}
              disabled={!selectedAgent || !selectedOpponent}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg font-bold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sword className="w-5 h-5 inline mr-2" />
              Create Duel
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
