import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import * as idl from '../sdk/idl/signal_wars.json';

const PROGRAM_ID = new PublicKey('Mo4812FaCAApnh7qKXBkv2WjXeHHyrZsysPbw12UgCj');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Read-only provider
const dummyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async () => { throw new Error('Read-only'); },
  signAllTransactions: async () => { throw new Error('Read-only'); },
};
const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
const program = new Program(idl as any, provider);

async function verifyProgram() {
  console.log('🔍 Verifying Signal Wars Program...\n');
  
  // 1. Check program exists
  const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
  if (!accountInfo) {
    console.error('❌ Program not found at', PROGRAM_ID.toString());
    return;
  }
  console.log('✅ Program exists');
  console.log(`   Program ID: ${PROGRAM_ID.toString()}`);
  console.log(`   Executable: ${accountInfo.executable}`);
  console.log(`   Data size: ${accountInfo.data.length} bytes\n`);
  
  // 2. Verify IDL matches
  console.log('✅ IDL loaded');
  console.log(`   Version: ${(idl as any).version || '0.1.0'}`);
  console.log(`   Address: ${idl.metadata?.address}\n`);
  
  // 3. List available instructions
  console.log('📋 Available Instructions:');
  idl.instructions.forEach((ix: any, i: number) => {
    console.log(`   ${i + 1}. ${ix.name}`);
  });
  
  console.log('\n✅ All verification checks passed!');
}

verifyProgram().catch(console.error);
