# Deployment

## Architecture

- **Frontend + API** — Next.js app on **Vercel**. API routes (`/api/*`) are included in the same deploy; no separate backend server needed.
- **Database** — None. All state lives on-chain (Base Sepolia smart contracts).
- **Smart contracts** — Already deployed and verified on Base Sepolia. Addresses are configured via environment variables.

## Prerequisites

- A [Vercel](https://vercel.com) account
- The repo connected to Vercel (or the Vercel CLI installed)
- The following secrets/values ready:

| Variable                       | Where to get it                                                            |
| ------------------------------ | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_PRIVY_APP_ID`     | [Privy Dashboard](https://dashboard.privy.io)                              |
| `PRIVY_APP_SECRET`             | Privy Dashboard (server-side only)                                         |
| `ALCHEMY_API_KEY`              | [Alchemy Dashboard](https://dashboard.alchemy.com) — Base Sepolia endpoint |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Your RPC URL (defaults to `https://sepolia.base.org` if omitted)           |
| `REDIS_URL`                    | Optional — for market data caching (e.g. Upstash)                          |

## Environment Variables

All `NEXT_PUBLIC_*` vars must be set in Vercel. The deployed contract addresses are already in `.env.example` and will be used at build time.

```env
# Auth
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# RPC
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
ALCHEMY_API_KEY=

# Contract addresses (set in .env.example — override if re-deploying)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_VAULT_ADDRESS=0x2535300CcAa582F06eF775c03513D819c92aA9f8
NEXT_PUBLIC_MANAGER_ADDRESS=0xA0c801d4EbE79736E9F0a4383e480E1f936E1364
NEXT_PUBLIC_REGISTRY_ADDRESS=0x6013EcAc6249455800262761554522C5Ba0ebBbc
NEXT_PUBLIC_DFLOW_ADAPTOR_ADDRESS=0x87cc64108fF446fB07929009c362f57d7161fCCB
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Optional — venue API keys (for market data aggregation)
DFLOW_API_KEY=
POLYMARKET_API_KEY=
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com

# Optional — cache
REDIS_URL=
```

## Deploy to Vercel

### Option A — Git Import (recommended)

1. Push the repo to GitHub.
2. In the Vercel dashboard, click **Add New → Project**.
3. Import the repo — Vercel auto-detects Next.js.
4. Add all environment variables from `.env.example` (Vercel → Project Settings → Environment Variables).
5. Deploy.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
cd go-market
vercel --prod
```

The CLI will prompt you to link a project and set environment variables.

## Post-Deployment Checks

1. Visit the deployed URL and sign in with Privy.
2. Check that the wallet connection works and the balance loads.
3. Run a test deposit (small USDC amount on Base Sepolia — use [faucet](https://faucet.circle.com) if needed).
4. Verify that acca creation, withdrawal, and market browsing all resolve on-chain.

### Useful Commands

```bash
npm run build        # Production build (run locally first to catch errors)
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Unit tests
```
