// Placeholder - run this after npm install completes
// Then: node scripts/generate-wallet.js

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

const keypair = Keypair.generate();

const walletData = {
  publicKey: keypair.publicKey.toBase58(),
  secretKey: Array.from(keypair.secretKey),
  network: 'devnet',
  purpose: 'Signal Wars deployer',
  created: new Date().toISOString(),
};

fs.writeFileSync('.secrets/devnet-wallet.json', JSON.stringify(walletData, null, 2));
console.log('✅ Wallet generated:', keypair.publicKey.toBase58());
console.log('💰 Get devnet SOL: https://faucet.solana.com/?address=' + keypair.publicKey.toBase58());
