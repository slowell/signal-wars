# Signal Wars Architecture

## Overview

Signal Wars is a Solana-based prediction market game where players compete to predict price movements using real-time market data.

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         SIGNAL WARS ARCHITECTURE        │
├─────────────────────────────────────────┤
│                                         │
│  FRONTEND          API           PROGRAM│
│  (Next.js)       Routes        (Anchor) │
│                                         │
│  ┌────────┐     ┌──────┐     ┌────────┐│
│  │React   │────▶│REST  │────▶│Solana  ││
│  │UI      │     │API   │     │Program ││
│  └────────┘     └──────┘     └────────┘│
│       │                            │    │
│       ▼                            ▼    │
│  ┌────────┐                   ┌────────┐│
│  │Wallet  │                   │Pyth    ││
│  │Adapter │                   │Oracle  ││
│  └────────┘                   └────────┘│
│                                     │   │
│                              Jupiter    │
│                              (Swaps)    │
└─────────────────────────────────────────┘
```

---

## Component Descriptions

### Frontend (Next.js)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **React UI** | React + TypeScript | Interactive game interface, prediction forms, leaderboards |
| **Wallet Adapter** | Solana Wallet Adapter | Connects browser wallets (Phantom, Solflare, etc.) for transaction signing |

### API Routes

| Component | Technology | Purpose |
|-----------|------------|---------|
| **REST API** | Next.js API Routes | Handles game state queries, user statistics, caching layer |

### Program (Anchor)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Solana Program** | Anchor Framework | Core game logic: creating rounds, placing predictions, settling payouts |

### External Integrations

| Component | Provider | Purpose |
|-----------|----------|---------|
| **Pyth Oracle** | Pyth Network | Real-time price feeds for prediction resolution |
| **Jupiter** | Jupiter Aggregator | Token swaps for entry fees and payouts |

---

## Data Flow

### 1. Game Round Creation
```
Admin → REST API → Solana Program → On-chain Round Account
```

### 2. Player Joins Round
```
Player UI → Wallet Adapter → Sign Transaction → Solana Program
                     ↓
              Entry Fee Transfer → Jupiter (swap if needed)
                     ↓
              Prediction Stored On-chain
```

### 3. Price Resolution
```
Pyth Oracle → Price Update → Solana Program → Determine Winners
                                              ↓
                                       Trigger Payouts
```

### 4. Claim Winnings
```
Player UI → Wallet Adapter → Sign Transaction → Solana Program
                     ↓
              Prize Transfer to Player Wallet
```

---

## External Integrations

### Pyth Oracle
- **Purpose**: Verifiable, tamper-proof price feeds
- **Usage**: Program reads Pyth price accounts to resolve prediction rounds
- **Supported Assets**: SOL, BTC, ETH, and other Pyth-supported feeds

### Jupiter Swap API
- **Purpose**: Allow players to enter with any SPL token
- **Usage**: Automatically swaps entry tokens to the game's base currency
- **Benefit**: Frictionless onboarding without requiring specific tokens

### Solana Wallet Adapter
- **Supported Wallets**: Phantom, Solflare, Backpack, Glow, etc.
- **Purpose**: Secure transaction signing without exposing private keys
- **Integration**: React hooks for seamless wallet state management

---

## Security Considerations

1. **Oracle Validation**: Pyth price confidence and staleness checks
2. **Program Authority**: Admin keys secured in hardware wallets
3. **Round Settlement**: Time-locked settlements prevent front-running
4. **Payout Safety**: All calculations use checked arithmetic to prevent overflow

---

## Deployment Architecture

```
┌─────────────────┐
│   Vercel/CDN    │ ← Frontend Hosting
└────────┬────────┘
         │
┌────────▼────────┐
│   Next.js API   │ ← Serverless API Routes
└────────┬────────┘
         │
┌────────▼────────┐
│  Solana Devnet  │ ← Program Deployment
│     /Mainnet    │
└─────────────────┘
```

---

*Generated: 2026-02-03*
