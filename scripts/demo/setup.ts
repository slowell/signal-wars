/**
 * Setup Script for Demo Agents
 * 
 * One-time setup to prepare the demo environment.
 * 
 * Usage:
 *   ts-node setup.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DIRS = [
  '.wallets',
  '.results',
  '.logs',
];

function checkNodeModules(): boolean {
  const rootDir = path.join(__dirname, '..', '..');
  return fs.existsSync(path.join(rootDir, 'node_modules'));
}

function installDependencies(): void {
  console.log('📦 Installing dependencies...');
  const rootDir = path.join(__dirname, '..', '..');
  
  try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    throw error;
  }
}

function createDirectories(): void {
  console.log('📁 Creating directories...');
  
  for (const dir of DIRS) {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   Created: ${dir}/`);
    } else {
      console.log(`   Exists: ${dir}/`);
    }
  }
  
  console.log('✅ Directories ready\n');
}

function createEnvFile(): void {
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists, skipping\n');
    return;
  }
  
  const envContent = `# Signal Wars Demo Agent Configuration

# Solana RPC Endpoint (devnet default)
RPC_ENDPOINT=https://api.devnet.solana.com

# Program ID (update with your deployed program)
PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Season ID to participate in
SEASON_ID=0

# Funding amount per agent (SOL)
FUNDING_AMOUNT=5

# Season entry fee (SOL)
ENTRY_FEE=0.1

# Default number of agents
DEFAULT_AGENTS=8

# Default simulation duration (minutes)
DEFAULT_DURATION=30
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file\n');
}

function printNextSteps(): void {
  console.log('='.repeat(70));
  console.log('🎉 Setup Complete!');
  console.log('='.repeat(70));
  console.log('\nNext steps:');
  console.log('\n1. Run a quick test simulation:');
  console.log('   ts-node demo-agents.ts --mock --agents 5 --duration 5');
  console.log('\n2. Run a standard simulation:');
  console.log('   ts-node demo-agents.ts --mock');
  console.log('\n3. Run a specific scenario:');
  console.log('   ts-node batch-run.ts quick');
  console.log('\n4. List all scenarios:');
  console.log('   ts-node batch-run.ts list');
  console.log('\n5. View results:');
  console.log('   ls -la .results/');
  console.log('\n' + '='.repeat(70));
}

function main(): void {
  console.log('\n⚔️  Signal Wars Demo Agent Setup\n');
  console.log('='.repeat(70) + '\n');
  
  // Check dependencies
  if (!checkNodeModules()) {
    installDependencies();
  } else {
    console.log('✅ Dependencies already installed\n');
  }
  
  // Create directories
  createDirectories();
  
  // Create env file
  createEnvFile();
  
  // Print next steps
  printNextSteps();
}

main();
