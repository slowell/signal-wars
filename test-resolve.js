const web3 = require('@solana/web3.js');
const fs = require('fs');

console.log('=== Signal Wars - Resolve & Distribute Test ===');

const PROGRAM_ID = new web3.PublicKey('Gck8TTMDXoqhcXDUYDRzYbBu4shvbAUUrHTBafuGQCSz');
const DEVNET_RPC = 'https://api.devnet.solana.com';

const keypairData = JSON.parse(fs.readFileSync('/Users/openclaw/.openclaw/workspace/signal-wars/.secrets/devnet-wallet.json', 'utf8'));
const walletKeypair = web3.Keypair.fromSecretKey(new Uint8Array(keypairData));

const connection = new web3.Connection(DEVNET_RPC, 'confirmed');

const DISCRIMINATORS = {
  revealPrediction: Buffer.from([0x4c, 0x89, 0x7f, 0x04, 0xa3, 0x05, 0x6e, 0x40]),
  resolvePrediction: Buffer.from([0xc7, 0x9f, 0x36, 0xeb, 0x79, 0x44, 0x35, 0x89]),
  distributePrizes: Buffer.from([0x9a, 0x63, 0xc9, 0x5d, 0x52, 0x68, 0x49, 0xe8]),
};

const deriveAgentPda = (owner) => web3.PublicKey.findProgramAddressSync([Buffer.from('agent'), owner.toBuffer()], PROGRAM_ID);
const deriveSeasonPda = (seasonId) => {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(seasonId), 0);
  return web3.PublicKey.findProgramAddressSync([Buffer.from('season'), idBuf], PROGRAM_ID);
};
const deriveSeasonEntryPda = (season, agent) => web3.PublicKey.findProgramAddressSync([Buffer.from('entry'), season.toBuffer(), agent.toBuffer()], PROGRAM_ID);
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
    const [agentPda] = deriveAgentPda(walletKeypair.publicKey);
    const seasonId = 1; // The short season we created
    const [seasonPda] = deriveSeasonPda(seasonId);
    const [seasonEntryPda] = deriveSeasonEntryPda(seasonPda, agentPda);
    const [predictionPda] = derivePredictionPda(agentPda, seasonPda, 0);
    const [predictionVaultPda] = derivePredictionVaultPda(predictionPda);

    console.log('Resolving season', seasonId);
    console.log('This will only work if the season has ended (12+ hours)\n');

    // 1. Reveal Prediction
    console.log('1. Reveal Prediction');
    try {
      const predictionData = JSON.stringify({ asset: 'ETH', direction: 'up', targetPrice: 2800, confidence: 72 });
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

    // 2. Resolve as Correct
    console.log('\n2. Resolve Prediction (Correct)');
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
      await recordTx('Resolve (Correct)', sig);
    } catch (e) {
      console.log('⚠️ Error:', e.message.substring(0, 100));
    }

    // 3. Distribute Prizes
    console.log('\n3. Distribute Prizes');
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

    console.log('\n=== Complete ===');
    if (txResults.length > 0) {
      console.log('Transactions:');
      txResults.forEach((r, i) => console.log(`${i+1}. ${r.name}: ${r.explorer}`));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
