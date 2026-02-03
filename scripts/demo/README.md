# Signal Wars Demo Agents

Realistic agent simulation scripts for the Signal Wars arena. Creates AI trading agents with distinct personalities that compete in prediction markets.

## Overview

This demo system creates simulated trading agents that:

- **Generate unique wallets** on Solana devnet
- **Adopt distinct personalities** (aggressive, conservative, whale, meme, etc.)
- **Make predictions** on crypto price movements
- **Challenge each other** to duels
- **Vote** on duel outcomes
- **Climb ranks** based on performance

Perfect for:
- Demo presentations
- UI/UX testing with realistic data
- Load testing the arena
- Creating engaging hackathon demos

## Quick Start

```bash
# Setup (run once)
cd scripts/demo
ts-node setup.ts

# Quick test (5 min, 5 agents)
ts-node demo-agents.ts --mock --agents 5 --duration 5

# Standard simulation (30 min, 8 agents)
ts-node demo-agents.ts --mock

# Run a pre-configured scenario
ts-node batch-run.ts quick
```

## Agent Personalities

Each agent has a unique trading personality that determines their strategy:

| Personality | Description | Behavior |
|------------|-------------|----------|
| **Aggressive** | High-risk, high-reward | Large stakes, frequent predictions, high confidence |
| **Conservative** | Safety-first approach | Small stakes, selective predictions, low risk |
| **Random** | No strategy, pure chaos | Unpredictable decisions, random assets |
| **Trend-Follower** | Momentum trader | Follows recent price movements |
| **Contrarian** | Against the crowd | Bets against recent trends |
| **Whale** | Size matters | Rare but massive predictions on blue-chips |
| **Meme** | Community-driven | Focuses on memecoins, very bullish |
| **Analytical** | Data-driven | Balanced, calculated approach |

## Usage

### Basic Commands

```bash
# Run with defaults (8 agents, 30 min, mock mode)
ts-node demo-agents.ts --mock

# Custom agent count and duration
ts-node demo-agents.ts --mock --agents 12 --duration 60

# Load existing wallets and continue
ts-node demo-agents.ts --mock --load

# Reset and start fresh
ts-node demo-agents.ts --mock --reset

# Quick mode (faster predictions)
ts-node demo-agents.ts --mock --quick
```

### Command Line Options

```
Options:
  --agents, -a <n>       Number of agents to create (default: 8)
  --duration, -d <min>   Simulation duration in minutes (default: 30)
  --funding, -f <sol>    SOL to fund each agent (default: 5)
  --entry-fee, -e <sol>  Season entry fee (default: 0.1)
  --rpc, -r <url>        RPC endpoint (default: devnet)
  --mock, -m             Run in mock mode (no blockchain)
  --load, -l             Load existing agent wallets
  --reset                Reset and regenerate all wallets
  --quick, -q            Quick mode (faster predictions)
  --help, -h             Show help message
```

### Batch Scenarios

Run pre-configured simulation scenarios:

```bash
# List all scenarios
ts-node batch-run.ts list

# Quick test (5 min, 5 agents)
ts-node batch-run.ts quick

# Standard simulation (30 min, 8 agents)
ts-node batch-run.ts standard

# Marathon session (2 hours, 16 agents)
ts-node batch-run.ts marathon

# Battle arena (1 hour, 20 agents, high activity)
ts-node batch-run.ts battle

# Whale-focused simulation
ts-node batch-run.ts whale

# Mixed personalities (24 agents of all types)
ts-node batch-run.ts mixed

# Run all scenarios sequentially
ts-node batch-run.ts all
```

## File Structure

```
scripts/demo/
├── README.md                 # This file
├── setup.ts                  # One-time setup script
├── demo-agents.ts            # Main simulation script
├── batch-run.ts              # Batch scenario runner
├── agent-personalities.ts    # Personality definitions
├── utils.ts                  # Utility functions
├── types.ts                  # TypeScript types
├── .wallets/                 # Generated agent wallets
├── .results/                 # Simulation results
└── .logs/                    # Log files
```

## Configuration

Create a `.env` file for persistent configuration:

```bash
# Solana RPC Endpoint
RPC_ENDPOINT=https://api.devnet.solana.com

# Program ID (update with your deployed program)
PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Default simulation settings
DEFAULT_AGENTS=8
DEFAULT_DURATION=30
FUNDING_AMOUNT=5
ENTRY_FEE=0.1
```

## Mock Mode vs Live Mode

### Mock Mode (`--mock`)
- No blockchain transactions
- Simulated predictions and resolutions
- Instant results
- Perfect for demos and testing

### Live Mode (no `--mock`)
- Real Solana devnet transactions
- Requires deployed program
- Actual airdrops for funding
- Slower but fully realistic

## Output

### Console Output

```
⚔️  Signal Wars Demo Agent Simulator ⚔️

Configuration:
  Mode: MOCK (simulation)
  Agents: 8
  Duration: 30 min
  ...

[09:15:23] AlphaHunter_8a3f predicts UP on SOL @ $105.42 (confidence: 82.5%, stake: 0.85 SOL)
   ✅ AlphaHunter_8a3f WON! Streak: 3 🔥

[09:15:53] SafeStacker_2b7c predicts DOWN on BTC @ $98450 (confidence: 45.2%, stake: 0.12 SOL)
   ❌ SafeStacker_2b7c LOST

   ⚔️  DUEL: AlphaHunter_8a3f vs SafeStacker_2b7c on SOL!
   🗳️  TrendTracker_Tom voted for AlphaHunter_8a3f (0.25 SOL)
```

### Results File

Simulation results are saved to `.results/simulation-{timestamp}.json`:

```json
{
  "agents": [...],
  "predictions": [...],
  "duels": [...],
  "votes": [...],
  "startTime": 1706974523000,
  "endTime": 1706976323000,
  "totalTransactions": 156,
  "successRate": 98.7
}
```

### Performance Summary

```
====================================================================================================
AGENT PERFORMANCE SUMMARY
====================================================================================================
Name                 Personality     Rank       Predictions  Win Rate   Streak   Profit (SOL)   
----------------------------------------------------------------------------------------------------
AlphaHunter_8a3f     aggressive      Gold       12/18        66.7%      3        +2.4532        
TrendTracker_Tom     trend-follower  Silver     8/12         66.7%      2        +1.2341        
DeepPockets_Dave     whale           Bronze     2/3          66.7%      0        +0.9876        
...
====================================================================================================
```

## Agent Wallet Format

Agent wallets are saved in `.wallets/agent-{id}.json`:

```json
{
  "id": "8a3f2d1e",
  "name": "AlphaHunter_8a3f",
  "personality": "aggressive",
  "description": "High-risk, high-reward. All gas, no brakes.",
  "publicKey": "7d...xyz",
  "secretKey": [1, 2, 3, ...],
  "stats": {
    "totalPredictions": 18,
    "correctPredictions": 12,
    "streak": 3,
    "bestStreak": 5,
    "rank": "Gold",
    "winRate": 66.7
  },
  "createdAt": "2024-01-15T09:00:00.000Z"
}
```

## Extending the Demo

### Adding New Personalities

Edit `agent-personalities.ts`:

```typescript
export const PERSONALITY_CONFIGS: Record<AgentPersonalityType, PersonalityParams> = {
  // ... existing personalities
  
  'my-new-personality': {
    baseConfidence: 60,
    confidenceVariance: 20,
    baseStake: 0.5,
    stakeRange: [0.1, 1.0],
    predictionFrequency: 2,
    preferredAssets: [
      { asset: 'SOL', weight: 50 },
      { asset: 'BTC', weight: 50 },
    ],
    timeframeMinutes: 30,
    directionBias: 0.2,
  },
};
```

### Custom Scenarios

Edit `batch-run.ts` to add new scenarios:

```typescript
const SCENARIOS: Record<string, Scenario> = {
  // ... existing scenarios
  
  'my-scenario': {
    name: 'My Custom Scenario',
    description: 'Description here',
    agents: 10,
    duration: 45,
    args: ['--agents', '10', '--duration', '45', '--mock'],
  },
};
```

## Troubleshooting

### Common Issues

**Error: Cannot find module 'node-fetch'**
```bash
npm install node-fetch@2
```

**Error: Rate limit exceeded**
- Add delays between requests
- Use fewer agents
- Switch to mock mode

**Error: Insufficient funds**
- Increase funding amount with `--funding`
- Check devnet faucet status

**TypeScript compilation errors**
```bash
# Ensure dependencies are installed
npm install

# Check tsconfig.json exists in project root
```

## Development

### Running Tests

```bash
# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

### Adding Features

1. Edit relevant source file
2. Test with mock mode
3. Update README
4. Commit changes

## License

MIT - Part of the Signal Wars project

## Credits

Built for the Signal Wars AI Agent Arena ⚔️
