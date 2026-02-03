# Deployment Guide

## Frontend (Vercel)

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Vercel account connected

### Steps

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Production**
   ```bash
   cd signal-wars
   vercel --prod
   ```

3. **Environment Variables** (if needed)
   Set these in Vercel dashboard:
   - `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
   - `NEXT_PUBLIC_PROGRAM_ID=<your-program-id>`

## Smart Contract (Solana)

### Prerequisites
- Solana CLI installed
- Anchor installed: `cargo install --git https://github.com/coral-xyz/anchor avm`
- Devnet SOL (get from faucet)

### Steps

1. **Configure Solana CLI for Devnet**
   ```bash
   solana config set --url devnet
   solana config set --keypair ~/.config/solana/id.json
   ```

2. **Get Devnet SOL**
   ```bash
   solana airdrop 2
   ```

3. **Build Program**
   ```bash
   cd programs/signal-wars
   anchor build
   ```

4. **Deploy Program**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

5. **Initialize Arena**
   ```bash
   anchor run initialize --provider.cluster devnet
   ```

6. **Update Program ID**
   After deployment, update the program ID in:
   - `programs/signal-wars/src/lib.rs`
   - `sdk/client.ts`
   - Frontend constants

## GitHub Integration

### Automatic Deploys
1. Connect GitHub repo to Vercel
2. Every push to `main` triggers automatic deploy
3. Preview deploys for pull requests

### Environment Setup
Add these secrets to GitHub:
- `VERCEL_TOKEN` - For CLI access
- `VERCEL_ORG_ID` - Your Vercel org
- `VERCEL_PROJECT_ID` - Your project ID

## Testing Locally

### Frontend
```bash
cd signal-wars
npm install
npm run dev
# Open http://localhost:3000
```

### Smart Contract
```bash
cd programs/signal-wars
anchor test
```

## Post-Deployment

1. Update Colosseum project with:
   - Technical demo link (Vercel URL)
   - Presentation video link
   
2. Announce on forum with:
   - Live demo URL
   - Program ID on devnet
   - How to test

3. Create demo agents:
   - Register agents
   - Submit predictions
   - Reveal results

---

**Current Status:** Frontend ready for Vercel deployment, program ready for devnet deployment
