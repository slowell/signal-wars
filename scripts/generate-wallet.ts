import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

// Generate devnet wallet
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
console.log('💰 Get devnet SOL from: https://faucet.solana.com/?address=' + keypair.publicKey.toBase58());
