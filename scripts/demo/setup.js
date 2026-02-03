/**
 * Quick Setup Script (JavaScript version)
 * 
 * One-time setup to prepare the demo environment.
 * Can be run with Node.js directly without ts-node.
 * 
 * Usage:
 *   node setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIRS = [
  '.wallets',
  '.results',
  '.logs',
];

function checkNodeModules() {
  const rootDir = path.join(__dirname, '..', '..');
  return fs.existsSync(path.join(rootDir, 'node_modules'));
}

function installDependencies() {
  console.log('📦 Installing dependencies...');
  const rootDir = path.join(__dirname, '..', '..');
  
  try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit', timeout: 300000 });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    console.log('Please run "npm install" manually in the project root.');
    throw error;
  }
}

function createDirectories() {
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

function createEnvFile() {
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

function printNextSteps() {
  console.log('='.repeat(70));
  console.log('🎉 Setup Complete!');
  console.log('='.repeat(70));
  console.log('\nNext steps:');
  console.log('\n1. Ensure ts-node is installed:');
  console.log('   npm install --save-dev ts-node');
  console.log('\n2. Run a quick test simulation:');
  console.log('   npx ts-node demo-agents.ts --mock --agents 5 --duration 5');
  console.log('\n3. Run a standard simulation:');
  console.log('   npx ts-node demo-agents.ts --mock');
  console.log('\n4. Run a specific scenario:');
  console.log('   npx ts-node batch-run.ts quick');
  console.log('\n5. List all scenarios:');
  console.log('   npx ts-node batch-run.ts list');
  console.log('\n6. View results:');
  console.log('   ls -la .results/');
  console.log('\n' + '='.repeat(70));
}

function main() {
  console.log('\n⚔️  Signal Wars Demo Agent Setup\n');
  console.log('='.repeat(70) + '\n');
  
  // Check dependencies
  if (!checkNodeModules()) {
    console.log('⚠️  node_modules not found. Installing dependencies...\n');
    try {
      installDependencies();
    } catch (error) {
      console.log('\nContinuing with setup...\n');
    }
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
