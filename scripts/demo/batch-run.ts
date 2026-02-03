/**
 * Batch Demo Runner
 * 
 * Runs multiple demo simulations with different configurations
 * to create realistic-looking activity on the arena.
 * 
 * Usage:
 *   ts-node batch-run.ts [scenario]
 * 
 * Scenarios:
 *   quick     - Fast simulation (5 min, 5 agents)
 *   standard  - Normal simulation (30 min, 8 agents)
 *   marathon  - Long simulation (2 hours, 16 agents)
 *   battle    - High activity (1 hour, 20 agents)
 *   whale     - Whale-focused simulation
 *   mixed     - Mix of all personality types
 */

import { execSync } from 'child_process';
import * as path from 'path';

interface Scenario {
  name: string;
  description: string;
  agents: number;
  duration: number;
  args: string[];
}

const SCENARIOS: Record<string, Scenario> = {
  quick: {
    name: 'Quick Test',
    description: 'Fast simulation for testing (5 min, 5 agents)',
    agents: 5,
    duration: 5,
    args: ['--agents', '5', '--duration', '5', '--quick', '--mock'],
  },
  standard: {
    name: 'Standard',
    description: 'Normal simulation (30 min, 8 agents)',
    agents: 8,
    duration: 30,
    args: ['--agents', '8', '--duration', '30', '--mock'],
  },
  marathon: {
    name: 'Marathon',
    description: 'Long-running simulation (2 hours, 16 agents)',
    agents: 16,
    duration: 120,
    args: ['--agents', '16', '--duration', '120', '--mock'],
  },
  battle: {
    name: 'Battle Arena',
    description: 'High activity simulation (1 hour, 20 agents)',
    agents: 20,
    duration: 60,
    args: ['--agents', '20', '--duration', '60', '--quick', '--mock'],
  },
  whale: {
    name: 'Whale Watch',
    description: 'Large stake simulation with whale agents',
    agents: 10,
    duration: 45,
    args: ['--agents', '10', '--duration', '45', '--funding', '50', '--mock'],
  },
  mixed: {
    name: 'Mixed Personalities',
    description: 'All personality types competing',
    agents: 24,
    duration: 60,
    args: ['--agents', '24', '--duration', '60', '--mock'],
  },
};

function printUsage(): void {
  console.log(`
Signal Wars Batch Demo Runner

Usage: ts-node batch-run.ts <scenario>

Scenarios:
  quick     - ${SCENARIOS.quick.description}
  standard  - ${SCENARIOS.standard.description}
  marathon  - ${SCENARIOS.marathon.description}
  battle    - ${SCENARIOS.battle.description}
  whale     - ${SCENARIOS.whale.description}
  mixed     - ${SCENARIOS.mixed.description}
  list      - List all scenarios
  all       - Run all scenarios sequentially

Examples:
  ts-node batch-run.ts quick
  ts-node batch-run.ts standard
  ts-node batch-run.ts all
`);
}

function listScenarios(): void {
  console.log('\n📋 Available Scenarios:\n');
  console.log('='.repeat(70));
  
  for (const [key, scenario] of Object.entries(SCENARIOS)) {
    console.log(`\n${scenario.name} (${key})`);
    console.log(`  Description: ${scenario.description}`);
    console.log(`  Agents: ${scenario.agents}`);
    console.log(`  Duration: ${scenario.duration} min`);
    console.log(`  Args: ${scenario.args.join(' ')}`);
  }
  
  console.log('\n' + '='.repeat(70));
}

function runScenario(scenario: Scenario): void {
  console.log(`\n🚀 Running: ${scenario.name}`);
  console.log('='.repeat(70));
  console.log(`Description: ${scenario.description}`);
  console.log(`Agents: ${scenario.agents} | Duration: ${scenario.duration} min`);
  console.log('='.repeat(70) + '\n');
  
  const demoScript = path.join(__dirname, 'demo-agents.ts');
  const command = `npx ts-node ${demoScript} ${scenario.args.join(' ')}`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ Scenario completed: ${scenario.name}\n`);
  } catch (error) {
    console.error(`\n❌ Scenario failed: ${scenario.name}`);
    console.error(error);
  }
}

function runAllScenarios(): void {
  console.log('\n🏃 Running All Scenarios\n');
  console.log('='.repeat(70));
  
  const scenarios = Object.values(SCENARIOS);
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`\n[${i + 1}/${scenarios.length}]`);
    runScenario(scenario);
    
    if (i < scenarios.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next scenario...\n');
      execSync('sleep 5');
    }
  }
  
  console.log('\n✅ All scenarios completed!\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const scenarioName = args[0];
  
  if (!scenarioName || scenarioName === '--help' || scenarioName === '-h') {
    printUsage();
    return;
  }
  
  if (scenarioName === 'list') {
    listScenarios();
    return;
  }
  
  if (scenarioName === 'all') {
    runAllScenarios();
    return;
  }
  
  const scenario = SCENARIOS[scenarioName];
  if (!scenario) {
    console.error(`\n❌ Unknown scenario: ${scenarioName}`);
    console.log('Run "ts-node batch-run.ts list" to see available scenarios.');
    process.exit(1);
  }
  
  runScenario(scenario);
}

main();
