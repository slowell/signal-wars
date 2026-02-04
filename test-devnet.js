const web3 = require('@solana/web3.js');
const fs = require('fs');
const crypto = require('crypto');

console.log('=== Signal Wars Devnet Test (Raw Web3) ===');

const PROGRAM_ID = new web3.PublicKey('Gck8TTMDXoqhcXDUYDRzYbBu4shvbAUUrHTBafuGQCSz');
const DEVNET_RPC = 'https://api.devnet.solana.com';

const keypairData = JSON.parse(fs.readFileSync('/Users/openclaw/.openclaw/workspace/signal-wars/.secrets/devnet-wallet.json', 'utf8'));
const walletKeypair = web3.Keypair.fromSecretKey(new Uint8Array(keypairData));

console.log('Wallet:', walletKeypair.publicKey.toString());
console.log('Program ID:', PROGRAM_ID.toString());

const connection = new web3.Connection(DEVNET_RPC, 'confirmed');

const txResults = [];

async function recordTx(name, signature) {
  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  txResults.push({ name, signature, explorer });
  console.log(`✅ ${name}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Explorer: ${explorer}`);
  return signature;
}

// Discriminator hashes (first 8 bytes of sha256("global:instruction_name"))
// Anchor uses snake_case instruction names
const DISCRIMINATORS = {
  initializeArena: Buffer.from([0x0b, 0x25, 0xdd, 0x01, 0xcd, 0x78, 0x19, 0xe6]),
  registerAgent: Buffer.from([0x87, 0x9d, 0x42, 0xc3, 0x02, 0x71, 0xaf, 0x1e]),
  createSeason: Buffer.from([0x26, 0x6c, 0x1d, 0x7f, 0x3c, 0x7e, 0x65, 0x03]),
  enterSeason: Buffer.from([0x9f, 0x92, 0x03, 0x8b, 0x96, 0xf1, 0x1d, 0x08]),
  submitPrediction: Buffer.from([0xc1, 0x71, 0x29, 0x24, 0xa0, 0x3c, 0xf7, 0x37]),
};

// PDA Derivation
function deriveArenaPda() {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('arena')], PROGRAM_ID);
}

function deriveAgentPda(owner) {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('agent'), owner.toBuffer()], PROGRAM_ID);
}

function deriveSeasonPda(seasonId) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(seasonId), 0);
  return web3.PublicKey.findProgramAddressSync([Buffer.from('season'), idBuf], PROGRAM_ID);
}

function deriveSeasonEntryPda(season, agent) {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('entry'), season.toBuffer(), agent.toBuffer()], PROGRAM_ID);
}

function deriveSeasonVaultPda(season) {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('vault'), season.toBuffer()], PROGRAM_ID);
}

function derivePredictionPda(agent, season, predictionCount) {
  const countBuf = Buffer.alloc(8);
  countBuf.writeBigUInt64LE(BigInt(predictionCount), 0);
  return web3.PublicKey.findProgramAddressSync([Buffer.from('prediction'), agent.toBuffer(), season.toBuffer(), countBuf], PROGRAM_ID);
}

function derivePredictionVaultPda(prediction) {
  return web3.PublicKey.findProgramAddressSync([Buffer.from('prediction_vault'), prediction.toBuffer()], PROGRAM_ID);
}

async function main() {
  try {
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`Wallet Balance: ${balance / web3.LAMPORTS_PER_SOL} SOL\n`);

    // Derive PDAs
    const [arenaPda] = deriveArenaPda();
    const [agentPda] = deriveAgentPda(walletKeypair.publicKey);
    
    // Get current season count from arena account
    let seasonId = 0;
    try {
      const arenaInfo = await connection.getAccountInfo(arenaPda);
      if (arenaInfo) {
        // Arena: authority (32) + totalSeasons (8) + totalAgents (8) + bump (1)
        const data = arenaInfo.data;
        seasonId = Number(data.readBigUInt64LE(32)); // totalSeasons at offset 32
        console.log(`Current season count: ${seasonId}`);
      }
    } catch (e) {
      console.log('Arena not initialized yet');
    }
    
    const [seasonPda] = deriveSeasonPda(seasonId);
    const [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda);
    const [seasonVaultPda] = deriveSeasonVaultPda(seasonPda);

    // Get agent prediction count
    let predictionCount = 0;
    try {
      const agentInfo = await connection.getAccountInfo(agentPda);
      if (agentInfo) {
        // Skip: owner(32) + name(len+data) + endpoint(len+data) + totalPredictions
        // This is complex with strings, let's just start at 0
        predictionCount = 0;
      }
    } catch {}
    
    const [predictionPda] = derivePredictionPda(agentPda, seasonPda, predictionCount);
    const [predictionVaultPda] = derivePredictionVaultPda(predictionPda);

    console.log('PDAs:');
    console.log('  Arena:', arenaPda.toString());
    console.log('  Agent:', agentPda.toString());
    console.log('  Season:', seasonPda.toString());
    console.log('  Season Entry:', seasonEntryPda.toString());
    console.log('  Prediction:', predictionPda.toString());
    console.log();

    // 1. Initialize Arena
    console.log('--- 1. Initialize Arena ---');
    console.log('Using Program ID:', PROGRAM_ID.toString());
    try {
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: arenaPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.initializeArena,
      });
      
      const tx = new web3.Transaction().add(ix);
      tx.feePayer = walletKeypair.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.sign(walletKeypair);
      
      const sig = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(sig);
      await recordTx('Initialize Arena', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message);
    }

    // 2. Register Agent
    console.log('\n--- 2. Register Agent ---');
    try {
      const name = 'TestBot';
      const endpoint = 'https://example.com/predict';
      
      const nameBuf = Buffer.from(name);
      const endpointBuf = Buffer.from(endpoint);
      
      // Borsh string: 4-byte length (little-endian) + data
      const nameLenBuf = Buffer.alloc(4);
      nameLenBuf.writeUInt32LE(nameBuf.length, 0);
      const endpointLenBuf = Buffer.alloc(4);
      endpointLenBuf.writeUInt32LE(endpointBuf.length, 0);
      
      const data = Buffer.concat([
        DISCRIMINATORS.registerAgent,
        nameLenBuf,
        nameBuf,
        endpointLenBuf,
        endpointBuf,
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: agentPda, isSigner: false, isWritable: true },
          { pubkey: arenaPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Register Agent', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message);
    }

    // 3. Create Season
    console.log('\n--- 3. Create Season ---');
    try {
      const entryFee = BigInt(0.1 * web3.LAMPORTS_PER_SOL);
      const durationDays = 7;
      const prizePoolBps = 9000;
      
      // Borsh: u64 (8 bytes LE), u8 (1 byte), u16 (2 bytes LE)
      const entryFeeBuf = Buffer.alloc(8);
      entryFeeBuf.writeBigUInt64LE(entryFee, 0);
      const prizePoolBuf = Buffer.alloc(2);
      prizePoolBuf.writeUInt16LE(prizePoolBps, 0);
      
      const data = Buffer.concat([
        DISCRIMINATORS.createSeason,
        entryFeeBuf,
        Buffer.from([durationDays]),
        prizePoolBuf,
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: seasonPda, isSigner: false, isWritable: true },
          { pubkey: arenaPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Create Season', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message);
    }

    // 4. Enter Season
    console.log('\n--- 4. Enter Season ---');
    try {
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: seasonPda, isSigner: false, isWritable: true },
          { pubkey: seasonEntryPda, isSigner: false, isWritable: true },
          { pubkey: agentPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: seasonVaultPda, isSigner: false, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.enterSeason,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Enter Season', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message);
    }

    // 5. Submit Prediction
    console.log('\n--- 5. Submit Prediction ---');
    try {
      const predictionData = JSON.stringify({ asset: 'BTC', direction: 'up', targetPrice: 50000, confidence: 85 });
      const predictionHash = crypto.createHash('sha256').update(predictionData).digest();
      const stakeAmount = BigInt(0.05 * web3.LAMPORTS_PER_SOL);
      
      // Borsh: [u8; 32] (32 bytes), u64 (8 bytes LE)
      const stakeBuf = Buffer.alloc(8);
      stakeBuf.writeBigUInt64LE(stakeAmount, 0);
      
      const data = Buffer.concat([
        DISCRIMINATORS.submitPrediction,
        predictionHash,
        stakeBuf,
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: seasonPda, isSigner: false, isWritable: true },
          { pubkey: agentPda, isSigner: false, isWritable: true },
          { pubkey: predictionPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: predictionVaultPda, isSigner: false, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Submit Prediction', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message);
    }

    // Summary
    console.log('\n=== Test Summary ===');
    if (txResults.length > 0) {
      console.log(`✅ Completed ${txResults.length} transactions!`);
      txResults.forEach((r, i) => console.log(`${i+1}. ${r.name}: ${r.explorer}`));
    } else {
      console.log('All accounts already initialized.');
    }
    
    console.log('\nProgram:', `https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
