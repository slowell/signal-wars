# Signal Wars Anchor Tests

Comprehensive test suite for the Signal Wars prediction market program on Solana.

## Overview

This test suite covers all instruction handlers and edge cases for the Signal Wars program, including:

1. **Arena Initialization** - Global state setup
2. **Agent Registration** - Creating agent accounts
3. **Season Management** - Creating and managing prediction seasons
4. **Prediction Flow** - Commit-reveal-resolve cycle
5. **Scoring & Rankings** - Score calculation and rank progression
6. **Prize Distribution** - End-of-season rewards
7. **Edge Cases & Security** - Error handling and access control

## Test Structure

```
tests/
├── signal-wars.ts    # Main test suite
├── test-utils.ts     # Helper functions and utilities
└── tsconfig.json     # TypeScript configuration
```

## Running Tests

### Prerequisites

1. Ensure you have Anchor CLI installed
2. Have Solana CLI configured with a local keypair
3. Install dependencies:
   ```bash
   yarn install
   ```

### Run All Tests

```bash
# From the programs/signal-wars directory
cd programs/signal-wars
anchor test

# Or from root
yarn anchor:test
```

### Run Specific Test Suite

```bash
anchor test --grep "Agent Registration"
```

## Test Suites

### 1. Arena Initialization
- ✅ Initialize global arena state
- ✅ Prevent double initialization

### 2. Agent Registration
- ✅ Register new agent with name and endpoint
- ✅ Fail on name too long (>32 chars)
- ✅ Fail on endpoint too long (>128 chars)
- ✅ Prevent duplicate registration

### 3. Season Initialization
- ✅ Create new season with parameters
- ✅ Fail with invalid prize pool bps (>10000)
- ✅ Proper season ID incrementing

### 4. Season Entry
- ✅ Enter season with entry fee payment
- ✅ Track total entries and pool
- ✅ Prevent double entry
- ✅ Fail to enter completed season

### 5. Prediction Commitment (Hash Submission)
- ✅ Submit prediction with stake
- ✅ Submit prediction without stake
- ✅ Multiple predictions with incremented count
- ✅ Prevent double submission with same count

### 6. Prediction Reveal
- ✅ Reveal with valid data (hash verification)
- ✅ Fail with tampered data (hash mismatch)
- ✅ Fail to reveal already revealed prediction
- ✅ Handle empty prediction data

### 7. Prediction Resolution & Scoring
- ✅ Resolve as correct (stake return + score)
- ✅ Resolve as incorrect (stake loss)
- ✅ Streak tracking and multipliers
- ✅ Fail to resolve unrevealed prediction
- ✅ Fail to resolve already resolved prediction

### 8. Rank Updates
- ✅ Rank progression based on accuracy and streak
- ✅ Bronze → Silver → Gold → Diamond → Legend

### 9. Achievement Awards
- ✅ Award first win achievement
- ✅ Award streak achievements (3, 5, 10)
- ✅ Award rank achievements
- ✅ Reputation score updates

### 10. Prize Distribution
- ✅ Distribute prizes at season end
- ✅ Fail to distribute before season end
- ✅ Fail to distribute twice

### 11. Edge Cases & Security
- ✅ Unauthorized access attempts
- ✅ Large stake amounts
- ✅ Score calculation with streak multipliers
- ✅ Empty prediction data handling
- ✅ Account validation

### 12. Event Emission
- ✅ AgentRegistered events
- ✅ PredictionSubmitted events
- ✅ Season lifecycle events

## Test Utilities

The `test-utils.ts` file provides:

### PDA Derivation
- `deriveArenaPda()`
- `deriveAgentPda()`
- `deriveSeasonPda()`
- `deriveSeasonEntryPda()`
- `derivePredictionPda()`
- `derivePredictionVaultPda()`
- `deriveAchievementPda()`

### Prediction Helpers
- `generatePredictionHash()` - SHA-256 hashing
- `generatePredictionData()` - JSON payload creation
- `verifyPredictionHash()` - Hash verification

### Calculation Helpers
- `calculateExpectedScore()` - Match on-chain scoring
- `calculateCumulativeScore()` - Multi-prediction scores
- `determineExpectedRank()` - Rank progression logic

### Constants
- `TEST_CONSTANTS` - Common test values
- `ERROR_CODES` - Expected error messages

## Key Testing Scenarios

### Commit-Reveal-Resolve Flow
```
1. Agent registers
2. Season is created
3. Agent enters season (pays entry fee)
4. Agent submits prediction (pays stake, stores hash)
5. Agent reveals prediction (verifies hash)
6. Oracle resolves prediction (correct/incorrect)
7. Score updated, stake returned/lost
```

### Stake Mechanics
- Winning prediction: 2x stake returned
- Losing prediction: stake lost
- Stake multiplier in score calculation

### Streak Multipliers
- Base: 1.0x
- Streak 1: 1.1x
- Streak 2: 1.2x
- ...etc (0.1x per streak)

### Rank Requirements
| Rank | Accuracy | Correct Predictions | Best Streak |
|------|----------|---------------------|-------------|
| Bronze | Any | Any | Any |
| Silver | ≥50% | - | ≥3 |
| Gold | ≥60% | - | ≥5 |
| Diamond | ≥70% | - | ≥10 |
| Legend | ≥80% | ≥50 | - |

## Performance Considerations

- Tests use localnet for speed
- Airdrops provided in `before()` hook
- Tests run sequentially (shared state)
- Each suite cleans up via account closures

## Troubleshooting

### Common Issues

1. **Account already in use**: Reset local validator
   ```bash
   solana-test-validator --reset
   ```

2. **Insufficient funds**: Increase airdrop amount in tests

3. **Type errors**: Ensure `@coral-xyz/anchor` is installed

## Future Test Additions

- [ ] Multi-sig authority tests
- [ ] Time-based season expiry edge cases
- [ ] Prize distribution calculations
- [ ] NFT minting for achievements
- [ ] Program upgrade tests
- [ ] CPI integration tests

## Contributing

When adding new tests:
1. Follow existing test structure
2. Use utility functions from `test-utils.ts`
3. Include both success and failure cases
4. Document any new error conditions
5. Add event emission tests where applicable
