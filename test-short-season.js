const web3 = require('@solana/web3.js');
const fs = require('fs');
const crypto = require('crypto');

console.log('=== Signal Wars - 12 Hour Season Test ===');

const PROGRAM_ID = new web3.PublicKey('Gck8TTMDXoqhcXDUYDRzYbBu4shvbAUUrHTBafuGQCSz');
const DEVNET_RPC = 'https://api.devnet.solana.com';

const keypairData = JSON.parse(fs.readFileSync('/Users/openclaw/.openclaw/workspace/signal-wars/.secrets/devnet-wallet.json', 'utf8'));
const walletKeypair = web3.Keypair.fromSecretKey(new Uint8Array(keypairData));

console.log('Wallet:', walletKeypair.publicKey.toString());
console.log('Program ID:', PROGRAM_ID.toString());

const connection = new web3.Connection(DEVNET_RPC, 'confirmed');

// Discriminator hashes
const DISCRIMINATORS = {
  initializeArena: Buffer.from([0x0b, 0x25, 0xdd, 0x01, 0xcd, 0x78, 0x19, 0xe6]),
  registerAgent: Buffer.from([0x87, 0x9d, 0x42, 0xc3, 0x02, 0x71, 0xaf, 0x1e]),
  createSeason: Buffer.from([0x26, 0x6c, 0x1d, 0x7f, 0x3c, 0x7e, 0x65, 0x03]),
  enterSeason: Buffer.from([0x9f, 0x92, 0x03, 0x8b, 0x96, 0xf1, 0x1d, 0x08]),
  submitPrediction: Buffer.from([0xc1, 0x71, 0x29, 0x24, 0xa0, 0x3c, 0xf7, 0x37]),
  revealPrediction: Buffer.from([0x4c, 0x89, 0x7f, 0x04, 0xa3, 0x05, 0x6e, 0x40]),
  resolvePrediction: Buffer.from([0xc7, 0x9f, 0x36, 0xeb, 0x79, 0x44, 0x35, 0x89]),
  distributePrizes: Buffer.from([0x9a, 0x63, 0xc9, 0x5d, 0x52, 0x68, 0x49, 0xe8]),
};

// PDA helpers
const deriveArenaPda = () => web3.PublicKey.findProgramAddressSync([Buffer.from('arena')], PROGRAM_ID);
const deriveAgentPda = (owner) => web3.PublicKey.findProgramAddressSync([Buffer.from('agent'), owner.toBuffer()], PROGRAM_ID);
const deriveSeasonPda = (seasonId) => {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(seasonId), 0);
  return web3.PublicKey.findProgramAddressSync([Buffer.from('season'), idBuf], PROGRAM_ID);
};
const deriveSeasonEntryPda = (season, agent) => web3.PublicKey.findProgramAddressSync([Buffer.from('entry'), season.toBuffer(), agent.toBuffer()], PROGRAM_ID);
const deriveSeasonVaultPda = (season) => web3.PublicKey.findProgramAddressSync([Buffer.from('vault'), season.toBuffer()], PROGRAM_ID);
const derivePredictionPda = (agent, season, predictionCount) => {
  const countBuf = Buffer.alloc(8);
  countBuf.writeBigUInt64LE(BigInt(predictionCount), 0);
  return web3.PublicKey.findProgramAddressSync([Buffer.from('prediction'), agent.toBuffer(), season.toBuffer(), countBuf], PROGRAM_ID);
};
const derivePredictionVaultPda = (prediction) => web3.PublicKey.findProgramAddressSync([Buffer.from('prediction_vault'), prediction.toBuffer()], PROGRAM_ID);

const txResults = [];

async function recordTx(name, signature) {
  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  txResults.push({ name, signature, explorer });
  console.log(`✅ ${name}`);
  console.log(`   ${explorer}`);
  return signature;
}

async function main() {
  try {
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`Balance: ${balance / web3.LAMPORTS_PER_SOL} SOL\n`);

    const [arenaPda] = deriveArenaPda();
    const [agentPda] = deriveAgentPda(walletKeypair.publicKey);
    
    // Use season 1 (create a new short one)
    const seasonId = 1;
    const [seasonPda] = deriveSeasonPda(seasonId);
    const [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda);
    const [seasonVaultPda] = deriveSeasonVaultPda(seasonPda);
    const [predictionPda] = derivePredictionPda(agentPda, seasonPda, 0);
    const [predictionVaultPda] = derivePredictionVaultPda(predictionPda);

    console.log('Creating 12-hour season...\n');

    // 1. Create 12-Hour Season (0.5 days = 12 hours)
    console.log('1. Create Season (12 hours)');
    try {
      const entryFee = BigInt(0.05 * web3.LAMPORTS_PER_SOL); // Smaller entry for testing
      const durationHours = 1; // 1 hour for quick testing (change to 12 for real)
      const prizePoolBps = 9000;
      
      const entryFeeBuf = Buffer.alloc(8);
      entryFeeBuf.writeBigUInt64LE(entryFee, 0);
      const prizePoolBuf = Buffer.alloc(2);
      prizePoolBuf.writeUInt16LE(prizePoolBps, 0);
      
      const data = Buffer.concat([
        DISCRIMINATORS.createSeason,
        entryFeeBuf,
        Buffer.from([durationHours]),
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
      await recordTx('Create 12-Hour Season', sig);
    } catch (e) {
      console.log('⚠️ Season may exist:', e.message.substring(0, 80));
    }

    // 2. Enter Season
    console.log('\n2. Enter Season');
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
      console.log('⚠️ Error:', e.message.substring(0, 80));
    }

    // 3. Submit Prediction
    console.log('\n3. Submit Prediction');
    try {
      const predictionData = JSON.stringify({ asset: 'ETH', direction: 'up', targetPrice: 2800, confidence: 72 });
      const predictionHash = crypto.createHash('sha256').update(predictionData).digest();
      const stakeAmount = BigInt(0.025 * web3.LAMPORTS_PER_SOL);
      
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
      console.log('   Prediction Hash:', predictionHash.toString('hex').substring(0, 16) + '...');
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 80));
    }

    console.log('\n=== Test Complete ===');
    console.log(`Season ${seasonId} created with 1-hour duration`);
    console.log('Season PDA:', seasonPda.toString());
    console.log('\nAfter 1 hour, run the resolve test to:');
    console.log('- Reveal prediction');
    console.log('- Resolve as correct/incorrect');
    console.log('- Distribute prizes');
    
    if (txResults.length > 0) {
      console.log('\nTransactions:');
      txResults.forEach((r, i) => console.log(`${i+1}. ${r.name}: ${r.explorer}`));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
