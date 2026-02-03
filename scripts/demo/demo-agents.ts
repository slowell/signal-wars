/**
 * Signal Wars Demo Agent Simulator
 * 
 * Main simulation script that creates and manages demo agents,
 * simulates predictions, duels, and voting on the Signal Wars arena.
 * 
 * Usage:
 *   ts-node demo-agents.ts [options]
 * 
 * Options:
 *   --agents, -a       Number of agents to create (default: 8)
 *   --duration, -d     Simulation duration in minutes (default: 30)
 *   --funding, -f      SOL to fund each agent (default: 5)
 *   --entry-fee, -e    Season entry fee in SOL (default: 0.1)
 *   --rpc, -r          RPC endpoint (default: devnet)
 *   --mock, -m         Run in mock mode (no blockchain)
 *   --load, -l         Load existing wallets
 *   --reset            Reset and regenerate all wallets
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

import {
  DemoAgent,
  SimulationConfig,
  SimulationResults,
  AgentDuel,
  DuelVote,
  AgentPrediction,
  AgentPersonalityType,
} from './types';

import {
  PERSONALITY_CONFIGS,
  getRandomPersonality,
  AGENT_NAMES,
  AGENT_DESCRIPTIONS,
} from './agent-personalities';

import {
  generateAgent,
  saveAgentWallet,
  loadAllAgentWallets,
  fundWalletAirdrop,
  fundWalletTransfer,
  getWalletBalance,
  fetchPythPrices,
  getMockPrices,
  generatePrediction,
  formatSol,
  formatTime,
  sleep,
  generateId,
  updateAgentStats,
  printAgentSummary,
  WALLETS_DIR,
} from './utils';

// Note: SDK import would go here for live mode
// import SignalWarsClient from '../../sdk/client';

/** Default configuration */
const DEFAULT_CONFIG: SimulationConfig = {
  agentCount: 8,
  rpcEndpoint: 'https://api.devnet.solana.com',
  programId: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'),
  seasonId: 0,
  useAirdrop: true,
  fundingAmount: 5,
  entryFee: 0.1,
  durationMinutes: 30,
  predictionDelayMs: 30000, // 30 seconds between predictions
};

/** Parse command line arguments */
function parseArgs(): Partial<SimulationConfig> & { 
  mockMode: boolean; 
  loadWallets: boolean; 
  reset: boolean;
  quickMode: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    mockMode: false,
    loadWallets: false,
    reset: false,
    quickMode: false,
  };
  
  const config: Partial<SimulationConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--agents':
      case '-a':
        config.agentCount = parseInt(next);
        i++;
        break;
      case '--duration':
      case '-d':
        config.durationMinutes = parseInt(next);
        i++;
        break;
      case '--funding':
      case '-f':
        config.fundingAmount = parseFloat(next);
        i++;
        break;
      case '--entry-fee':
      case '-e':
        config.entryFee = parseFloat(next);
        i++;
        break;
      case '--rpc':
      case '-r':
        config.rpcEndpoint = next;
        i++;
        break;
      case '--mock':
      case '-m':
        options.mockMode = true;
        break;
      case '--load':
      case '-l':
        options.loadWallets = true;
        break;
      case '--reset':
        options.reset = true;
        break;
      case '--quick':
      case '-q':
        options.quickMode = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return { ...config, ...options };
}

/** Print help message */
function printHelp(): void {
  console.log(`
Signal Wars Demo Agent Simulator

Usage: ts-node demo-agents.ts [options]

Options:
  --agents, -a <n>      Number of agents to create (default: 8)
  --duration, -d <min>  Simulation duration in minutes (default: 30)
  --funding, -f <sol>   SOL to fund each agent (default: 5)
  --entry-fee, -e <sol> Season entry fee (default: 0.1)
  --rpc, -r <url>       RPC endpoint (default: devnet)
  --mock, -m            Run in mock mode (no blockchain, simulation only)
  --load, -l            Load existing agent wallets
  --reset               Reset and regenerate all wallets
  --quick, -q           Quick mode (faster predictions)
  --help, -h            Show this help message

Examples:
  # Run with 10 agents for 60 minutes
  ts-node demo-agents.ts --agents 10 --duration 60

  # Run in mock mode (no blockchain)
  ts-node demo-agents.ts --mock

  # Load existing wallets and continue simulation
  ts-node demo-agents.ts --load

  # Reset and start fresh
  ts-node demo-agents.ts --reset
`);
}

/** Demo Agent Manager */
class DemoAgentManager {
  private agents: DemoAgent[] = [];
  private predictions: AgentPrediction[] = [];
  private duels: AgentDuel[] = [];
  private votes: DuelVote[] = [];
  private config: SimulationConfig;
  private connection: Connection;
  private payerKeypair?: Keypair;
  private mockMode: boolean;
  private quickMode: boolean;
  private startTime: number = 0;
  private totalTransactions: number = 0;
  private successfulTransactions: number = 0;
  // private clients: Map<string, SignalWarsClient> = new Map();

  constructor(
    config: SimulationConfig,
    mockMode: boolean,
    quickMode: boolean
  ) {
    this.config = config;
    this.mockMode = mockMode;
    this.quickMode = quickMode;
    this.connection = new Connection(config.rpcEndpoint, 'confirmed');
    
    // Adjust delays for quick mode
    if (quickMode) {
      this.config.predictionDelayMs = 5000;
    }
  }

  /** Initialize agents */
  async initialize(loadWallets: boolean, reset: boolean): Promise<void> {
    console.log('\n🚀 Initializing Signal Wars Demo Agents\n');
    console.log('='.repeat(60));
    
    if (reset) {
      console.log('🗑️  Reset mode: Clearing existing wallets...');
      if (fs.existsSync(WALLETS_DIR)) {
        fs.rmSync(WALLETS_DIR, { recursive: true });
      }
    }
    
    if (loadWallets && !reset) {
      console.log('📂 Loading existing wallets...');
      this.agents = loadAllAgentWallets();
      console.log(`✅ Loaded ${this.agents.length} existing agents`);
    }
    
    // Generate new agents if needed
    const needed = this.config.agentCount - this.agents.length;
    if (needed > 0) {
      console.log(`🆕 Generating ${needed} new agents...`);
      
      // Ensure balanced personality distribution
      const personalities: AgentPersonalityType[] = [
        'aggressive', 'conservative', 'random', 'trend-follower',
        'contrarian', 'whale', 'meme', 'analytical',
      ];
      
      for (let i = 0; i < needed; i++) {
        const personality = personalities[i % personalities.length];
        const agent = generateAgent(generateId(), personality);
        this.agents.push(agent);
        saveAgentWallet(agent);
        console.log(`   Created: ${agent.name} (${agent.personality})`);
      }
    }
    
    console.log(`\n✅ Total agents: ${this.agents.length}`);
    console.log('='.repeat(60));
  }

  /** Fund agent wallets */
  async fundAgents(): Promise<void> {
    console.log('\n💰 Funding Agent Wallets\n');
    console.log('-'.repeat(60));
    
    if (this.mockMode) {
      console.log('🎭 Mock mode: Simulating funding...');
      for (const agent of this.agents) {
        agent.balance = this.config.fundingAmount;
        console.log(`   ${agent.name}: ${formatSol(agent.balance * LAMPORTS_PER_SOL)}`);
      }
      return;
    }
    
    for (const agent of this.agents) {
      try {
        const success = await fundWalletAirdrop(
          this.connection,
          agent.keypair.publicKey,
          this.config.fundingAmount
        );
        
        if (success) {
          agent.balance = this.config.fundingAmount;
          this.successfulTransactions++;
          console.log(`   ✅ ${agent.name}: ${this.config.fundingAmount} SOL`);
        } else {
          console.log(`   ❌ ${agent.name}: Failed to fund`);
        }
        this.totalTransactions++;
        
        // Small delay to avoid rate limiting
        await sleep(1000);
      } catch (error) {
        console.error(`   ❌ ${agent.name}: Error funding:`, error);
      }
    }
    
    console.log('-'.repeat(60));
  }

  /** Register agents on-chain */
  async registerAgents(): Promise<void> {
    console.log('\n📝 Registering Agents\n');
    console.log('-'.repeat(60));
    
    if (this.mockMode) {
      console.log('🎭 Mock mode: Simulating registration...');
      for (const agent of this.agents) {
        agent.isRegistered = true;
        agent.agentPda = Keypair.generate().publicKey;
        console.log(`   ✅ ${agent.name}: Registered at ${agent.agentPda.toBase58().slice(0, 16)}...`);
      }
      return;
    }
    
    // In real mode, would use SignalWarsClient to register
    console.log('⚠️  On-chain registration requires deployed program');
    console.log('   Run with --mock flag for simulation mode');
    
    for (const agent of this.agents) {
      agent.isRegistered = true;
      agent.agentPda = await PublicKey.createWithSeed(
        agent.keypair.publicKey,
        'agent',
        this.config.programId
      );
      console.log(`   📝 ${agent.name}: Would register at ${agent.agentPda.toBase58().slice(0, 16)}...`);
    }
  }

  /** Enter season */
  async enterSeason(): Promise<void> {
    console.log('\n🏁 Entering Season\n');
    console.log('-'.repeat(60));
    
    if (this.mockMode) {
      console.log('🎭 Mock mode: Simulating season entry...');
      for (const agent of this.agents) {
        agent.hasEnteredSeason = true;
        agent.balance -= this.config.entryFee;
        agent.seasonEntryPda = Keypair.generate().publicKey;
        console.log(`   ✅ ${agent.name}: Entered season (-${this.config.entryFee} SOL)`);
      }
      return;
    }
    
    console.log(`⚠️  Would enter season with ${this.config.entryFee} SOL entry fee`);
    for (const agent of this.agents) {
      agent.hasEnteredSeason = true;
      console.log(`   📝 ${agent.name}: Would enter season`);
    }
  }

  /** Run prediction simulation */
  async runPredictionSimulation(): Promise<void> {
    console.log('\n📊 Starting Prediction Simulation\n');
    console.log('='.repeat(60));
    console.log(`Duration: ${this.config.durationMinutes} minutes`);
    console.log(`Prediction delay: ${this.config.predictionDelayMs / 1000}s`);
    console.log('='.repeat(60) + '\n');
    
    this.startTime = Date.now();
    const endTime = this.startTime + this.config.durationMinutes * 60 * 1000;
    
    let predictionCount = 0;
    
    while (Date.now() < endTime) {
      // Get current prices
      const prices = this.mockMode ? getMockPrices() : await fetchPythPrices();
      
      // Select random agent to make prediction
      const agent = this.agents[Math.floor(Math.random() * this.agents.length)];
      
      // Generate prediction
      const prediction = generatePrediction(agent, prices, predictionCount);
      this.predictions.push(prediction);
      
      console.log(`[${formatTime(Date.now())}] ${agent.name} predicts ${prediction.direction.toUpperCase()} on ${prediction.asset} ` +
        `@ $${prediction.targetPrice.toFixed(2)} (confidence: ${prediction.confidence.toFixed(1)}%, stake: ${formatSol(prediction.stakeAmount)})`);
      
      // Simulate prediction submission
      if (this.mockMode) {
        await this.simulatePredictionSubmission(agent, prediction);
      }
      
      predictionCount++;
      
      // Occasionally create duels
      if (Math.random() < 0.1) { // 10% chance
        await this.createDuel();
      }
      
      // Occasionally vote on duels
      if (Math.random() < 0.15 && this.duels.length > 0) { // 15% chance if duels exist
        await this.castVote();
      }
      
      // Wait before next prediction
      await sleep(this.config.predictionDelayMs);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Simulation complete: ${predictionCount} predictions made`);
    console.log('='.repeat(60));
  }

  /** Simulate prediction submission and resolution */
  private async simulatePredictionSubmission(
    agent: DemoAgent,
    prediction: AgentPrediction
  ): Promise<void> {
    // Deduct stake
    agent.balance -= prediction.stakeAmount / LAMPORTS_PER_SOL;
    agent.stats.totalStaked += prediction.stakeAmount;
    
    // Simulate market movement and resolution
    const marketMovedUp = Math.random() > 0.5;
    const wasCorrect = (prediction.direction === 'up' && marketMovedUp) ||
                       (prediction.direction === 'down' && !marketMovedUp);
    
    // Small delay before resolution
    await sleep(100);
    
    if (wasCorrect) {
      const winnings = prediction.stakeAmount * 2;
      agent.balance += winnings / LAMPORTS_PER_SOL;
      updateAgentStats(agent, true, prediction.stakeAmount, winnings);
      
      if (agent.stats.streak > 1) {
        console.log(`   🎉 ${agent.name} WON! Streak: ${agent.stats.streak} 🔥`);
      } else {
        console.log(`   ✅ ${agent.name} WON!`);
      }
    } else {
      updateAgentStats(agent, false, prediction.stakeAmount, 0);
      console.log(`   ❌ ${agent.name} LOST`);
    }
    
    prediction.wasCorrect = wasCorrect;
    prediction.status = 'Resolved';
  }

  /** Create a duel between two agents */
  private async createDuel(): Promise<void> {
    const challenger = this.agents[Math.floor(Math.random() * this.agents.length)];
    let opponent = this.agents[Math.floor(Math.random() * this.agents.length)];
    
    // Ensure different agents
    while (opponent.id === challenger.id) {
      opponent = this.agents[Math.floor(Math.random() * this.agents.length)];
    }
    
    const assets = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'WIF'] as const;
    const asset = assets[Math.floor(Math.random() * assets.length)];
    
    const duel: AgentDuel = {
      id: generateId(),
      challenger,
      opponent,
      asset,
      stakeAmount: 0.5 + Math.random(),
      startTime: Date.now(),
      endTime: Date.now() + 3600000, // 1 hour
      isComplete: false,
    };
    
    this.duels.push(duel);
    console.log(`   ⚔️  DUEL: ${challenger.name} vs ${opponent.name} on ${asset}!`);
  }

  /** Cast a vote on a duel */
  private async castVote(): Promise<void> {
    const voter = this.agents[Math.floor(Math.random() * this.agents.length)];
    const duel = this.duels[Math.floor(Math.random() * this.duels.length)];
    
    if (duel.isComplete) return;
    
    // Vote for one of the duelists
    const votedFor = Math.random() > 0.5 ? duel.challenger : duel.opponent;
    const amount = Math.floor((0.1 + Math.random() * 0.5) * LAMPORTS_PER_SOL);
    
    const vote: DuelVote = {
      voter,
      duelId: duel.id,
      votedFor,
      amount,
      timestamp: Date.now(),
    };
    
    this.votes.push(vote);
    console.log(`   🗳️  ${voter.name} voted for ${votedFor.name} (${formatSol(amount)})`);
  }

  /** Generate and print final results */
  generateResults(): SimulationResults {
    const endTime = Date.now();
    
    return {
      agents: this.agents,
      predictions: this.predictions,
      duels: this.duels,
      votes: this.votes,
      startTime: this.startTime,
      endTime,
      totalTransactions: this.totalTransactions,
      successRate: this.totalTransactions > 0
        ? (this.successfulTransactions / this.totalTransactions) * 100
        : 100,
    };
  }

  /** Print simulation summary */
  printSummary(results: SimulationResults): void {
    printAgentSummary(this.agents);
    
    console.log('\n' + '='.repeat(100));
    console.log('SIMULATION SUMMARY');
    console.log('='.repeat(100));
    console.log(`Total Agents: ${results.agents.length}`);
    console.log(`Total Predictions: ${results.predictions.length}`);
    console.log(`Total Duels: ${results.duels.length}`);
    console.log(`Total Votes: ${results.votes.length}`);
    console.log(`Duration: ${((results.endTime - results.startTime) / 60000).toFixed(1)} minutes`);
    console.log(`Transactions: ${results.totalTransactions} (${results.successRate.toFixed(1)}% success)`);
    
    // Calculate total pool
    const totalStaked = results.predictions.reduce((sum, p) => sum + p.stakeAmount, 0);
    console.log(`Total Staked: ${formatSol(totalStaked)}`);
    
    // Top performers
    const topAgent = [...results.agents].sort((a, b) => b.stats.totalProfit - a.stats.totalProfit)[0];
    console.log(`\n🏆 Top Performer: ${topAgent.name}`);
    console.log(`   Profit: ${(topAgent.stats.totalProfit / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`   Win Rate: ${topAgent.stats.winRate}%`);
    console.log(`   Best Streak: ${topAgent.stats.bestStreak}`);
    
    console.log('='.repeat(100));
  }

  /** Save results to file */
  saveResults(results: SimulationResults): void {
    const resultsDir = path.join(__dirname, '.results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(resultsDir, `simulation-${timestamp}.json`);
    
    // Sanitize for JSON (remove Keypair objects)
    const sanitizedResults = {
      ...results,
      agents: results.agents.map(a => ({
        id: a.id,
        name: a.name,
        personality: a.personality,
        description: a.description,
        publicKey: a.keypair.publicKey.toBase58(),
        agentPda: a.agentPda?.toBase58(),
        balance: a.balance,
        stats: a.stats,
        isRegistered: a.isRegistered,
        hasEnteredSeason: a.hasEnteredSeason,
      })),
    };
    
    fs.writeFileSync(filePath, JSON.stringify(sanitizedResults, null, 2));
    console.log(`\n💾 Results saved to: ${filePath}`);
  }
}

/** Main execution */
async function main(): Promise<void> {
  const args = parseArgs();
  
  const config: SimulationConfig = {
    ...DEFAULT_CONFIG,
    ...args,
  };
  
  console.log('\n⚔️  Signal Wars Demo Agent Simulator ⚔️\n');
  console.log('Configuration:');
  console.log(`  Mode: ${args.mockMode ? 'MOCK (simulation)' : 'LIVE (blockchain)'}`);
  console.log(`  Agents: ${config.agentCount}`);
  console.log(`  Duration: ${config.durationMinutes} min`);
  console.log(`  Funding: ${config.fundingAmount} SOL per agent`);
  console.log(`  Entry Fee: ${config.entryFee} SOL`);
  console.log(`  RPC: ${config.rpcEndpoint}`);
  
  const manager = new DemoAgentManager(config, args.mockMode, args.quickMode);
  
  try {
    // Initialize
    await manager.initialize(args.loadWallets, args.reset);
    
    // Fund agents
    await manager.fundAgents();
    
    // Register agents
    await manager.registerAgents();
    
    // Enter season
    await manager.enterSeason();
    
    // Run simulation
    await manager.runPredictionSimulation();
    
    // Generate and print results
    const results = manager.generateResults();
    manager.printSummary(results);
    manager.saveResults(results);
    
    console.log('\n✅ Demo simulation complete!\n');
  } catch (error) {
    console.error('\n❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default DemoAgentManager;
