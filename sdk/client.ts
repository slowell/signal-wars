import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { SignalWars } from '../types/signal_wars';

export class SignalWarsClient {
  program: Program<SignalWars>;
  provider: AnchorProvider;

  constructor(connection: web3.Connection, wallet: anchor.Wallet) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(this.provider);
    
    // IDL would be loaded from JSON file
    this.program = new Program(require('./idl/signal_wars.json'), this.provider);
  }

  // Initialize the global arena
  async initializeArena(authority: web3.PublicKey): Promise<web3.PublicKey> {
    const [arenaPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('arena')],
      this.program.programId
    );

    await this.program.methods
      .initializeArena()
      .accounts({
        arena: arenaPda,
        authority,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return arenaPda;
  }

  // Register a new agent
  async registerAgent(
    owner: web3.PublicKey,
    name: string,
    endpoint: string
  ): Promise<web3.PublicKey> {
    const [agentPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), owner.toBuffer()],
      this.program.programId
    );

    const [arenaPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('arena')],
      this.program.programId
    );

    await this.program.methods
      .registerAgent(name, endpoint)
      .accounts({
        agent: agentPda,
        arena: arenaPda,
        owner,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return agentPda;
  }

  // Create a new season
  async createSeason(
    authority: web3.PublicKey,
    entryFee: BN,
    durationDays: number,
    prizePoolBps: number,
    seasonId: BN
  ): Promise<web3.PublicKey> {
    const [seasonPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('season'), seasonId.toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );

    const [arenaPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('arena')],
      this.program.programId
    );

    await this.program.methods
      .createSeason(entryFee, durationDays, prizePoolBps)
      .accounts({
        season: seasonPda,
        arena: arenaPda,
        authority,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return seasonPda;
  }

  // Submit a prediction (commit hash)
  async submitPrediction(
    player: web3.PublicKey,
    agent: web3.PublicKey,
    season: web3.PublicKey,
    predictionHash: Buffer,
    stakeAmount: BN,
    predictionCount: BN
  ): Promise<web3.PublicKey> {
    const [predictionPda] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('prediction'),
        agent.toBuffer(),
        season.toBuffer(),
        predictionCount.toArrayLike(Buffer, 'le', 8),
      ],
      this.program.programId
    );

    const [vaultPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('prediction_vault'), predictionPda.toBuffer()],
      this.program.programId
    );

    await this.program.methods
      .submitPrediction(Array.from(predictionHash), stakeAmount)
      .accounts({
        season,
        agent,
        prediction: predictionPda,
        player,
        predictionVault: vaultPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return predictionPda;
  }

  // Reveal prediction
  async revealPrediction(
    player: web3.PublicKey,
    agent: web3.PublicKey,
    prediction: web3.PublicKey,
    predictionData: string
  ): Promise<void> {
    await this.program.methods
      .revealPrediction(predictionData)
      .accounts({
        prediction,
        agent,
        player,
      })
      .rpc();
  }

  // Get agent info
  async getAgent(agentPda: web3.PublicKey): Promise<any> {
    return await this.program.account.agent.fetch(agentPda);
  }

  // Get season info
  async getSeason(seasonPda: web3.PublicKey): Promise<any> {
    return await this.program.account.season.fetch(seasonPda);
  }

  // Get prediction info
  async getPrediction(predictionPda: web3.PublicKey): Promise<any> {
    return await this.program.account.prediction.fetch(predictionPda);
  }

  // Helper: Create prediction hash
  static createPredictionHash(predictionData: string): Buffer {
    return Buffer.from(
      anchor.utils.sha256.hash(predictionData),
      'hex'
    );
  }

  // Helper: Generate prediction JSON
  static generatePrediction(
    asset: string,
    direction: 'up' | 'down',
    targetPrice: number,
    timeframe: string,
    confidence: number
  ): string {
    return JSON.stringify({
      asset,
      direction,
      targetPrice,
      timeframe,
      confidence,
      timestamp: Date.now(),
    });
  }
}

export default SignalWarsClient;
