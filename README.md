# GO Market

Cross-platform prediction market accumulator. Combine bets from Polymarket, Kalshi, and Limitless into a single accumulator ticket.

## Architecture

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── account/      # Wallet management, deposits, withdrawals
│   ├── markets/      # Market detail page
│   ├── positions/    # Active & settled position tracking
│   └── api/          # REST endpoints
├── components/       # React UI components
│   ├── acca/         # Acca builder slip & FAB
│   ├── account/      # Account screen
│   ├── layout/       # Navigation & shell
│   ├── markets/      # MarketCard, MarketGrid
│   ├── positions/    # Position list & detail
│   ├── social/       # Popular combos, editorial picks
│   └── ui/           # Reusable primitives (SearchBar, Toast, etc.)
├── hooks/            # React hooks (useAccaBuilder, useBalance, useUser)
├── lib/
│   ├── adaptors/     # Venue API adaptors (Polymarket Gamma API)
│   ├── aggregation/  # Market discovery, caching, dedup, sorting
│   ├── contract/     # EVM contract interaction layer
│   ├── engine/       # Hedge stake math, odds validation
│   ├── providers/    # React context providers (Privy, AccaBuilder)
│   ├── relayer/      # Gasless relay request submission
│   └── settlement/   # Settlement event polling & coordination
└── types/            # TypeScript interfaces & types
```

## Smart Contracts

Contracts in `contracts/` use Foundry + Solidity 0.8.24:

- **GoVault** — USDC escrow with deposit/withdraw, fund locking, payout release, platform revenue
- **GoManager** — Acca creation, leg resolution, dispute handling, timeout
- **GoAdaptorRegistry** — Adaptor registration & deprecation
- **GoPolymarketAdaptor** — Polymarket venue integration (relayer-based)
- **GoLimitlessAdaptor** — Limitless venue integration (direct onchain)
- **GoDFlowRelayAdaptor** — Kalshi/DFlow relay integration

## Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Auth**: Privy (Google, Apple, Email, Wallet)
- **Blockchain**: EVM (Base Sepolia), raw `ethereum` provider
- **Venue APIs**: Polymarket Gamma API, CLOB WebSocket
- **Testing**: Jest, React Testing Library, Foundry (Solidity)
- **CI**: GitHub Actions (lint → typecheck → test → build)

## Prerequisites

- Node.js 22
- npm

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in required values:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
```

## Development

```bash
npm run dev
```

## Scripts

| Command             | Description         |
| ------------------- | ------------------- |
| `npm run dev`       | Start dev server    |
| `npm run build`     | Production build    |
| `npm test`          | Run test suite      |
| `npm run typecheck` | TypeScript check    |
| `npm run lint`      | ESLint              |
| `npm run format`    | Prettier formatting |

## Testing

```bash
npm test              # All tests
npm run test:watch    # Watch mode
```

## Deployment

### Contracts

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### Frontend

Deploy to Vercel:

```bash
vercel --prod
```

## License

BUSL-1.1
