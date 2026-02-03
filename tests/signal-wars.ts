import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { assert, expect } from 'chai';
import { SignalWars } from '../target/types/signal_wars';
import {
  deriveArenaPda,
  deriveAgentPda,
  deriveSeasonPda,
  deriveSeasonEntryPda,
  derivePredictionPda,
  deriveSeasonVaultPda,
  derivePredictionVaultPda,
  deriveAchievementPda,
  generatePredictionHash,
  generatePredictionData,
  airdrop,
  TEST_CONSTANTS,
  ERROR_CODES,
} from './test-utils';

describe('Signal Wars', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SignalWars as Program<SignalWars>;
  
  // Test keypairs
  const authority = web3.Keypair.generate();
  const player = web3.Keypair.generate();
  const player2 = web3.Keypair.generate();
  const player3 = web3.Keypair.generate();
  
  // Test state
  let arenaPda: web3.PublicKey;
  let agentPda: web3.PublicKey;
  let agent2Pda: web3.PublicKey;
  let seasonPda: web3.PublicKey;
  let seasonEntryPda: web3.PublicKey;
  let seasonEntry2Pda: web3.PublicKey;
  let predictionPda: web3.PublicKey;
  let prediction2Pda: web3.PublicKey;
  let seasonVaultPda: web3.PublicKey;
  let predictionVaultPda: web3.PublicKey;

  // Constants
  const ENTRY_FEE = new BN(TEST_CONSTANTS.ENTRY_FEE_LAMPORTS);
  const STAKE_AMOUNT = new BN(TEST_CONSTANTS.STAKE_AMOUNT_LAMPORTS);
  const DURATION_DAYS = TEST_CONSTANTS.DURATION_DAYS_DEFAULT;
  const PRIZE_POOL_BPS = TEST_CONSTANTS.PRIZE_POOL_BPS_DEFAULT;

  // Setup before all tests
  before(async () => {
    // Fund test accounts
    await airdrop(provider, authority);
    await airdrop(provider, player);
    await airdrop(provider, player2);
    await airdrop(provider, player3);
  });

  // ==========================================
  // Test Suite 1: Arena Initialization
  // ==========================================
  describe('Arena Initialization', () => {
    it('Should initialize the global arena', async () => {
      [arenaPda] = deriveArenaPda(program.programId);

      await program.methods
        .initializeArena()
        .accounts({
          arena: arenaPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const arena = await program.account.arena.fetch(arenaPda);
      
      expect(arena.authority.toString()).to.equal(authority.publicKey.toString());
      expect(arena.totalSeasons.toNumber()).to.equal(0);
      expect(arena.totalAgents.toNumber()).to.equal(0);
    });

    it('Should fail to initialize arena twice', async () => {
      try {
        await program.methods
          .initializeArena()
          .accounts({
            arena: arenaPda,
            authority: authority.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.toString()).to.include('already in use');
      }
    });
  });

  // ==========================================
  // Test Suite 2: Agent Registration
  // ==========================================
  describe('Agent Registration', () => {
    it('Should register a new agent', async () => {
      [agentPda] = deriveAgentPda(player.publicKey, program.programId);

      const name = TEST_CONSTANTS.AGENT_NAMES[0];
      const endpoint = TEST_CONSTANTS.ENDPOINT_URLS[0];

      await program.methods
        .registerAgent(name, endpoint)
        .accounts({
          agent: agentPda,
          arena: arenaPda,
          owner: player.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const agent = await program.account.agent.fetch(agentPda);
      const arena = await program.account.arena.fetch(arenaPda);

      expect(agent.owner.toString()).to.equal(player.publicKey.toString());
      expect(agent.name).to.equal(name);
      expect(agent.endpoint).to.equal(endpoint);
      expect(agent.totalPredictions.toNumber()).to.equal(0);
      expect(agent.correctPredictions.toNumber()).to.equal(0);
      expect(agent.streak).to.equal(0);
      expect(agent.bestStreak).to.equal(0);
      expect(arena.totalAgents.toNumber()).to.equal(1);
    });

    it('Should register a second agent', async () => {
      [agent2Pda] = deriveAgentPda(player2.publicKey, program.programId);

      await program.methods
        .registerAgent(TEST_CONSTANTS.AGENT_NAMES[1], TEST_CONSTANTS.ENDPOINT_URLS[1])
        .accounts({
          agent: agent2Pda,
          arena: arenaPda,
          owner: player2.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      const arena = await program.account.arena.fetch(arenaPda);
      expect(arena.totalAgents.toNumber()).to.equal(2);
    });

    it('Should fail to register agent with name too long', async () => {
      const [tempAgentPda] = deriveAgentPda(player3.publicKey, program.programId);
      const longName = 'a'.repeat(TEST_CONSTANTS.MAX_NAME_LENGTH + 1);

      try {
        await program.methods
          .registerAgent(longName, TEST_CONSTANTS.ENDPOINT_URLS[0])
          .accounts({
            agent: tempAgentPda,
            arena: arenaPda,
            owner: player3.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player3])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.NameTooLong);
      }
    });

    it('Should fail to register agent with endpoint too long', async () => {
      const [tempAgentPda] = deriveAgentPda(player3.publicKey, program.programId);
      const longEndpoint = 'https://api.' + 'a'.repeat(150) + '.com';

      try {
        await program.methods
          .registerAgent('ValidName', longEndpoint)
          .accounts({
            agent: tempAgentPda,
            arena: arenaPda,
            owner: player3.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player3])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.EndpointTooLong);
      }
    });

    it('Should fail to register agent twice for same owner', async () => {
      try {
        await program.methods
          .registerAgent('Duplicate', 'https://api.dupe.com')
          .accounts({
            agent: agentPda,
            arena: arenaPda,
            owner: player.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.toString()).to.include('already in use');
      }
    });
  });

  // ==========================================
  // Test Suite 3: Season Initialization
  // ==========================================
  describe('Season Initialization', () => {
    it('Should create a new season', async () => {
      const seasonId = new BN(0);
      [seasonPda] = deriveSeasonPda(seasonId, program.programId);

      await program.methods
        .createSeason(ENTRY_FEE, DURATION_DAYS, PRIZE_POOL_BPS)
        .accounts({
          season: seasonPda,
          arena: arenaPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const season = await program.account.season.fetch(seasonPda);
      const arena = await program.account.arena.fetch(arenaPda);

      expect(season.id.toNumber()).to.equal(0);
      expect(season.entryFee.toNumber()).to.equal(ENTRY_FEE.toNumber());
      expect(season.prizePoolBps).to.equal(PRIZE_POOL_BPS);
      expect(season.totalEntries.toNumber()).to.equal(0);
      expect(season.status).to.deep.equal({ active: {} });
      expect(arena.totalSeasons.toNumber()).to.equal(1);
      expect(season.endTime.toNumber()).to.be.greaterThan(season.startTime.toNumber());
    });

    it('Should fail to create season with invalid prize pool bps', async () => {
      const seasonId = new BN(999);
      const [invalidSeasonPda] = deriveSeasonPda(seasonId, program.programId);

      try {
        await program.methods
          .createSeason(ENTRY_FEE, DURATION_DAYS, 10001)
          .accounts({
            season: invalidSeasonPda,
            arena: arenaPda,
            authority: authority.publicKey,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.InvalidPrizeSplit);
      }
    });
  });

  // ==========================================
  // Test Suite 4: Season Entry
  // ==========================================
  describe('Season Entry', () => {
    it('Should allow agent to enter a season', async () => {
      [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda, program.programId);
      [seasonVaultPda] = deriveSeasonVaultPda(seasonPda, program.programId);

      const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);

      await program.methods
        .enterSeason()
        .accounts({
          season: seasonPda,
          seasonEntry: seasonEntryPda,
          agent: agentPda,
          player: player.publicKey,
          seasonVault: seasonVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const season = await program.account.season.fetch(seasonPda);
      const entry = await program.account.seasonEntry.fetch(seasonEntryPda);

      expect(entry.seasonId.toNumber()).to.equal(0);
      expect(entry.agent.toString()).to.equal(agentPda.toString());
      expect(entry.player.toString()).to.equal(player.publicKey.toString());
      expect(entry.score.toNumber()).to.equal(0);
      expect(season.totalEntries.toNumber()).to.equal(1);
      expect(season.totalPool.toNumber()).to.equal(ENTRY_FEE.toNumber());

      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      expect(playerBalanceBefore - playerBalanceAfter).to.be.at.least(ENTRY_FEE.toNumber());
    });

    it('Should allow second agent to enter season', async () => {
      [seasonEntry2Pda] = deriveSeasonEntryPda(seasonPda, agent2Pda, program.programId);

      await program.methods
        .enterSeason()
        .accounts({
          season: seasonPda,
          seasonEntry: seasonEntry2Pda,
          agent: agent2Pda,
          player: player2.publicKey,
          seasonVault: seasonVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      const season = await program.account.season.fetch(seasonPda);
      expect(season.totalEntries.toNumber()).to.equal(2);
      expect(season.totalPool.toNumber()).to.equal(ENTRY_FEE.toNumber() * 2);
    });

    it('Should fail to enter season twice with same agent', async () => {
      try {
        await program.methods
          .enterSeason()
          .accounts({
            season: seasonPda,
            seasonEntry: seasonEntryPda,
            agent: agentPda,
            player: player.publicKey,
            seasonVault: seasonVaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.toString()).to.include('already in use');
      }
    });
  });

  // ==========================================
  // Test Suite 5: Prediction Commitment
  // ==========================================
  describe('Prediction Commitment (Hash Submission)', () => {
    it('Should submit a prediction with stake', async () => {
      const predictionCount = new BN(0);
      [predictionPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      [predictionVaultPda] = derivePredictionVaultPda(predictionPda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);

      await program.methods
        .submitPrediction(Array.from(predictionHash), STAKE_AMOUNT)
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: predictionPda,
          player: player.publicKey,
          predictionVault: predictionVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const prediction = await program.account.prediction.fetch(predictionPda);
      const agent = await program.account.agent.fetch(agentPda);

      expect(prediction.agent.toString()).to.equal(agentPda.toString());
      expect(prediction.seasonId.toNumber()).to.equal(0);
      expect(Array.from(prediction.predictionHash)).to.deep.equal(Array.from(predictionHash));
      expect(prediction.stakeAmount.toNumber()).to.equal(STAKE_AMOUNT.toNumber());
      expect(prediction.status).to.deep.equal({ committed: {} });

      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      expect(playerBalanceBefore - playerBalanceAfter).to.be.at.least(STAKE_AMOUNT.toNumber());
    });

    it('Should submit a prediction without stake', async () => {
      const predictionCount = new BN(0);
      [prediction2Pda] = derivePredictionPda(
        agent2Pda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [predictionVault2Pda] = derivePredictionVaultPda(prediction2Pda, program.programId);

      const predictionData = generatePredictionData('ETH', 'down', 3000, 70);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agent2Pda,
          prediction: prediction2Pda,
          player: player2.publicKey,
          predictionVault: predictionVault2Pda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      const prediction = await program.account.prediction.fetch(prediction2Pda);
      expect(prediction.stakeAmount.toNumber()).to.equal(0);
      expect(prediction.status).to.deep.equal({ committed: {} });
    });

    it('Should submit multiple predictions with incremented count', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const nextPredictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [prediction3Pda] = derivePredictionPda(
        agentPda,
        seasonPda,
        nextPredictionCount,
        program.programId
      );
      const [predictionVault3Pda] = derivePredictionVaultPda(prediction3Pda, program.programId);

      const predictionData = generatePredictionData('SOL', 'up', 150, 90);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), STAKE_AMOUNT)
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: prediction3Pda,
          player: player.publicKey,
          predictionVault: predictionVault3Pda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const prediction = await program.account.prediction.fetch(prediction3Pda);
      expect(prediction.status).to.deep.equal({ committed: {} });
    });
  });

  // ==========================================
  // Test Suite 6: Prediction Reveal
  // ==========================================
  describe('Prediction Reveal', () => {
    it('Should reveal prediction with valid data', async () => {
      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);

      await program.methods
        .revealPrediction(predictionData)
        .accounts({
          prediction: predictionPda,
          agent: agentPda,
          player: player.publicKey,
        })
        .signers([player])
        .rpc();

      const prediction = await program.account.prediction.fetch(predictionPda);

      expect(prediction.predictionData).to.equal(predictionData);
      expect(prediction.status).to.deep.equal({ revealed: {} });
      expect(prediction.revealedAt.toNumber()).to.be.greaterThan(0);
    });

    it('Should reveal prediction without stake', async () => {
      const predictionData = generatePredictionData('ETH', 'down', 3000, 70);

      await program.methods
        .revealPrediction(predictionData)
        .accounts({
          prediction: prediction2Pda,
          agent: agent2Pda,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const prediction = await program.account.prediction.fetch(prediction2Pda);
      expect(prediction.predictionData).to.equal(predictionData);
      expect(prediction.status).to.deep.equal({ revealed: {} });
    });

    it('Should fail to reveal with invalid hash (tampered data)', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [tempPredictionPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [tempVaultPda] = derivePredictionVaultPda(tempPredictionPda, program.programId);

      const originalData = generatePredictionData('SOL', 'up', 150, 90);
      const predictionHash = generatePredictionHash(originalData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: tempPredictionPda,
          player: player.publicKey,
          predictionVault: tempVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const tamperedData = generatePredictionData('SOL', 'down', 150, 90);

      try {
        await program.methods
          .revealPrediction(tamperedData)
          .accounts({
            prediction: tempPredictionPda,
            agent: agentPda,
            player: player.publicKey,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.HashMismatch);
      }
    });

    it('Should fail to reveal already revealed prediction', async () => {
      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);

      try {
        await program.methods
          .revealPrediction(predictionData)
          .accounts({
            prediction: predictionPda,
            agent: agentPda,
            player: player.publicKey,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.InvalidPredictionStatus);
      }
    });
  });

  // ==========================================
  // Test Suite 7: Prediction Resolution & Scoring
  // ==========================================
  describe('Prediction Resolution & Score Calculation', () => {
    it('Should resolve prediction as correct', async () => {
      const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);
      
      await program.methods
        .resolvePrediction(true)
        .accounts({
          prediction: predictionPda,
          agent: agentPda,
          seasonEntry: seasonEntryPda,
          authority: authority.publicKey,
          predictionVault: predictionVaultPda,
          player: player.publicKey,
        })
        .signers([authority])
        .rpc();

      const prediction = await program.account.prediction.fetch(predictionPda);
      const agent = await program.account.agent.fetch(agentPda);
      const entry = await program.account.seasonEntry.fetch(seasonEntryPda);

      expect(prediction.wasCorrect).to.equal(true);
      expect(prediction.status).to.deep.equal({ resolved: {} });
      expect(agent.totalPredictions.toNumber()).to.equal(1);
      expect(agent.correctPredictions.toNumber()).to.equal(1);
      expect(agent.streak).to.equal(1);
      expect(agent.bestStreak).to.equal(1);
      expect(entry.predictionsMade.toNumber()).to.equal(1);
      expect(entry.predictionsCorrect.toNumber()).to.equal(1);
      expect(entry.score.toNumber()).to.be.greaterThan(0);

      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      expect(playerBalanceAfter - playerBalanceBefore).to.be.at.least(STAKE_AMOUNT.toNumber());
    });

    it('Should resolve prediction as incorrect', async () => {
      const agent = await program.account.agent.fetch(agent2Pda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [newPredictionPda] = derivePredictionPda(
        agent2Pda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [newVaultPda] = derivePredictionVaultPda(newPredictionPda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 80);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), STAKE_AMOUNT)
        .accounts({
          season: seasonPda,
          agent: agent2Pda,
          prediction: newPredictionPda,
          player: player2.publicKey,
          predictionVault: newVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      await program.methods
        .revealPrediction(predictionData)
        .accounts({
          prediction: newPredictionPda,
          agent: agent2Pda,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const player2BalanceBefore = await provider.connection.getBalance(player2.publicKey);

      await program.methods
        .resolvePrediction(false)
        .accounts({
          prediction: newPredictionPda,
          agent: agent2Pda,
          seasonEntry: seasonEntry2Pda,
          authority: authority.publicKey,
          predictionVault: newVaultPda,
          player: player2.publicKey,
        })
        .signers([authority])
        .rpc();

      const agent2 = await program.account.agent.fetch(agent2Pda);
      const entry2 = await program.account.seasonEntry.fetch(seasonEntry2Pda);

      expect(agent2.totalPredictions.toNumber()).to.be.greaterThan(0);
      expect(agent2.streak).to.equal(0);
      expect(entry2.score.toNumber()).to.equal(0);

      const player2BalanceAfter = await provider.connection.getBalance(player2.publicKey);
      expect(player2BalanceAfter - player2BalanceBefore).to.be.lessThan(STAKE_AMOUNT.toNumber());
    });

    it('Should calculate streak correctly on consecutive wins', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      let predictionCount = new BN(agent.totalPredictions.toNumber());

      for (let i = 0; i < 3; i++) {
        const [streakPredictionPda] = derivePredictionPda(
          agentPda,
          seasonPda,
          predictionCount,
          program.programId
        );
        const [streakVaultPda] = derivePredictionVaultPda(streakPredictionPda, program.programId);

        const predictionData = generatePredictionData('BTC', 'up', 50000 + i * 1000, 85);
        const predictionHash = generatePredictionHash(predictionData);

        await program.methods
          .submitPrediction(Array.from(predictionHash), new BN(0))
          .accounts({
            season: seasonPda,
            agent: agentPda,
            prediction: streakPredictionPda,
            player: player.publicKey,
            predictionVault: streakVaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player])
          .rpc();

        await program.methods
          .revealPrediction(predictionData)
          .accounts({
            prediction: streakPredictionPda,
            agent: agentPda,
            player: player.publicKey,
          })
          .signers([player])
          .rpc();

        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: streakPredictionPda,
            agent: agentPda,
            seasonEntry: seasonEntryPda,
            authority: authority.publicKey,
            predictionVault: streakVaultPda,
            player: player.publicKey,
          })
          .signers([authority])
          .rpc();

        predictionCount = predictionCount.add(new BN(1));
      }

      const finalAgent = await program.account.agent.fetch(agentPda);
      expect(finalAgent.streak).to.be.greaterThan(1);
      expect(finalAgent.bestStreak).to.be.greaterThanOrEqual(finalAgent.streak);
    });

    it('Should fail to resolve already resolved prediction', async () => {
      try {
        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: predictionPda,
            agent: agentPda,
            seasonEntry: seasonEntryPda,
            authority: authority.publicKey,
            predictionVault: predictionVaultPda,
            player: player.publicKey,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.InvalidPredictionStatus);
      }
    });

    it('Should fail to resolve unrevealed prediction', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [unrevealedPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [unrevealedVaultPda] = derivePredictionVaultPda(unrevealedPda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: unrevealedPda,
          player: player.publicKey,
          predictionVault: unrevealedVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      try {
        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: unrevealedPda,
            agent: agentPda,
            seasonEntry: seasonEntryPda,
            authority: authority.publicKey,
            predictionVault: unrevealedVaultPda,
            player: player.publicKey,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.InvalidPredictionStatus);
      }
    });
  });

  // ==========================================
  // Test Suite 8: Rank Updates
  // ==========================================
  describe('Rank Updates', () => {
    it('Should update agent rank based on performance', async () => {
      const highPerformer = web3.Keypair.generate();
      await airdrop(provider, highPerformer, 5);

      const [highAgentPda] = deriveAgentPda(highPerformer.publicKey, program.programId);
      
      await program.methods
        .registerAgent('HighPerformer', 'https://api.high.com')
        .accounts({
          agent: highAgentPda,
          arena: arenaPda,
          owner: highPerformer.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([highPerformer])
        .rpc();

      const [highEntryPda] = deriveSeasonEntryPda(seasonPda, highAgentPda, program.programId);

      await program.methods
        .enterSeason()
        .accounts({
          season: seasonPda,
          seasonEntry: highEntryPda,
          agent: highAgentPda,
          player: highPerformer.publicKey,
          seasonVault: seasonVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([highPerformer])
        .rpc();

      for (let i = 0; i < 10; i++) {
        const [predPda] = derivePredictionPda(
          highAgentPda,
          seasonPda,
          new BN(i),
          program.programId
        );
        const [vaultPda] = derivePredictionVaultPda(predPda, program.programId);

        const predictionData = generatePredictionData('BTC', 'up', 50000 + i * 100, 90);
        const predictionHash = generatePredictionHash(predictionData);

        await program.methods
          .submitPrediction(Array.from(predictionHash), new BN(0))
          .accounts({
            season: seasonPda,
            agent: highAgentPda,
            prediction: predPda,
            player: highPerformer.publicKey,
            predictionVault: vaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([highPerformer])
          .rpc();

        await program.methods
          .revealPrediction(predictionData)
          .accounts({
            prediction: predPda,
            agent: highAgentPda,
            player: highPerformer.publicKey,
          })
          .signers([highPerformer])
          .rpc();

        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: predPda,
            agent: highAgentPda,
            seasonEntry: highEntryPda,
            authority: authority.publicKey,
            predictionVault: vaultPda,
            player: highPerformer.publicKey,
          })
          .signers([authority])
          .rpc();
      }

      const agent = await program.account.agent.fetch(highAgentPda);
      expect(agent.correctPredictions.toNumber()).to.equal(10);
      expect(agent.streak).to.be.greaterThanOrEqual(10);
      
      const rankKeys = Object.keys(agent.rank);
      expect(['gold', 'diamond', 'legend']).to.include(rankKeys[0]);
    });
  });

  // ==========================================
  // Test Suite 9: Achievement Awards
  // ==========================================
  describe('Achievement Awards', () => {
    it('Should award achievement to agent', async () => {
      const reputationScore = new BN(0);
      const [achievementPda] = deriveAchievementPda(
        agentPda,
        reputationScore,
        program.programId
      );

      await program.methods
        .awardAchievement({ firstWin: {} })
        .accounts({
          agent: agentPda,
          achievement: achievementPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const achievement = await program.account.achievement.fetch(achievementPda);
      const agent = await program.account.agent.fetch(agentPda);

      expect(achievement.agent.toString()).to.equal(agentPda.toString());
      expect(achievement.achievementType).to.deep.equal({ firstWin: {} });
      expect(agent.reputationScore).to.be.greaterThan(0);
    });

    it('Should award streak achievements', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const reputationScore = new BN(agent.reputationScore);
      
      const [achievementPda] = deriveAchievementPda(
        agentPda,
        reputationScore,
        program.programId
      );

      await program.methods
        .awardAchievement({ streak5: {} })
        .accounts({
          agent: agentPda,
          achievement: achievementPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const achievement = await program.account.achievement.fetch(achievementPda);
      expect(achievement.achievementType).to.deep.equal({ streak5: {} });
    });

    it('Should award rank achievements', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const reputationScore = new BN(agent.reputationScore);
      
      const [achievementPda] = deriveAchievementPda(
        agentPda,
        reputationScore,
        program.programId
      );

      await program.methods
        .awardAchievement({ rankSilver: {} })
        .accounts({
          agent: agentPda,
          achievement: achievementPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const updatedAgent = await program.account.agent.fetch(agentPda);
      expect(updatedAgent.reputationScore).to.be.greaterThan(agent.reputationScore);
    });
  });

  // ==========================================
  // Test Suite 10: Prize Distribution
  // ==========================================
  describe('Prize Distribution', () => {
    it('Should distribute prizes at season end', async () => {
      const shortSeasonId = new BN(999);
      const [shortSeasonPda] = deriveSeasonPda(shortSeasonId, program.programId);

      await program.methods
        .createSeason(ENTRY_FEE, TEST_CONSTANTS.DURATION_DAYS_SHORT, PRIZE_POOL_BPS)
        .accounts({
          season: shortSeasonPda,
          arena: arenaPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 2000));

      await program.methods
        .distributePrizes()
        .accounts({
          season: shortSeasonPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const season = await program.account.season.fetch(shortSeasonPda);
      expect(season.status).to.deep.equal({ completed: {} });
    });

    it('Should fail to distribute prizes before season end', async () => {
      try {
        await program.methods
          .distributePrizes()
          .accounts({
            season: seasonPda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.SeasonNotEnded);
      }
    });

    it('Should fail to distribute prizes twice', async () => {
      const shortSeasonId = new BN(998);
      const [shortSeasonPda] = deriveSeasonPda(shortSeasonId, program.programId);

      await program.methods
        .createSeason(ENTRY_FEE, TEST_CONSTANTS.DURATION_DAYS_SHORT, PRIZE_POOL_BPS)
        .accounts({
          season: shortSeasonPda,
          arena: arenaPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 1000));

      await program.methods
        .distributePrizes()
        .accounts({
          season: shortSeasonPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .distributePrizes()
          .accounts({
            season: shortSeasonPda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.InvalidSeasonStatus);
      }
    });
  });

  // ==========================================
  // Test Suite 11: Edge Cases & Security
  // ==========================================
  describe('Edge Cases & Security', () => {
    it('Should fail to enter completed season', async () => {
      const seasonId = new BN(997);
      const [completedSeasonPda] = deriveSeasonPda(seasonId, program.programId);

      await program.methods
        .createSeason(ENTRY_FEE, TEST_CONSTANTS.DURATION_DAYS_SHORT, PRIZE_POOL_BPS)
        .accounts({
          season: completedSeasonPda,
          arena: arenaPda,
          authority: authority.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 1000));

      await program.methods
        .distributePrizes()
        .accounts({
          season: completedSeasonPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const [testEntryPda] = deriveSeasonEntryPda(
        completedSeasonPda,
        agentPda,
        program.programId
      );
      const [testVaultPda] = deriveSeasonVaultPda(completedSeasonPda, program.programId);

      try {
        await program.methods
          .enterSeason()
          .accounts({
            season: completedSeasonPda,
            seasonEntry: testEntryPda,
            agent: agentPda,
            player: player.publicKey,
            seasonVault: testVaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.error.errorMessage).to.include(ERROR_CODES.SeasonNotActive);
      }
    });

    it('Should fail unauthorized resolve attempt', async () => {
      const unauthorized = web3.Keypair.generate();
      await airdrop(provider, unauthorized);

      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [testPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [testVaultPda] = derivePredictionVaultPda(testPda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: testPda,
          player: player.publicKey,
          predictionVault: testVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      await program.methods
        .revealPrediction(predictionData)
        .accounts({
          prediction: testPda,
          agent: agentPda,
          player: player.publicKey,
        })
        .signers([player])
        .rpc();

      try {
        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: testPda,
            agent: agentPda,
            seasonEntry: seasonEntryPda,
            authority: unauthorized.publicKey,
            predictionVault: testVaultPda,
            player: player.publicKey,
          })
          .signers([unauthorized])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.toString()).to.include('unknown signer');
      }
    });

    it('Should handle empty prediction data reveal', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [emptyPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [emptyVaultPda] = derivePredictionVaultPda(emptyPda, program.programId);

      const emptyData = '';
      const emptyHash = generatePredictionHash(emptyData);

      await program.methods
        .submitPrediction(Array.from(emptyHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: emptyPda,
          player: player.publicKey,
          predictionVault: emptyVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      await program.methods
        .revealPrediction(emptyData)
        .accounts({
          prediction: emptyPda,
          agent: agentPda,
          player: player.publicKey,
        })
        .signers([player])
        .rpc();

      const prediction = await program.account.prediction.fetch(emptyPda);
      expect(prediction.predictionData).to.equal('');
      expect(prediction.status).to.deep.equal({ revealed: {} });
    });

    it('Should prevent double submission with same prediction count', async () => {
      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [doublePda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [doubleVaultPda] = derivePredictionVaultPda(doublePda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: doublePda,
          player: player.publicKey,
          predictionVault: doubleVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      try {
        await program.methods
          .submitPrediction(Array.from(predictionHash), new BN(0))
          .accounts({
            season: seasonPda,
            agent: agentPda,
            prediction: doublePda,
            player: player.publicKey,
            predictionVault: doubleVaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([player])
          .rpc();
        
        assert.fail('Should have thrown an error');
      } catch (error) {
        expect(error.toString()).to.include('already in use');
      }
    });

    it('Should handle large stake amounts correctly', async () => {
      const largeStake = new BN(TEST_CONSTANTS.LARGE_STAKE_LAMPORTS);
      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [largeStakePda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [largeVaultPda] = derivePredictionVaultPda(largeStakePda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);

      await program.methods
        .submitPrediction(Array.from(predictionHash), largeStake)
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: largeStakePda,
          player: player.publicKey,
          predictionVault: largeVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      const vaultBalance = await provider.connection.getBalance(largeVaultPda);

      expect(playerBalanceBefore - playerBalanceAfter).to.be.at.least(largeStake.toNumber());
      expect(vaultBalance).to.be.at.least(largeStake.toNumber());

      await program.methods
        .revealPrediction(predictionData)
        .accounts({
          prediction: largeStakePda,
          agent: agentPda,
          player: player.publicKey,
        })
        .signers([player])
        .rpc();

      const balanceBeforeResolve = await provider.connection.getBalance(player.publicKey);

      await program.methods
        .resolvePrediction(true)
        .accounts({
          prediction: largeStakePda,
          agent: agentPda,
          seasonEntry: seasonEntryPda,
          authority: authority.publicKey,
          predictionVault: largeVaultPda,
          player: player.publicKey,
        })
        .signers([authority])
        .rpc();

      const balanceAfterResolve = await provider.connection.getBalance(player.publicKey);
      expect(balanceAfterResolve - balanceBeforeResolve).to.be.at.least(largeStake.toNumber());
    });

    it('Should maintain correct score calculation with streak multiplier', async () => {
      const scoreAgent = web3.Keypair.generate();
      await airdrop(provider, scoreAgent, 5);

      const [scoreAgentPda] = deriveAgentPda(scoreAgent.publicKey, program.programId);
      
      await program.methods
        .registerAgent('ScoreTest', 'https://api.score.com')
        .accounts({
          agent: scoreAgentPda,
          arena: arenaPda,
          owner: scoreAgent.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([scoreAgent])
        .rpc();

      const [scoreEntryPda] = deriveSeasonEntryPda(seasonPda, scoreAgentPda, program.programId);

      await program.methods
        .enterSeason()
        .accounts({
          season: seasonPda,
          seasonEntry: scoreEntryPda,
          agent: scoreAgentPda,
          player: scoreAgent.publicKey,
          seasonVault: seasonVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([scoreAgent])
        .rpc();

      const stakeAmount = new BN(100_000_000);
      let totalScore = 0;
      let expectedStreakMultiplier = 100;

      for (let i = 0; i < 5; i++) {
        const [predPda] = derivePredictionPda(
          scoreAgentPda,
          seasonPda,
          new BN(i),
          program.programId
        );
        const [vaultPda] = derivePredictionVaultPda(predPda, program.programId);

        const predictionData = generatePredictionData('BTC', 'up', 50000 + i * 100, 90);
        const predictionHash = generatePredictionHash(predictionData);

        await program.methods
          .submitPrediction(Array.from(predictionHash), stakeAmount)
          .accounts({
            season: seasonPda,
            agent: scoreAgentPda,
            prediction: predPda,
            player: scoreAgent.publicKey,
            predictionVault: vaultPda,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([scoreAgent])
          .rpc();

        await program.methods
          .revealPrediction(predictionData)
          .accounts({
            prediction: predPda,
            agent: scoreAgentPda,
            player: scoreAgent.publicKey,
          })
          .signers([scoreAgent])
          .rpc();

        await program.methods
          .resolvePrediction(true)
          .accounts({
            prediction: predPda,
            agent: scoreAgentPda,
            seasonEntry: scoreEntryPda,
            authority: authority.publicKey,
            predictionVault: vaultPda,
            player: scoreAgent.publicKey,
          })
          .signers([authority])
          .rpc();

        const roundScore = stakeAmount.toNumber() * expectedStreakMultiplier / 100;
        totalScore += roundScore;
        expectedStreakMultiplier += 10;
      }

      const entry = await program.account.seasonEntry.fetch(scoreEntryPda);
      expect(entry.score.toNumber()).to.equal(totalScore);
      expect(entry.predictionsCorrect.toNumber()).to.equal(5);
    });
  });

  // ==========================================
  // Test Suite 12: Event Emission
  // ==========================================
  describe('Event Emission', () => {
    it('Should emit AgentRegistered event', async () => {
      const eventListener = program.addEventListener('agentRegistered', (event) => {
        expect(event.name).to.equal('EventTestAgent');
      });

      const eventAgent = web3.Keypair.generate();
      await airdrop(provider, eventAgent);

      const [eventAgentPda] = deriveAgentPda(eventAgent.publicKey, program.programId);

      await program.methods
        .registerAgent('EventTestAgent', 'https://api.event.com')
        .accounts({
          agent: eventAgentPda,
          arena: arenaPda,
          owner: eventAgent.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([eventAgent])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 500));
      
      await program.removeEventListener(eventListener);
    });

    it('Should emit PredictionSubmitted event', async () => {
      const eventListener = program.addEventListener('predictionSubmitted', (event) => {
        expect(event.seasonId.toNumber()).to.equal(0);
      });

      const agent = await program.account.agent.fetch(agentPda);
      const predictionCount = new BN(agent.totalPredictions.toNumber());
      
      const [eventPredPda] = derivePredictionPda(
        agentPda,
        seasonPda,
        predictionCount,
        program.programId
      );
      const [eventVaultPda] = derivePredictionVaultPda(eventPredPda, program.programId);

      const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
      const predictionHash = generatePredictionHash(predictionData);

      await program.methods
        .submitPrediction(Array.from(predictionHash), new BN(0))
        .accounts({
          season: seasonPda,
          agent: agentPda,
          prediction: eventPredPda,
          player: player.publicKey,
          predictionVault: eventVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 500));
      
      await program.removeEventListener(eventListener);
    });
  });
});
