/**
 * Real Blockchain SDK - Connects to devnet Signal Wars program
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import * as idl from '../../sdk/idl/signal_wars.json';

// Configuration
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey(process.env.SIGNAL_WARS_PROGRAM_ID || '9s5gawgG2KJy7kofoxhRAve4zL6S7Y8dFuECtpbbBWJZ');

// Global connection
let connection: Connection | null = null;
let program: Program | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }
  return connection;
}

export function getProgram(): Program {
  if (!program) {
    const conn = getConnection();
    // Dummy wallet for read-only operations
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async () => { throw new Error('Read-only wallet'); },
      signAllTransactions: async () => { throw new Error('Read-only wallet'); },
    };
    const provider = new AnchorProvider(conn, dummyWallet as any, {
      commitment: 'confirmed',
    });
    program = new Program(idl as any, provider);
  }
  return program;
}

// PDA Derivation Helpers
export function deriveArenaPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('arena')],
    PROGRAM_ID
  )[0];
}

export function deriveAgentPda(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), owner.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function deriveSeasonPda(seasonId: number): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(seasonId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('season'), idBuf],
    PROGRAM_ID
  )[0];
}

export function deriveSeasonEntryPda(season: PublicKey, agent: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), season.toBuffer(), agent.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function derivePredictionPda(agent: PublicKey, season: PublicKey, predictionCount: number): PublicKey {
  const countBuf = Buffer.alloc(8);
  countBuf.writeBigUInt64LE(BigInt(predictionCount), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('prediction'), agent.toBuffer(), season.toBuffer(), countBuf],
    PROGRAM_ID
  )[0];
}

// Fetch real on-chain data
export async function fetchArenaData() {
  const program = getProgram() as any;
  const arenaPda = deriveArenaPda();
  
  try {
    const arena = await program.account.arena.fetch(arenaPda);
    return {
      authority: arena.authority.toString(),
      totalSeasons: arena.totalSeasons.toNumber(),
      totalAgents: arena.totalAgents.toNumber(),
    };
  } catch (e) {
    console.error('Failed to fetch arena:', e);
    return null;
  }
}

export async function fetchAgentData(agentPda: PublicKey) {
  const program = getProgram() as any;
  
  try {
    const agent = await program.account.agent.fetch(agentPda);
    return {
      owner: agent.owner.toString(),
      name: agent.name,
      endpoint: agent.endpoint,
      totalPredictions: agent.totalPredictions.toNumber(),
      correctPredictions: agent.correctPredictions.toNumber(),
      streak: agent.streak,
      bestStreak: agent.bestStreak,
      rank: ['bronze', 'silver', 'gold', 'diamond', 'legend'][agent.rank] || 'bronze',
      reputationScore: agent.reputationScore,
      joinedAt: agent.joinedAt.toNumber() * 1000,
    };
  } catch (e) {
    return null;
  }
}

export async function fetchSeasonData(seasonPda: PublicKey) {
  const program = getProgram() as any;
  
  try {
    const season = await program.account.season.fetch(seasonPda);
    return {
      id: season.id.toNumber(),
      authority: season.authority.toString(),
      entryFee: season.entryFee.toString(),
      startTime: season.startTime.toNumber() * 1000,
      endTime: season.endTime.toNumber() * 1000,
      prizePoolBps: season.prizePoolBps,
      totalEntries: season.totalEntries.toNumber(),
      totalPool: season.totalPool.toString(),
      status: ['active', 'completed', 'cancelled'][season.status] || 'active',
    };
  } catch (e) {
    return null;
  }
}

// Fetch all agents (scanning - for demo purposes)
export async function fetchAllAgents() {
  const program = getProgram() as any;
  
  try {
    // Fetch all agent accounts
    const agents = await program.account.agent.all();
    
    return agents.map((a: any) => ({
      id: a.publicKey.toString(),
      address: a.publicKey.toString(),
      owner: a.account.owner.toString(),
      name: a.account.name,
      rank: ['bronze', 'silver', 'gold', 'diamond', 'legend'][a.account.rank] || 'bronze',
      tier: Math.min(5, Math.floor(a.account.reputationScore / 2000) + 1),
      avatar: ['🤖', '🐋', '📈', '🧠', '📊', '📰', '🚀', '💎'][a.account.totalPredictions % 8],
      stats: {
        totalPredictions: a.account.totalPredictions.toNumber(),
        correctPredictions: a.account.correctPredictions.toNumber(),
        accuracy: a.account.totalPredictions > 0 
          ? (a.account.correctPredictions.toNumber() / a.account.totalPredictions.toNumber()) * 100 
          : 0,
        currentStreak: a.account.streak,
        bestStreak: a.account.bestStreak,
        reputationScore: a.account.reputationScore,
      },
      joinedAt: a.account.joinedAt.toNumber() * 1000,
    }));
  } catch (e) {
    console.error('Failed to fetch agents:', e);
    return [];
  }
}

// Fetch all seasons
export async function fetchAllSeasons() {
  const program = getProgram() as any;
  
  try {
    const seasons = await program.account.season.all();
    
    return seasons.map((s: any) => ({
      id: s.publicKey.toString(),
      seasonNumber: s.account.id.toNumber(),
      name: `Season ${s.account.id.toNumber()}`,
      status: ['active', 'completed', 'cancelled'][s.account.status] || 'active',
      entryFee: s.account.entryFee.toString(),
      prizePool: s.account.totalPool.toString(),
      participantCount: s.account.totalEntries.toNumber(),
      startTime: s.account.startTime.toNumber() * 1000,
      endTime: s.account.endTime.toNumber() * 1000,
    }));
  } catch (e) {
    console.error('Failed to fetch seasons:', e);
    return [];
  }
}

export default {
  getConnection,
  getProgram,
  deriveArenaPda,
  deriveAgentPda,
  deriveSeasonPda,
  deriveSeasonEntryPda,
  derivePredictionPda,
  fetchArenaData,
  fetchAgentData,
  fetchSeasonData,
  fetchAllAgents,
  fetchAllSeasons,
};
