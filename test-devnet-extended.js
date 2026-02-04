const web3 = require('@solana/web3.js');
const fs = require('fs');
const crypto = require('crypto');

console.log('=== Signal Wars Devnet Test - Full Flow ===');

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
const DISCRIMINATORS = {
  initializeArena: Buffer.from([0x0b, 0x25, 0xdd, 0x01, 0xcd, 0x78, 0x19, 0xe6]),
  registerAgent: Buffer.from([0x87, 0x9d, 0x42, 0xc3, 0x02, 0x71, 0xaf, 0x1e]),
  createSeason: Buffer.from([0x26, 0x6c, 0x1d, 0x7f, 0x3c, 0x7e, 0x65, 0x03]),
  enterSeason: Buffer.from([0x9f, 0x92, 0x03, 0x8b, 0x96, 0xf1, 0x1d, 0x08]),
  submitPrediction: Buffer.from([0xc1, 0x71, 0x29, 0x24, 0xa0, 0x3c, 0xf7, 0x37]),
  revealPrediction: Buffer.from([0x4c, 0x89, 0x7f, 0x04, 0xa3, 0x05, 0x6e, 0x40]),
  resolvePrediction: Buffer.from([0xc7, 0x9f, 0x36, 0xeb, 0x79, 0x44, 0x35, 0x89]),
  awardAchievement: Buffer.from([0x4b, 0x2f, 0x9c, 0xfd, 0x7c, 0xe7, 0x54, 0x0c]),
  distributePrizes: Buffer.from([0x9a, 0x63, 0xc9, 0x5d, 0x52, 0x68, 0x49, 0xe8]),
};

// PDA Derivation Helpers
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
const deriveAchievementPda = (agent, achievementType) => web3.PublicKey.findProgramAddressSync([Buffer.from('achievement'), agent.toBuffer(), Buffer.from([achievementType])], PROGRAM_ID);

async function main() {
  try {
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log(`Wallet Balance: ${balance / web3.LAMPORTS_PER_SOL} SOL\n`);

    // Derive PDAs
    const [arenaPda] = deriveArenaPda();
    const [agentPda] = deriveAgentPda(walletKeypair.publicKey);
    
    // Use season 0 (already created)
    const seasonId = 0;
    const [seasonPda] = deriveSeasonPda(seasonId);
    const [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda);
    const [seasonVaultPda] = deriveSeasonVaultPda(seasonPda);

    // Prediction 0 (already submitted)
    const predictionCount = 0;
    const [predictionPda] = derivePredictionPda(agentPda, seasonPda, predictionCount);
    const [predictionVaultPda] = derivePredictionVaultPda(predictionPda);

    console.log('PDAs:');
    console.log('  Arena:', arenaPda.toString());
    console.log('  Agent:', agentPda.toString());
    console.log('  Season:', seasonPda.toString());
    console.log('  Season Entry:', seasonEntryPda.toString());
    console.log('  Prediction:', predictionPda.toString());
    console.log('  Prediction Vault:', predictionVaultPda.toString());
    console.log();

    // 6. Reveal Prediction
    console.log('--- 6. Reveal Prediction ---');
    try {
      const predictionData = JSON.stringify({ asset: 'BTC', direction: 'up', targetPrice: 50000, confidence: 85 });
      
      // Borsh string: 4-byte length + data
      const dataBuf = Buffer.from(predictionData);
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32LE(dataBuf.length, 0);
      
      const data = Buffer.concat([
        DISCRIMINATORS.revealPrediction,
        lenBuf,
        dataBuf,
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: predictionPda, isSigner: false, isWritable: true },
          { pubkey: agentPda, isSigner: false, isWritable: false },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Reveal Prediction', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 100));
    }

    // 7. Resolve Prediction (authority only)
    console.log('\n--- 7. Resolve Prediction ---');
    try {
      const wasCorrect = true;
      
      const data = Buffer.concat([
        DISCRIMINATORS.resolvePrediction,
        Buffer.from([wasCorrect ? 1 : 0]),
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: predictionPda, isSigner: false, isWritable: true },
          { pubkey: agentPda, isSigner: false, isWritable: true },
          { pubkey: seasonEntryPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: predictionVaultPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Resolve Prediction', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 100));
    }

    // 8. Award Achievement (FirstWin = 0)
    console.log('\n--- 8. Award Achievement ---');
    try {
      const achievementType = 0; // FirstWin
      const [achievementPda] = deriveAchievementPda(agentPda, achievementType);
      
      const data = Buffer.concat([
        DISCRIMINATORS.awardAchievement,
        Buffer.from([achievementType]),
      ]);
      
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: agentPda, isSigner: false, isWritable: true },
          { pubkey: achievementPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Award Achievement', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 100));
    }

    // 9. Distribute Prizes
    console.log('\n--- 9. Distribute Prizes ---');
    try {
      const ix = new web3.TransactionInstruction({
        keys: [
          { pubkey: seasonPda, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.distributePrizes,
      });
      
      const tx = new web3.Transaction().add(ix);
      const sig = await web3.sendAndConfirmTransaction(connection, tx, [walletKeypair]);
      await recordTx('Distribute Prizes', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 100));
    }

    // Summary
    console.log('\n=== Extended Flow Test Summary ===');
    if (txResults.length > 0) {
      console.log(`✅ Completed ${txResults.length} transactions!`);
      txResults.forEach((r, i) => console.log(`${i+1}. ${r.name}: ${r.explorer}`));
    } else {
      console.log('No new transactions.');
    }
    
    console.log('\nProgram:', `https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
