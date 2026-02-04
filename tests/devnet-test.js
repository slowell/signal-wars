const anchor = require('@coral-xyz/anchor');
const { Program, AnchorProvider, web3, BN } = anchor;
const { createHash } = require('crypto');
const fs = require('fs');

/**
 * Signal Wars Devnet Test Script
 * Tests the deployed program on devnet
 */

// Program ID on devnet
const PROGRAM_ID = new web3.PublicKey('4ndoaBaBTQEDxV6pqW812wWhsMSiGEkT2rp4igCXXbm1');
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Test wallet (from the keypair file)
const walletKeypair = web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync('/Users/openclaw/.config/solana/id.json', 'utf8')))
);

console.log('=== Signal Wars Devnet Test ===');
console.log('Wallet:', walletKeypair.publicKey.toString());
console.log('Program ID:', PROGRAM_ID.toString());

// Create connection and provider
const connection = new web3.Connection(DEVNET_RPC, 'confirmed');
const wallet = new anchor.Wallet(walletKeypair);
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
  preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

// Load the IDL
const idl = JSON.parse(fs.readFileSync('/Users/openclaw/.openclaw/workspace/signal-wars/programs/signal-wars/target/idl/signal_wars.json', 'utf8'));
const program = new Program(idl, PROGRAM_ID, provider);

// Test state
let arenaPda;
let agentPda;
let seasonPda;
let seasonEntryPda;
let predictionPda;
let seasonVaultPda;
let predictionVaultPda;

// Constants
const ENTRY_FEE = new BN(0.1 * web3.LAMPORTS_PER_SOL);
const STAKE_AMOUNT = new BN(0.05 * web3.LAMPORTS_PER_SOL);
const DURATION_DAYS = 7;
const PRIZE_POOL_BPS = 9000;

// PDA Derivation Helpers
function deriveArenaPda(programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('arena')],
    programId
  );
}

function deriveAgentPda(owner, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), owner.toBuffer()],
    programId
  );
}

function deriveSeasonPda(seasonId, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('season'), seasonId.toArrayLike(Buffer, 'le', 8)],
    programId
  );
}

function deriveSeasonEntryPda(season, agent, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('entry'), season.toBuffer(), agent.toBuffer()],
    programId
  );
}

function derivePredictionPda(agent, season, predictionCount, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('prediction'),
      agent.toBuffer(),
      season.toBuffer(),
      predictionCount.toArrayLike(Buffer, 'le', 8),
    ],
    programId
  );
}

function deriveSeasonVaultPda(season, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), season.toBuffer()],
    programId
  );
}

function derivePredictionVaultPda(prediction, programId) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('prediction_vault'), prediction.toBuffer()],
    programId
  );
}

function generatePredictionHash(predictionData) {
  const hash = createHash('sha256').update(predictionData).digest();
  return Buffer.from(hash);
}

function generatePredictionData(asset, direction, targetPrice, confidence) {
  return JSON.stringify({
    asset,
    direction,
    targetPrice,
    confidence,
    timestamp: Date.now(),
  });
}

// Transaction result tracking
const txResults = [];

async function recordTx(name, signature) {
  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  txResults.push({ name, signature, explorer });
  console.log(`✅ ${name}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Explorer: ${explorer}`);
  return signature;
}

async function main() {
  try {
    // ==========================================
    // 1. Initialize Arena
    // ==========================================
    console.log('\n--- Step 1: Initialize Arena ---');
    [arenaPda] = deriveArenaPda(program.programId);
    console.log('Arena PDA:', arenaPda.toString());

    try {
      const tx = await program.methods
        .initializeArena()
        .accounts({
          arena: arenaPda,
          authority: walletKeypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([walletKeypair])
        .rpc();
      await recordTx('Initialize Arena', tx);
    } catch (e) {
      if (e.toString().includes('already in use')) {
        console.log('⚠️ Arena already initialized, fetching existing...');
        const arena = await program.account.arena.fetch(arenaPda);
        console.log('   Existing arena - Authority:', arena.authority.toString());
        console.log('   Total Seasons:', arena.totalSeasons.toNumber());
        console.log('   Total Agents:', arena.totalAgents.toNumber());
      } else {
        throw e;
      }
    }

    // ==========================================
    // 2. Register Agent
    // ==========================================
    console.log('\n--- Step 2: Register Agent ---');
    [agentPda] = deriveAgentPda(walletKeypair.publicKey, program.programId);
    console.log('Agent PDA:', agentPda.toString());

    const agentName = 'TestBot';
    const agentEndpoint = 'https://example.com/predict';

    try {
      const tx = await program.methods
        .registerAgent(agentName, agentEndpoint)
        .accounts({
          agent: agentPda,
          arena: arenaPda,
          owner: walletKeypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([walletKeypair])
        .rpc();
      await recordTx('Register Agent', tx);

      const agent = await program.account.agent.fetch(agentPda);
      console.log('   Agent Name:', agent.name);
      console.log('   Endpoint:', agent.endpoint);
    } catch (e) {
      if (e.toString().includes('already in use')) {
        console.log('⚠️ Agent already registered, fetching existing...');
        const agent = await program.account.agent.fetch(agentPda);
        console.log('   Existing agent - Name:', agent.name);
        console.log('   Total Predictions:', agent.totalPredictions.toNumber());
      } else {
        throw e;
      }
    }

    // ==========================================
    // 3. Create/Initialize Season
    // ==========================================
    console.log('\n--- Step 3: Create Season ---');
    const arena = await program.account.arena.fetch(arenaPda);
    const seasonId = new BN(arena.totalSeasons.toNumber());
    [seasonPda] = deriveSeasonPda(seasonId, program.programId);
    console.log('Season ID:', seasonId.toNumber());
    console.log('Season PDA:', seasonPda.toString());

    try {
      const tx = await program.methods
        .createSeason(ENTRY_FEE, DURATION_DAYS, PRIZE_POOL_BPS)
        .accounts({
          season: seasonPda,
          arena: arenaPda,
          authority: walletKeypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([walletKeypair])
        .rpc();
      await recordTx('Create Season', tx);

      const season = await program.account.season.fetch(seasonPda);
      console.log('   Entry Fee:', season.entryFee.toNumber() / web3.LAMPORTS_PER_SOL, 'SOL');
      console.log('   Duration:', season.durationDays, 'days');
      console.log('   Prize Pool BPS:', season.prizePoolBps);
    } catch (e) {
      if (e.toString().includes('already in use')) {
        console.log('⚠️ Season already exists, fetching existing...');
        const season = await program.account.season.fetch(seasonPda);
        console.log('   Existing season - Entry Fee:', season.entryFee.toNumber() / web3.LAMPORTS_PER_SOL, 'SOL');
        console.log('   Status:', JSON.stringify(season.status));
      } else {
        throw e;
      }
    }

    // ==========================================
    // 4. Enter Season
    // ==========================================
    console.log('\n--- Step 4: Enter Season ---');
    [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda, program.programId);
    [seasonVaultPda] = deriveSeasonVaultPda(seasonPda, program.programId);
    console.log('Season Entry PDA:', seasonEntryPda.toString());
    console.log('Season Vault PDA:', seasonVaultPda.toString());

    try {
      const balanceBefore = await connection.getBalance(walletKeypair.publicKey);
      
      const tx = await program.methods
        .enterSeason()
        .accounts({
          season: seasonPda,
          seasonEntry: seasonEntryPda,
          agent: agentPda,
          player: walletKeypair.publicKey,
          seasonVault: seasonVaultPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([walletKeypair])
        .rpc();
      await recordTx('Enter Season', tx);

      const balanceAfter = await connection.getBalance(walletKeypair.publicKey);
      const entryFeePaid = (balanceBefore - balanceAfter) / web3.LAMPORTS_PER_SOL;
      console.log(`   Entry fee paid: ~${entryFeePaid.toFixed(4)} SOL`);

      const season = await program.account.season.fetch(seasonPda);
      console.log('   Total entries:', season.totalEntries.toNumber());
      console.log('   Total pool:', season.totalPool.toNumber() / web3.LAMPORTS_PER_SOL, 'SOL');
    } catch (e) {
      if (e.toString().includes('already in use')) {
        console.log('⚠️ Already entered this season');
      } else {
        throw e;
      }
    }

    // ==========================================
    // 5. Submit Prediction (Hashed Commit)
    // ==========================================
    console.log('\n--- Step 5: Submit Prediction ---');
    const agent = await program.account.agent.fetch(agentPda);
    const predictionCount = new BN(agent.totalPredictions.toNumber());
    [predictionPda] = derivePredictionPda(agentPda, seasonPda, predictionCount, program.programId);
    [predictionVaultPda] = derivePredictionVaultPda(predictionPda, program.programId);
    console.log('Prediction Count:', predictionCount.toNumber());
    console.log('Prediction PDA:', predictionPda.toString());
    console.log('Prediction Vault PDA:', predictionVaultPda.toString());

    const predictionData = generatePredictionData('BTC', 'up', 50000, 85);
    const predictionHash = generatePredictionHash(predictionData);
    
    console.log('Prediction Data:', predictionData);
    console.log('Prediction Hash (SHA-256):', predictionHash.toString('hex'));

    const tx = await program.methods
      .submitPrediction(Array.from(predictionHash), STAKE_AMOUNT)
      .accounts({
        season: seasonPda,
        agent: agentPda,
        prediction: predictionPda,
        player: walletKeypair.publicKey,
        predictionVault: predictionVaultPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([walletKeypair])
      .rpc();
    await recordTx('Submit Prediction', tx);

    const prediction = await program.account.prediction.fetch(predictionPda);
    console.log('   Status:', JSON.stringify(prediction.status));
    console.log('   Stake Amount:', prediction.stakeAmount.toNumber() / web3.LAMPORTS_PER_SOL, 'SOL');

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n=== Test Summary ===');
    console.log('All transactions completed successfully!');
    console.log('\nTransaction Signatures:');
    txResults.forEach((result, i) => {
      console.log(`${i + 1}. ${result.name}`);
      console.log(`   Sig: ${result.signature}`);
      console.log(`   Link: ${result.explorer}`);
    });

    console.log('\n=== Account PDAs ===');
    console.log('Arena:', arenaPda.toString());
    console.log('Agent:', agentPda.toString());
    console.log('Season:', seasonPda.toString());
    console.log('Season Entry:', seasonEntryPda.toString());
    console.log('Prediction:', predictionPda.toString());

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    if (error.logs) {
      console.error('\nProgram logs:');
      error.logs.forEach((log) => console.error(log));
    }
    process.exit(1);
  }
}

main();
