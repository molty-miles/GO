# GO Market — Smart Contracts

Enterprise-grade EVM smart contracts for the GO Market accumulator protocol.

## Architecture

```
contracts/
├── src/
│   ├── shared/
│   │   └── GoTypes.sol              # Enums, structs, errors, constants
│   ├── adaptors/
│   │   ├── IVenueAdaptor.sol         # Venue adaptor interface
│   │   ├── GoLimitlessAdaptor.sol    # Limitless (Base) adaptor
│   │   ├── GoPolymarketAdaptor.sol   # Polymarket (Polygon) adaptor
│   │   └── GoDFlowRelayAdaptor.sol  # DFlow/Kalshi (Solana) relay adaptor
│   ├── GoVault.sol                  # Core escrow (UUPS proxy)
│   ├── GoManager.sol                # Acca lifecycle state machine (UUPS proxy)
│   ├── GoSettlementOracle.sol       # Quorum-based resolution (UUPS proxy)
│   └── GoAdaptorRegistry.sol        # Venue adaptor registry
├── test/                            # Foundry tests
├── script/
│   └── DeployGoMarket.s.sol         # Deployment script
├── lib/                             # Forge dependencies
├── foundry.toml
└── remappings.txt
```

## Quick Start

```bash
# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-commit
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.2.0 --no-commit
forge install foundry-rs/forge-std --no-commit

# Compile
forge build

# Test
forge test -vvv

# Gas report
forge test --gas-report
```

## Deployment

1. Set environment variables in `.env`:

   ```
   PRIVATE_KEY=your_deployer_key
   BASE_RPC_URL=https://mainnet.base.org
   POLYGON_RPC_URL=https://polygon-rpc.com
   ETHERSCAN_API_KEY=your_api_key
   ```

2. Update `DeployGoMarket.s.sol` with actual contract addresses for USDC, Limitless Exchange, etc.

3. Deploy:

   ```bash
   # Local testnet
   forge script script/DeployGoMarket.s.sol --rpc-url localhost:8545 --broadcast

   # Base Sepolia
   forge script script/DeployGoMarket.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
   ```

## Contracts Overview

| Contract            | Type    | Proxy | Purpose                                                           |
| ------------------- | ------- | ----- | ----------------------------------------------------------------- |
| GoVault             | Core    | UUPS  | Holds all user USDC deposits. Only AccaManager can move funds.    |
| GoManager           | Core    | UUPS  | Acca lifecycle: create, track, settle. State machine.             |
| GoSettlementOracle  | Core    | UUPS  | Quorum-based (2-of-5) resolution verification. 2h dispute window. |
| GoAdaptorRegistry   | Service | None  | Extensible whitelist of venue adaptors.                           |
| GoLimitlessAdaptor  | Adaptor | None  | Native Base venue integration.                                    |
| GoPolymarketAdaptor | Adaptor | None  | Cross-chain Polygon via relay events.                             |
| GoDFlowRelayAdaptor | Adaptor | None  | Solana via trusted relayer pattern.                               |

## Security

- All core contracts use UUPS upgradeable proxy pattern
- ReentrancyGuard on all state-changing functions
- CEI (Checks-Effects-Interactions) pattern enforced
- Pull-over-push for user withdrawals
- SafeERC20 for all USDC transfers
- Solidity 0.8.24 (built-in overflow protection)
- mulDiv pattern for overflow-safe math
- Access control: Ownable2Step + role-based (AUTHORISED_CALLER, ORACLE, RELAYER)
- Circuit breaker via Pausable (withdrawals always remain open)
- Platform withdrawals require 24h timelock
- Upgrade requires 48h timelock (via separate upgrader multisig)
- Storage gaps (uint256[50] \_\_gap) for future upgrades

## Audit Requirements

Do not deploy to mainnet without:

1. Full audit of GoVault.sol by Trail of Bits or Spearbit
2. Full audit of GoManager.sol state machine
3. Formal verification of vault invariants via Certora or Echidna
4. Independent review of all adaptors

Recommended TVL caps per phase: $50K → $150K → $500K
