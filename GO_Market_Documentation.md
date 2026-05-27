# GO Market — Protocol Documentation

> **The cross-market accumulator layer for onchain prediction markets.**
> Build multi-leg positions across Polymarket, Kalshi, Limitless, and beyond — backed by a decentralised liquidity pool, real hedge execution, and non-custodial smart contracts.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [The Problem GO Market Solves](#2-the-problem-go-market-solves)
3. [How GO Market Works — The Big Picture](#3-how-go-market-works--the-big-picture)
4. [Protocol Participants](#4-protocol-participants)
5. [The Accumulator (Acca) Mechanic](#5-the-accumulator-acca-mechanic)
6. [The GO Liquidity Pool](#6-the-go-liquidity-pool)
7. [Pricing & The Overround Engine](#7-pricing--the-overround-engine)
8. [Real Execution — The Hedge Engine](#8-real-execution--the-hedge-engine)
9. [Venue Integrations](#9-venue-integrations)
10. [Settlement & Oracle Layer](#10-settlement--oracle-layer)
11. [Non-Custodial Vault Architecture](#11-non-custodial-vault-architecture)
12. [Smart Contract Architecture](#12-smart-contract-architecture)
13. [Fee Structure & Revenue Distribution](#13-fee-structure--revenue-distribution)
14. [Risk Management](#14-risk-management)
15. [User Guide](#15-user-guide)
16. [Liquidity Provider Guide](#16-liquidity-provider-guide)
17. [Developer Guide](#17-developer-guide)
18. [Glossary](#18-glossary)
19. [FAQ](#19-faq)

---

## 1. Introduction

GO Market is a decentralised accumulator protocol built on Base. It is the first platform that lets users combine prediction market positions from multiple venues — Polymarket, Kalshi, Limitless, and others — into a single multi-leg bet with multiplied odds.

The core insight is simple: prediction markets are siloed. You can bet on whether ETH hits $4,000 on Polymarket, whether the Fed cuts rates on Kalshi, and whether Man City wins the Premier League on Limitless — but there is no native way to combine those convictions into one unified position that pays out only if all three resolve in your favour. GO Market builds that layer.

Unlike synthetic accumulator products that use venues purely as price feeds and never execute real positions, GO Market executes real hedge positions on the underlying venues on behalf of its liquidity pool. This means GO Market's odds are grounded in real market depth, and the protocol captures genuine edge from cross-market dynamics.

Unlike centralised sportsbooks, GO Market does not require you to trust a company with your funds. Your capital is locked in non-custodial smart contracts you can verify onchain. The protocol — not a company — controls settlement.

Anyone can be a liquidity provider on GO Market. Anyone can build an acca. This document explains exactly how.

---

## 2. The Problem GO Market Solves

### 2.1 Prediction Markets Are Siloed

The onchain prediction market ecosystem has grown significantly. Polymarket, Kalshi, Limitless, and others collectively handle hundreds of millions of dollars in volume. But each platform is an island. A user with conviction across multiple outcomes must:

- Open separate positions on separate platforms
- Fund multiple wallets across multiple chains
- Monitor each position independently
- Receive fragmented payouts at different times

There is no way to compound conviction across markets into a single, higher-upside position. The accumulator mechanic — one of the most popular features in traditional sports betting — simply does not exist in prediction markets.

### 2.2 Existing Solutions Fall Short

**Traditional sportsbooks** offer accumulators but are centralised, opaque, and require trusting a company with your funds. They do not offer prediction market content.

**Single-venue platforms** like Polymarket and Kalshi operate only within their own market inventory. Cross-venue accumulators are structurally outside their incentive to build.

**Synthetic accumulator products** use prediction markets as price oracles but never execute real positions. They face a liquidity bootstrapping problem — without market makers, no quotes are available. They also inherit synthetic pricing risk rather than real market prices.

### 2.3 What GO Market Provides

GO Market gives users one place to browse all major prediction markets, combine any selection into an accumulator, stake once, and receive a single multiplied payout if all legs resolve in their favour. The protocol is always available — no quotes required, no counterparty needed — because the GO Liquidity Pool is the perpetual counterparty, backed by LPs who earn the overround yield from all accumulator activity.

---

## 3. How GO Market Works — The Big Picture

Understanding GO Market requires understanding how its four core components interact. Each component has a distinct role, and they work together seamlessly.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER LAYER                                  │
│   User builds acca → stakes USDC → receives payout on all-win       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                       PROTOCOL LAYER                                 │
│  GOVault (non-custodial escrow) + GOManager (acca lifecycle)         │
│  Pricing Engine (overround) + AdaptorRegistry (venue routing)        │
└──────────┬───────────────────────────────────┬──────────────────────┘
           │                                   │
┌──────────▼──────────┐             ┌──────────▼──────────────────────┐
│   GO LIQUIDITY POOL  │             │        HEDGE EXECUTION           │
│  Azuro-style peer-   │             │  Real positions opened on        │
│  to-pool. LPs fund   │             │  Polymarket, Limitless, DFlow    │
│  the counterparty.   │             │  on behalf of the pool           │
│  Earn overround      │             └──────────┬──────────────────────┘
│  yield passively.    │                        │
└─────────────────────┘             ┌──────────▼──────────────────────┐
                                    │       SETTLEMENT ORACLE           │
                                    │  Multi-source verification of     │
                                    │  outcomes. Quorum required.       │
                                    │  Releases funds onchain.          │
                                    └─────────────────────────────────┘
```

The flow for every acca is:

1. User selects 2 or more prediction market outcomes from the GO Market discovery feed
2. The Pricing Engine computes combined odds, applying the overround
3. User stakes USDC — funds lock in the GOVault (non-custodial)
4. The Hedge Engine opens real positions on each leg's underlying venue
5. As each market resolves, the Settlement Oracle verifies outcomes
6. If all legs win, the GO Liquidity Pool releases the payout to the user
7. If any leg loses, the pool retains the stake and the hedge winnings from completed legs

---

## 4. Protocol Participants

GO Market has four distinct participant types. Each has a defined role, different incentives, and different interactions with the protocol.

### 4.1 Users (Bettors)

Users are individuals who build and place accumulators. They browse the cross-venue discovery feed, select market outcomes, review their combined odds and potential payout, and submit their acca with a USDC stake.

Users never need to interact with underlying venues directly. GO Market abstracts all cross-chain complexity. From the user's perspective, it is a single interface, a single stake, and a single payout.

**User rights:**

- Build accas from any combination of supported markets
- Withdraw unlocked USDC at any time, without permission
- Dispute any settlement that appears incorrect via the resolution process
- View all acca state onchain at any time

### 4.2 Liquidity Providers (LPs)

LPs are the collective counterparty to every acca on GO Market. They deposit USDC into the GO Liquidity Pool and collectively act as the house. In exchange, they earn the overround yield from all accumulator activity on the protocol.

LPs do not set odds. They do not approve individual accas. They simply deposit capital and earn passively. The Pricing Engine handles odds. The Hedge Engine manages risk on their behalf.

This is the key distinction from traditional market maker models: LPs on GO Market are passive capital providers, not active market participants. Anyone — from retail DeFi users to professional treasury managers — can be an LP.

**LP rights:**

- Deposit and withdraw USDC from the pool (subject to lock-up periods)
- Receive GO-LP tokens representing their pool share
- Earn pro-rata share of all protocol revenue
- Participate in governance decisions via GO token (future)

### 4.3 Data Providers

Data providers are the services that supply GO Market with live market data from underlying venues. They index Polymarket, Kalshi/DFlow, and Limitless markets and make them available via the GO Aggregation Layer.

In v1, the data provider role is fulfilled by the GO Market aggregation backend. In future versions, this role will be decentralised and incentivised — third parties can run data provider nodes and earn fees for supplying accurate, low-latency market data.

### 4.4 Resolution Reporters (Oracle Reporters)

Resolution reporters are entities that report market outcomes to the Settlement Oracle. GO Market requires a quorum of independent reporters to confirm any outcome before it is considered final and funds move onchain.

In v1, GO Market operates two classes of reporters: on-chain event listeners that watch venue contracts directly (highest trust), and the DFlow relayer that monitors Kalshi resolution events (disclosed trust). In v2, this layer will be fully decentralised.

---

## 5. The Accumulator (Acca) Mechanic

### 5.1 What Is an Accumulator?

An accumulator is a multi-leg bet where every leg must win for the acca to pay out. Each leg is an independent prediction market position — YES or NO on a specific market outcome. The combined odds of an accumulator are calculated by multiplying the implied odds of each individual leg together.

Because all legs must win simultaneously, accas are higher risk than individual bets. This higher risk is compensated by significantly higher potential returns — combined odds grow multiplicatively, not additively, as legs are added.

**Example:** Three legs at 60%, 55%, and 50% implied probability:

```
Individual odds:  1.67×   1.82×   2.00×
Combined odds:    1.67 × 1.82 × 2.00 = 6.08×
```

A $100 stake on this acca returns $608 if all three legs resolve YES — versus a maximum of $200 if the user had bet $100 on the single highest-odds leg.

### 5.2 How Accas Work on GO Market

GO Market accas have the following properties:

**All-or-nothing settlement.** If every leg resolves YES, the user receives the full combined payout. If any single leg resolves NO, the entire acca is lost. There is no partial payout for winning some legs but not all.

**Real execution on underlying venues.** Every leg of a GO Market acca is backed by a real position on the underlying venue. This is not a synthetic product. When you add a Polymarket market to your acca, the protocol opens a real Polymarket position with GO Liquidity Pool capital. This grounds GO Market's odds in real market prices rather than synthetic pricing models.

**Non-custodial fund locking.** When you submit an acca, your USDC is locked in the GOVault smart contract. The protocol's settlement logic — not a company or individual — controls when and how those funds move. Your unlocked balance can always be withdrawn, regardless of open acca positions.

**Cross-venue in a single transaction.** A GO Market acca can contain legs from different venues. Leg 1 on Polymarket, Leg 2 on Limitless, Leg 3 on Kalshi — all in one acca, all managed by GO Market's smart contracts.

### 5.3 Acca Lifecycle

Every acca on GO Market goes through a defined sequence of states:

```
OPEN → PARTIALLY_RESOLVED → WON (payout released)
                         ↘ LOST (stake forfeited)
     ↘ DISPUTED (unresolved within deadline → multisig review)
     ↘ CANCELLED (user cancels before execution, full refund)
```

**OPEN:** The acca has been created. User USDC is locked. Hedge positions are being opened on underlying venues. All legs are in PENDING state.

**PARTIALLY_RESOLVED:** One or more legs have resolved. The acca remains open. If a leg resolves NO, the acca immediately moves to LOST — no waiting for remaining legs.

**WON:** All legs have resolved YES. The full payout is released from the GO Liquidity Pool to the user's GOVault balance. Hedge winnings from each leg are returned to the pool.

**LOST:** At least one leg resolved NO. The acca is finalised as lost. The user's staked USDC stays in the pool. Any hedge winnings from legs that resolved YES before the loss are retained by the pool.

**DISPUTED:** A leg has not resolved within the configured timeout period, or two oracle reporters disagree on an outcome. The acca is escalated to the GO Market multisig for manual review. No funds move during dispute state.

**CANCELLED:** The user cancelled the acca before any legs were executed, or the multisig resolved a dispute in the user's favour with a full refund.

### 5.4 Accumulator Parameters

| Parameter          | Value        | Notes                                                     |
| ------------------ | ------------ | --------------------------------------------------------- |
| Minimum legs       | 2            | Single-market bets are not accas                          |
| Maximum legs       | 10           | Soft limit in v1. May increase post-audit.                |
| Minimum stake      | $1 USDC      | Protocol minimum                                          |
| Maximum stake      | $10,000 USDC | Per-acca cap in v1. Increases with pool TVL.              |
| Maximum timeout    | 30 days      | If any leg unresolved after 30 days, acca enters DISPUTED |
| Slippage tolerance | 5%           | Acca reverts if execution odds deviate >5% from quoted    |

---

## 6. The GO Liquidity Pool

### 6.1 Overview

The GO Liquidity Pool (GLP) is the collective counterparty to every acca placed on GO Market. It is a shared pool of USDC deposited by liquidity providers. When users win accas, payouts come from the pool. When users lose accas, stakes flow into the pool. The overround built into GO Market's pricing ensures the pool has a structural positive expected value over any meaningful volume of acca activity.

GO Market adopts the **Azuro peer-to-pool model** as the foundation for its liquidity architecture. Rather than requiring individual market makers to price and take risk on each acca, the pool acts as a unified counterparty, and LP capital is deployed collectively across all accas. This makes GO Market immediately liquid for any user at any time — no waiting for a counterparty, no RFQ response window, no minimum bet size to attract attention.

### 6.2 The LiquidityTree — How LP Capital Is Tracked

GO Market uses an adaptation of Azuro's **LiquidityTree** — a segment tree data structure — to track individual LP balances within the shared pool. This solves a fundamental accounting problem: how do you fairly attribute profits and losses to individual LPs when all their capital is deployed as a single pool across many concurrent active accas?

The LiquidityTree works as follows:

Each LP deposit initialises a new leaf node in the tree. That leaf represents the LP's unique capital position. Parent nodes aggregate the values of their children. The root node represents the total pool value at any point in time.

When a new acca is created and LP capital is reserved to back the potential payout, the reservation is recorded against the tree using a lazy update mechanism — rather than updating every LP's individual leaf (which would be prohibitively gas-intensive), the protocol marks the deduction at the highest relevant parent node. The actual per-LP impact is only calculated when an LP goes to withdraw.

This means:

- Deposits are gas-intensive (initialising a new leaf)
- But balance updates from thousands of concurrent active accas are gas-efficient (lazy parent-node updates)
- When an LP withdraws, their final balance is computed correctly by traversing the tree from root to their leaf, applying all deferred updates along the way

**Example:**

```
Pool state: 3 LPs, total $600 USDC

         Root ($600)
        /            \
   Node A ($350)    Node B ($250)
   /        \            |
LP1 ($150) LP2 ($200)  LP3 ($250)

New acca: requires $30 pool reservation
→ Root updates to $570. Node A updates to $320. Leaves unchanged (lazy).
→ LP1 and LP2 actual balances only computed on their next withdrawal.
```

### 6.3 LP Token — GO-LP

When an LP deposits USDC into the GO Liquidity Pool, they receive **GO-LP tokens** representing their proportional share of the pool. GO-LP tokens are ERC-20 compatible and represent a claim on the LP's leaf node in the LiquidityTree.

GO-LP tokens are not transferable in v1 (to prevent secondary market complexity and regulatory ambiguity). This will be revisited in v2.

The value of an LP's position changes continuously as:

- New accas are created (reserving pool capital against potential payouts)
- Accas settle as lost (stake flows into pool, increasing LP value)
- Accas settle as won (payout flows out of pool, decreasing LP value)
- Hedge winnings return from underlying venues (increasing LP value)
- Protocol fees are deducted (decreasing LP value slightly)

### 6.4 The Overround Advantage for LPs

The core reason LP capital earns a positive expected return is the **overround** built into GO Market's pricing. The protocol quotes users combined odds that are systematically lower than the mathematically fair combined odds by a defined percentage — the overround. This means that across all accas placed on GO Market, the pool has a structural positive expected value.

The overround is GO Market's equivalent of the house edge. But unlike a traditional sportsbook where the house captures 100% of the edge, GO Market's overround accrues primarily to LPs who have provided the capital — with the protocol taking a defined fee as infrastructure provider.

The overround compounds with leg count. A 5-leg acca at 10% overround per-combo yields significantly more pool edge per dollar staked than a 2-leg acca. This means LP yield per dollar of pool capital increases as users build longer accas — which is exactly when the pool is also taking more risk, creating a natural risk/reward alignment.

Additionally, real-world prediction markets embed their own vig into prices. The probability that all legs of a long-shot acca resolve YES is typically lower than the mathematical product of each leg's quoted probability — because individual market prices already include a bias toward the less likely outcome. GO Market's hedge positions benefit from this structural edge in underlying markets.

### 6.5 LP Risk Profile

LPs take on variance risk, not directional risk. They do not need a view on any specific market outcome. They are earning yield from the overround — which is structural and persistent — not from predicting events.

However, in any finite time period, the pool can experience runs of winning accas that deplete capital faster than the overround replenishes it. This is the same variance any casino faces. GO Market mitigates this through:

**Per-acca exposure limits.** No single acca can reserve more than a defined percentage of total pool capital for its potential payout. This caps downside from any single losing outcome.

**Dynamic hedge execution.** The Hedge Engine executes real positions on underlying venues for every leg. If an acca wins, hedge positions return winnings to the pool, partially or fully offsetting the payout. The pool's true P&L per acca is the overround differential, not the full potential payout.

**Withdrawal lock-up.** LPs must provide 7 days notice before withdrawing capital. This prevents bank-run dynamics where large LP withdrawals during a losing streak compound the pool's stress.

**TVL cap.** In v1, total pool TVL is capped. This limits exposure during the protocol's early phase before deep operating history is established.

### 6.6 LP Yield Formula

LP yield on GO Market comes from three sources:

```
LP Yield = Overround Capture + Hedge Winnings Return + Float Yield
           minus Protocol Fee
```

**Overround capture** is the primary yield source. For every acca that loses (the majority, given accumulator mechanics), the pool retains the user's stake. The systematic overround ensures the pool has positive EV across all outcomes.

**Hedge winnings return** occurs when a leg of a losing acca resolves YES before another leg resolves NO. The hedge position on that winning leg returns winnings to the pool, even though the acca overall is lost. This is incremental yield on top of the raw stake retention.

**Float yield** comes from idle pool capital earning stablecoin yield (via Aave or equivalent protocols) while not deployed in active hedge positions. Given the Hedge Engine's dynamic re-hedging (freeing capital as legs resolve), a meaningful portion of pool capital is idle at any given time.

**Protocol fee** is 15% of gross pool yield, taken by the GO Market protocol treasury for infrastructure, development, and operations.

---

## 7. Pricing & The Overround Engine

### 7.1 How Odds Are Derived

GO Market sources raw odds directly from the underlying venue's order book or market feed via the Aggregation Layer. The raw odds represent the best available price for a given market outcome at the time of acca creation.

Raw odds are expressed as the implied probability of the YES outcome — a number between 0 and 1. An implied probability of 0.60 means the market prices the YES outcome at 60% likelihood, giving an odds multiplier of 1/0.60 = 1.67×.

### 7.2 The Overround

The overround is a systematic reduction applied to the combined odds of an acca before quoting the user. It is GO Market's pricing edge and the primary source of LP yield.

GO Market applies a progressive overround that increases with leg count:

| Leg Count | Overround Factor | Effective House Edge           |
| --------- | ---------------- | ------------------------------ |
| 2         | 5%               | ~5% of stake per resolved acca |
| 3–4       | 8%               | ~8%                            |
| 5–6       | 10%              | ~10%                           |
| 7–8       | 12%              | ~12%                           |
| 9–10      | 15%              | ~15%                           |

The overround is applied as follows:

```
fair_combined_odds = product of (1 / c_i) for all legs i
overround_factor   = 1 - (overround_pct / 100)
quoted_combined_odds = fair_combined_odds × overround_factor
quoted_payout = stake × quoted_combined_odds
```

**Example — 3-leg acca:**

```
Leg 1 (ETH > $4k):     c_yes = 0.61  →  odds = 1.639×
Leg 2 (Fed cut):        c_yes = 0.44  →  odds = 2.273×
Leg 3 (Man City PL):   c_yes = 0.55  →  odds = 1.818×

Fair combined odds = 1.639 × 2.273 × 1.818 = 6.77×
Overround (3 legs) = 8%  →  factor = 0.92
Quoted combined odds = 6.77 × 0.92 = 6.23×

User stakes $100 → To win: $623
```

The difference between the fair payout ($677) and the quoted payout ($623) represents the pool's structural edge on this acca: $54 in expected value, or 8% of the quoted payout.

### 7.3 Slippage Protection

When a user builds an acca and submits it, they include a `minCombinedOdds` parameter — the minimum combined odds they are willing to accept. If the execution odds at submission time have moved more than 5% from the odds displayed in the UI, the acca creation transaction reverts and the user is refunded.

This protects users from front-running and significant market moves between building and submitting their acca.

### 7.4 Real-Time Odds

Odds on GO Market update in near-real-time as underlying venue prices move. The Aggregation Layer polls venue APIs every 15–30 seconds for active markets and maintains a WebSocket feed for price updates. As a user builds their acca slip, the combined odds display updates live to reflect the current prices of each selected leg.

---

## 8. Real Execution — The Hedge Engine

### 8.1 Why Real Execution Matters

GO Market's most distinctive architectural choice is real execution: every leg of every acca is backed by an actual position opened on the underlying venue, using GO Liquidity Pool capital as the hedge stake.

This is not a synthetic product. When you build a 3-leg acca across Polymarket, Limitless, and Kalshi, the protocol opens three real positions — one on each venue — within seconds of your acca being confirmed.

Real execution matters for three reasons:

**Price integrity.** GO Market's odds are grounded in real market depth. The protocol cannot quote odds that cannot be executed. If a Polymarket market is illiquid, the slippage will be detected at execution and either absorbed within tolerance or cause the acca to revert.

**Risk management.** The hedge positions partially or fully offset the pool's payout obligation on winning accas. The pool does not bear the full potential payout as pure risk — hedge winnings return to the pool when users win.

**Structural edge.** Real execution means GO Market participates in real-world market dynamics. Positions on Polymarket accumulate real trading volume, which can create beneficial market impact over time as the protocol grows.

### 8.2 Hedge Stake Calculation

For each leg `i` in an acca with total potential payout `D` and per-leg implied probabilities `c_j`:

```
hedge_stake_i = D × ∏(c_j) for all j ≠ i
```

This formula ensures that if all other legs win, the hedge on leg `i` returns exactly `D` to cover the user payout — regardless of whether leg `i` wins or loses.

**Concrete example — 3-leg acca, $100 stake, combined payout $623:**

```
c_1 = 0.61 (ETH > $4k)
c_2 = 0.44 (Fed cut)
c_3 = 0.55 (Man City)

Hedge on leg 1 = $623 × (0.44 × 0.55) = $623 × 0.242 = $150.77
Hedge on leg 2 = $623 × (0.61 × 0.55) = $623 × 0.336 = $209.33
Hedge on leg 3 = $623 × (0.61 × 0.44) = $623 × 0.268 = $167.76

Total hedge capital = $527.86
```

The pool deploys $527.86 in hedge capital to back the user's $100 stake. If the user wins, hedge positions return approximately $623 to the pool, covering the payout. If the user loses, the pool retains the $100 stake and any partial hedge winnings from legs that resolved YES before the loss.

### 8.3 Dynamic Re-Hedging

As individual legs of an acca resolve, the remaining open hedge positions are dynamically adjusted. Specifically, when a leg resolves YES:

- That leg's hedge position has won and its proceeds are returned to the pool
- The remaining hedge positions on unresolved legs are still needed at their original size (since the full payout D is still on the line if all remaining legs win)
- No re-hedging is required for leg resolutions

When a leg resolves NO, the acca is immediately lost:

- All remaining open hedge positions are closed or left to expire
- The pool retains the user's stake
- Any proceeds from already-resolved YES legs are already in the pool
- Positions on unresolved legs are unwound where possible to recover capital

The practical effect of this dynamic management is that average hedge capital deployment is 30–50% lower than the static worst-case number. Capital freed from closed positions re-enters the pool, earning float yield until deployed in the next acca.

### 8.4 Slippage & Execution Failure Handling

When the Hedge Engine attempts to open a position on an underlying venue, the execution price may differ from the quoted price due to market movement or liquidity constraints.

**Within tolerance (≤5%):** The execution proceeds. The difference between quoted and executed odds is absorbed by the pool. This is accounted for in the overround buffer.

**Outside tolerance (>5%):** The acca creation transaction reverts. The user's funds are not locked. The user sees an error and can rebuild the acca with current market prices.

**Complete execution failure** (venue unavailable, adaptor error): The relevant leg enters a DISPUTED state. The acca manager notifies the multisig for manual intervention. No user funds move until the dispute is resolved.

---

## 9. Venue Integrations

GO Market aggregates markets from multiple prediction market venues and executes hedge positions on each. Every venue is integrated via a standardised adaptor interface — making the protocol extensible to new venues without changes to core contracts.

### 9.1 Polymarket (Polygon)

Polymarket is the largest onchain prediction market by volume. It operates on Polygon and uses the Conditional Token Framework (CTF) for position representation and UMA's Optimistic Oracle for market resolution.

**Market data:** GO Market indexes Polymarket markets via the Gamma API (`gamma-api.polymarket.com`). Active markets, categories, volume, and live prices are polled every 15–30 seconds and streamed via WebSocket for real-time updates.

**Hedge execution:** Polymarket hedge positions are opened via the Polymarket CTF Exchange contract on Polygon. Because GO Market's core contracts live on Base, a platform-controlled relayer executes Polymarket positions on Polygon on behalf of the pool. This relayer operates with multi-signature key management and is fully disclosed to users.

**Settlement:** Polymarket markets resolve via UMA's OptimisticOracleV2. GO Market's oracle listener monitors UMA settlement events on Polygon, waits for the dispute window (2 hours), and reports the outcome to GO Market's Settlement Oracle once confirmed.

**Key contracts:**
| Contract | Network | Purpose |
|---|---|---|
| CTF Exchange | Polygon | Position execution |
| ConditionalTokens | Polygon | ERC-1155 position tokens |
| UMA OptimisticOracle V2 | Polygon | Market resolution |
| USDC (Bridged) | Polygon | Settlement token |

### 9.2 Limitless (Base)

Limitless is a prediction market protocol native to Base — the same chain as GO Market's core contracts. This makes it the cleanest integration: direct contract-to-contract calls, no cross-chain messaging required.

**Market data:** Limitless markets are indexed via Envio's GraphQL indexer and Limitless's native REST and WebSocket APIs.

**Hedge execution:** GO Market's LimitlessAdaptor directly calls the Limitless exchange contract on Base to open YES/NO share positions. Execution is fully on-chain and atomic with the acca creation transaction.

**Settlement:** The LimitlessOracle emits resolution events on Base. GO Market's oracle listener detects these events immediately and reports outcomes to the Settlement Oracle. Settlement confirmation is near-instant — no cross-chain delay.

### 9.3 Kalshi via DFlow (Solana)

Kalshi is a CFTC-regulated prediction market operating on traditional infrastructure, with a tokenised market layer available on Solana via DFlow. DFlow enables onchain interaction with Kalshi's prediction markets using Jupiter for order routing.

**Market data:** GO Market indexes DFlow/Kalshi markets via the DFlow Metadata API (`dev-prediction-markets-api.dflow.net`). Categories, markets, series, and live prices are indexed and normalised into GO Market's unified market schema.

**Hedge execution:** Because Solana programs cannot be called directly from Base EVM, GO Market uses a trusted **DFlow Relayer** — an off-chain service that listens for hedge requests emitted by the DFlowRelayAdaptor contract on Base, and executes the corresponding position on Solana via DFlow.

The relayer is operated with the following trust mitigations:

- Relayer signing keys held in Hardware Security Module (AWS KMS)
- All relay actions emitted as on-chain events on Base — full audit trail
- If the relayer fails to confirm execution within 10 minutes, the acca leg enters DISPUTED state automatically
- v2 will replace relayer trust with Wormhole cross-chain message verification

**Settlement:** DFlow/Kalshi resolution events are monitored by the relayer service via DFlow's WebSocket API. When a market resolves, the relayer calls `DFlowRelayAdaptor.reportSettlement()` on Base, which forwards to the Settlement Oracle for quorum validation.

### 9.4 Adding New Venues

GO Market is designed for extensibility. The `AdaptorRegistry` contract maintains a whitelist of approved venue adaptors. Any team can develop a new adaptor that implements the `IVenueAdaptor` interface and submit it for review and registration.

Adding a new venue requires:

1. Implementing the `IVenueAdaptor` interface (see [Developer Guide](#17-developer-guide))
2. Deploying and verifying the adaptor contract
3. GO Market DAO vote to register the adaptor (post-governance launch)
4. Integration of the venue's data feed into the Aggregation Layer

New venues do not require any changes to `GOVault`, `GOManager`, or the LiquidityPool contracts.

---

## 10. Settlement & Oracle Layer

### 10.1 Why Settlement Requires a Dedicated Layer

Settling accas on GO Market requires knowing definitively when each prediction market leg has resolved and what the outcome is. This information lives on different chains and in different oracle systems — UMA on Polygon for Polymarket, LimitlessOracle on Base, DFlow APIs for Kalshi on Solana.

The Settlement Oracle layer aggregates, validates, and finalises these resolution signals before allowing any on-chain fund movement. No settlement happens on GO Market without oracle confirmation.

### 10.2 Oracle Architecture

GO Market's Settlement Oracle requires a **quorum of independent reporters** before finalising any outcome. A single source — even a trusted on-chain oracle — is insufficient. Quorum provides defence against individual reporter failure, manipulation, and bugs.

| Reporter Type                            | Source                           | Trust Level                                 |
| ---------------------------------------- | -------------------------------- | ------------------------------------------- |
| On-chain event listener (Limitless)      | LimitlessOracle contract on Base | Highest — directly verifiable onchain       |
| On-chain event listener (Polymarket)     | UMA OptimisticOracle on Polygon  | High — verified after 2h dispute window     |
| DFlow Relayer (Kalshi)                   | DFlow WebSocket API              | Disclosed — mitigated by HSM key management |
| Chainlink Price Feed (financial markets) | Chainlink on Base                | High — decentralised oracle network         |
| Multisig Backup                          | GO Market 3-of-5 multisig        | Dispute resolution only                     |

Required quorum: **2 independent reporters** must confirm the same outcome before the Settlement Oracle finalises a leg resolution.

### 10.3 Dispute Window

For Polymarket legs, GO Market enforces a minimum 2-hour dispute window after UMA reports a settlement, matching UMA's own dispute period. Resolution is not forwarded to `GOManager` until this window has passed.

For other venues, the dispute window is 15 minutes — enough time to catch obvious errors before funds move.

### 10.4 Conflict Resolution

If two reporters report conflicting outcomes for the same leg, the Settlement Oracle:

1. Immediately moves the leg to DISPUTED state
2. Freezes all fund movement for the affected acca
3. Notifies the GO Market multisig for manual review
4. Resolves within 48 hours with the correct outcome, or issues a full refund

All disputes are logged on-chain and publicly visible. The multisig's resolution decisions are emitted as events for community transparency.

---

## 11. Non-Custodial Vault Architecture

### 11.1 The Core Principle

GO Market's vault architecture is non-custodial. This means:

- **The protocol cannot unilaterally move your funds.** Only the settlement logic triggered by verified oracle outcomes can release locked funds.
- **You can always withdraw your unlocked balance.** No permission required. No delays. No conditions.
- **The protocol's multisig cannot steal user funds.** The multisig can resolve disputes and pause the protocol — it cannot redirect locked user funds to any address other than the rightful owner.

This is achieved through smart contract architecture, not promises.

### 11.2 GOVault — How It Works

`GOVault.sol` is the escrow contract. Every user's USDC balance is tracked in the vault with two states:

**Available balance:** USDC you have deposited but not staked in an active acca. You can withdraw this at any time by calling `withdraw()`.

**Locked balance:** USDC staked in an active acca. This balance cannot be withdrawn while the acca is open. It is released — either to you (if you win) or to the LP pool (if you lose) — only when the Settlement Oracle confirms all leg outcomes.

The vault enforces one inviolable rule at all times:

```
USDC.balanceOf(vault) ≥ sum(all user available balances) + sum(all locked balances)
```

This invariant is checked on every state change. If it ever fails, the vault pauses automatically.

### 11.3 What "Non-Custodial" Means in Practice

| Scenario                       | What Happens                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| You deposit USDC               | Funds appear in your available balance immediately                                                           |
| You withdraw available balance | Funds transferred to your wallet in the same transaction                                                     |
| You place an acca              | Available balance decreases, locked balance increases                                                        |
| Your acca wins                 | Locked balance transferred to available balance + payout                                                     |
| Your acca loses                | Locked balance moved to LP pool                                                                              |
| GO Market is paused            | You can still withdraw available balance. Locked funds stay locked until resolution.                         |
| Multisig is compromised        | Multisig cannot move user balances. Only admin functions (pause, oracle management) are multisig-controlled. |

### 11.4 Emergency Procedures

If a critical vulnerability is discovered:

1. The multisig can pause the vault. Pausing blocks new deposits and new acca creation.
2. Withdrawals of available balances are **never** blocked — even in pause state.
3. Active accas continue to settle normally. Locked funds release when legs resolve.
4. If an upgrade is required, the UUPS proxy upgrade process requires a 48-hour timelock and upgrader multisig approval before any code change takes effect.

---

## 12. Smart Contract Architecture

### 12.1 Contract Overview

GO Market is deployed on **Base** (primary chain) with adaptor-level interactions on Polygon and Solana.

| Contract                | Chain | Purpose                                                   |
| ----------------------- | ----- | --------------------------------------------------------- |
| `GOVault.sol`           | Base  | Non-custodial USDC escrow for all users                   |
| `GOManager.sol`         | Base  | Acca lifecycle — create, track, settle                    |
| `GOLiquidityPool.sol`   | Base  | LP capital management, LiquidityTree, GO-LP token         |
| `AdaptorRegistry.sol`   | Base  | Whitelist of approved venue adaptors                      |
| `SettlementOracle.sol`  | Base  | Multi-reporter quorum settlement layer                    |
| `LimitlessAdaptor.sol`  | Base  | Native Base integration with Limitless                    |
| `PolymarketAdaptor.sol` | Base  | Relayer-based integration with Polymarket on Polygon      |
| `DFlowRelayAdaptor.sol` | Base  | Relayer-based integration with Kalshi via DFlow on Solana |
| `IVenueAdaptor.sol`     | Base  | Interface all adaptors must implement                     |

### 12.2 Upgradeability

`GOVault` and `GOManager` use the **UUPS (Universal Upgradeable Proxy Standard)** pattern. This allows bug fixes and feature additions without requiring users to migrate funds. Upgrades are subject to:

- 48-hour timelock (no instant upgrades)
- Separate upgrader multisig (2-of-3) — distinct from the operator multisig
- Storage layout immutability (upgrades cannot reorder or remove existing storage variables)

Venue adaptors are **not** proxied. They are replaced via the AdaptorRegistry. Replacing an adaptor does not affect existing active legs — those continue to run against the adaptor they were created on until resolution.

### 12.3 Access Control

| Role              | Holder                              | Capabilities                                                           |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| OWNER             | 3-of-5 Gnosis Safe                  | Pause/unpause, oracle management, platform withdrawals (with timelock) |
| UPGRADER          | 2-of-3 multisig                     | Execute UUPS upgrades (48h timelock)                                   |
| AUTHORISED_CALLER | GOManager only                      | Call vault lock/release functions                                      |
| ORACLE            | Registered oracle addresses (max 5) | Report leg resolutions via SettlementOracle                            |
| RELAYER           | Registered relayer addresses        | Confirm DFlow execution and settlement                                 |

### 12.4 Security Properties

- `nonReentrant` modifier on all external state-changing functions
- Checks-Effects-Interactions pattern enforced throughout — state updates before external calls
- `SafeERC20` for all token transfers — no raw `transfer()` calls
- Solidity 0.8.24 — built-in overflow protection
- All arithmetic uses 1e18 fixed-point with `mulDiv` to prevent intermediate overflow
- Vault invariant checked on every state change — auto-pause on violation
- No unbounded loops — gas usage is predictable and bounded

---

## 13. Fee Structure & Revenue Distribution

### 13.1 Protocol Fee

GO Market charges a **15% protocol fee on gross LP pool yield**. This fee is taken from pool earnings — not from user stakes directly. Users see their full quoted payout on winning accas. The fee is invisible to bettors.

The protocol fee funds:

- Smart contract development and maintenance
- Aggregation layer infrastructure
- Security audits and bug bounties
- Legal compliance and licensing
- Community grants and ecosystem development

### 13.2 Revenue Distribution

| Recipient         | Share              | Source                                   |
| ----------------- | ------------------ | ---------------------------------------- |
| LP Pool           | 85% of gross yield | Overround + hedge winnings + float yield |
| Protocol Treasury | 15% of gross yield | Infrastructure, development, compliance  |

### 13.3 Float Yield

Idle pool capital (capital not reserved against active accas) is deployed into Aave v3 on Base to earn stablecoin yield. This yield accrues to the pool (85%) and protocol treasury (15%) on the same split as overround yield.

Given the dynamic re-hedging mechanic that frees 30–50% of hedge capital as legs resolve, a meaningful portion of pool capital is earning float yield at any given time.

---

## 14. Risk Management

### 14.1 Per-Acca Exposure Cap

No single acca can reserve more than **5% of total pool TVL** as its potential payout. This cap ensures that even the largest individual losing acca cannot significantly destabilise the pool.

As pool TVL grows, the absolute cap value grows proportionally — larger pools can accommodate larger maximum payouts.

### 14.2 Odds Floor

GO Market enforces a minimum implied probability of **5% (0.05)** for any individual leg. Legs with implied probability below 5% are not available on GO Market. This prevents extreme long-shot legs from creating outsized payout obligations relative to hedge costs.

### 14.3 Leg Count Cap

The maximum of 10 legs per acca limits both payout multiplier size and hedge complexity. As the combined odds of a 10-leg acca can exceed 1,000×, even a $100 stake would create a $100,000 payout obligation. The 5% per-pool-TVL cap provides a second layer of protection.

### 14.4 Withdrawal Lock-Up

LPs must give **7 days notice** before withdrawing capital. When a withdrawal is requested, the LP's capital is reserved — no new accas can be created against it — and the withdrawal executes after the lock-up period.

This prevents bank-run dynamics where large LP withdrawals during a losing streak concentrate risk on remaining LPs.

### 14.5 TVL Cap

In v1, total pool TVL is capped at **$500,000 USDC**. This cap will be raised in phases following:

- Successful audit completion
- Operating history establishing observed hold rates
- Community governance vote

### 14.6 Circuit Breakers

| Trigger                                    | Effect                                           |
| ------------------------------------------ | ------------------------------------------------ |
| Vault invariant breach                     | Automatic pause — no new deposits or accas       |
| Two oracles report conflicting outcomes    | Acca enters DISPUTED — no fund movement          |
| Relayer fails to confirm within 10 minutes | Leg enters DISPUTED — escalates to multisig      |
| Slippage >5% at execution                  | Acca reverts — user refunded                     |
| Pool utilisation >80%                      | New acca creation paused until utilisation falls |

---

## 15. User Guide

### 15.1 Getting Started

**Step 1 — Connect your wallet**

GO Market supports MetaMask, Coinbase Wallet, and any WalletConnect-compatible wallet. You need a wallet on Base network. If you are new to Base, add it in your wallet settings (Chain ID: 8453, RPC: https://mainnet.base.org).

**Step 2 — Deposit USDC**

Navigate to the Account page and tap Deposit. Enter the amount of USDC you want to deposit. Approve the USDC spend and confirm the deposit transaction. Your balance appears immediately after the transaction confirms.

You only need to deposit once. Your balance persists across sessions and can be used for multiple accas.

**Step 3 — Browse markets**

The Home page shows all available markets from Polymarket, Kalshi, and Limitless in a unified feed. Use the category filters (Crypto, Macro, Sports, Politics) or search bar to find markets you have conviction on.

Each market card shows the current YES price, total volume, venue badge, and resolution date.

**Step 4 — Build your acca**

Tap **+ ADD** on any market card to add that market's YES outcome to your acca slip. The slip appears at the bottom of the screen. As you add legs, your combined odds update in real time.

You must add at least 2 legs before you can submit. You can add up to 10 legs.

**Step 5 — Set your stake and submit**

Open your acca slip. Enter your stake amount or use the quick-select buttons. Review your combined odds and potential payout. Tap **PLACE ACCA** and confirm the transaction in your wallet.

Your acca is now live. You can monitor each leg's status from the Positions page.

**Step 6 — Settlement**

As each leg resolves on its underlying venue, your acca updates automatically. If all legs win, your payout is automatically added to your available balance — ready to withdraw or use in your next acca. If any leg loses, the acca is settled as lost.

### 15.2 Managing Positions

The **Positions** page shows all your active and settled accas. Active accas display each leg's current status — PENDING, WON, or LOST. Settled accas show the final outcome and payout amount.

### 15.3 Withdrawing Funds

Navigate to Account → Withdraw. Enter the amount you want to withdraw (must be ≤ your available balance). Confirm the transaction. Funds arrive in your wallet immediately.

Your **locked balance** (funds in active accas) cannot be withdrawn until those accas settle.

### 15.4 Understanding Your Odds

The combined odds displayed on your acca slip are the odds after the overround has been applied. They represent your actual potential payout multiple. You will see slightly lower combined odds than you might calculate by multiplying each leg's raw probability — this difference is the overround.

GO Market does not hide this. The overround rate is published openly in this documentation and visible in the protocol's smart contracts.

---

## 16. Liquidity Provider Guide

### 16.1 Becoming an LP

Navigate to the **Earn** page (available from the Account menu). Select the pool you want to provide to. In v1 there is a single unified pool. Enter the USDC amount you want to deposit and confirm the transaction.

You will receive **GO-LP tokens** representing your share of the pool. These tokens track your proportional claim on all pool assets.

### 16.2 Understanding Your Position

Your LP position value changes over time based on pool activity:

- Goes up when users lose accas (stakes flow into pool)
- Goes up when hedged winning legs return proceeds (above payout cost)
- Goes up from float yield on idle capital
- Goes down when users win accas (payouts flow out of pool)
- Goes down slightly from protocol fee deductions

Over any meaningful time period and volume, the overround ensures positive expected value for LPs. Short-term variance is normal and expected.

### 16.3 Withdrawing Liquidity

LP withdrawals require a **7-day notice period**. To initiate a withdrawal:

1. Navigate to Earn → Your Position
2. Tap Request Withdrawal
3. Enter the amount you want to withdraw
4. Confirm the transaction — this initiates the 7-day lock

After 7 days, your withdrawal becomes executable. Return to Earn → Your Position and confirm the final withdrawal transaction. USDC arrives in your wallet immediately.

You can cancel a pending withdrawal at any time during the 7-day lock period.

### 16.4 LP Risk Considerations

Providing liquidity to GO Market carries variance risk. In any finite period, the pool can lose money if users win accas at a rate exceeding the overround's compensation. LPs should:

- Only provide capital they are comfortable having illiquid for at least 7 days
- Understand that short-term losses are possible even with positive long-run expected value
- Diversify their LP positions across multiple protocols rather than concentrating in GO Market

---

## 17. Developer Guide

### 17.1 Building on GO Market

GO Market is designed as an open protocol. Developers can:

- Build custom frontend interfaces that connect to GO Market's smart contracts
- Develop new venue adaptors to add prediction market sources
- Build analytics and data tools using GO Market's public event stream
- Integrate GO Market's liquidity pool into other DeFi products

### 17.2 Smart Contract Addresses (Base Mainnet)

_Addresses will be published here following mainnet deployment._

| Contract          | Address |
| ----------------- | ------- |
| GOVault           | TBD     |
| GOManager         | TBD     |
| GOLiquidityPool   | TBD     |
| AdaptorRegistry   | TBD     |
| SettlementOracle  | TBD     |
| LimitlessAdaptor  | TBD     |
| PolymarketAdaptor | TBD     |
| DFlowRelayAdaptor | TBD     |

### 17.3 IVenueAdaptor Interface

All venue adaptors must implement the following interface:

```solidity
interface IVenueAdaptor {

    // Execute a hedge position on the venue.
    // Called by GOManager on acca creation.
    // Returns opaque positionRef for future reference.
    function executePosition(
        bytes32 legId,
        bytes32 venueMarketId,
        bool    outcome,        // true = YES, false = NO
        uint256 hedgeStake,     // USDC amount (1e6)
        uint256 minOdds,        // slippage floor (1e18)
        bytes calldata extraData
    ) external returns (bytes memory positionRef);

    // Close/unwind a position early (acca cancellation).
    // Returns USDC amount recovered.
    function closePosition(
        bytes32 legId,
        bytes memory positionRef
    ) external returns (uint256 amountRecovered);

    // Query current settlement status from venue.
    function querySettlement(
        bytes32 legId,
        bytes memory positionRef
    ) external view returns (uint8 status, uint256 payout);

    // Venue identifier (e.g. 'polymarket-v2', 'limitless-v1').
    function venueId() external view returns (string memory);

    // Whether this adaptor requires off-chain relayer.
    function requiresRelayer() external view returns (bool);
}
```

### 17.4 Key Events

GO Market emits the following events for off-chain indexing and analytics:

```solidity
// Emitted when a new acca is created
event AccaCreated(
    bytes32 indexed accaId,
    address indexed user,
    uint256 stake,
    uint256 potentialPayout,
    uint256 combinedOdds,
    bytes32[] legIds
);

// Emitted when a leg resolves
event LegResolved(
    bytes32 indexed legId,
    bytes32 indexed accaId,
    bool won,
    uint256 resolvedAt
);

// Emitted when an acca is fully settled
event AccaSettled(
    bytes32 indexed accaId,
    address indexed user,
    bool won,
    uint256 payout
);

// Emitted when LP deposits
event LiquidityDeposited(
    address indexed lp,
    uint256 amount,
    uint256 leafNode,
    uint256 timestamp
);

// Emitted when LP withdrawal is requested
event WithdrawalRequested(
    address indexed lp,
    uint256 amount,
    uint256 executeAfter
);
```

### 17.5 Aggregation Layer API

GO Market exposes a public REST and WebSocket API for market data:

**REST endpoints:**

```
GET /v1/markets
  ?category=crypto|macro|sports|politics
  &venue=polymarket|kalshi|limitless
  &min_volume=1000
  &sort=volume|odds|resolution_date
  &limit=50&offset=0

GET /v1/markets/{id}

GET /v1/markets/search?q={query}
```

**WebSocket:**

```
ws://api.gomarket.xyz/v1/ws/prices
→ Subscribes to real-time price updates for all active markets

ws://api.gomarket.xyz/v1/ws/settlements
→ Subscribes to real-time settlement events
```

**Unified market schema:**

```json
{
  "id": "string",
  "venue": "polymarket | kalshi | limitless",
  "question": "string",
  "category": ["crypto", "macro", "sports", "politics"],
  "c_yes": 0.61,
  "volume": 2840000,
  "liquidity": 450000,
  "resolution_date": "2026-06-30T00:00:00Z",
  "active": true,
  "end_time": "2026-06-30T00:00:00Z"
}
```

---

## 18. Glossary

**Accumulator (Acca):** A multi-leg bet where all legs must win for a payout. Combined odds are the product of all individual leg odds.

**Available Balance:** USDC in your GOVault that is not staked in an active acca. Can be withdrawn at any time.

**Combined Odds:** The product of all individual leg odds in an acca, adjusted by the overround. Represents your payout multiple.

**Data Provider:** A service that supplies GO Market with live market data from underlying prediction market venues.

**DFlow:** A Solana-based infrastructure layer that enables tokenised access to Kalshi prediction markets.

**Disputed:** An acca state in which a leg has not resolved within the timeout period, or oracle reporters have provided conflicting outcomes. Escalates to multisig review.

**Dynamic Re-Hedging:** The process of adjusting hedge positions as individual legs resolve, freeing capital for redeployment.

**Hedge Stake:** USDC deployed by the GO Liquidity Pool on an underlying venue to back each leg of an acca. Returns to the pool if the leg wins.

**GO-LP Token:** ERC-20 token representing an LP's proportional share of the GO Liquidity Pool.

**GO Liquidity Pool (GLP):** The shared pool of USDC deposited by LPs that collectively acts as the counterparty to all accas on GO Market.

**IVenueAdaptor:** The smart contract interface that all venue integrations must implement.

**Leg:** A single prediction market position within an accumulator. Each leg is a YES or NO bet on one specific market outcome.

**LiquidityTree:** A segment tree data structure used to track individual LP balances within the shared pool efficiently, with gas-light lazy updates.

**Locked Balance:** USDC staked in an active acca. Cannot be withdrawn while the acca is open.

**Oracle Reporter:** A service that reports market resolution outcomes to the Settlement Oracle.

**Overround:** The systematic reduction applied to combined odds before quoting users. Represents GO Market's structural pricing edge and the primary source of LP yield.

**Partially Resolved:** An acca state where some but not all legs have resolved.

**Settlement Oracle:** The smart contract that aggregates resolution reports from multiple oracle reporters and requires a quorum before finalising any outcome.

**Slippage:** The difference between quoted odds at acca build time and executed odds at submission time. Accas revert if slippage exceeds 5%.

**TVL (Total Value Locked):** The total USDC deposited in the GO Liquidity Pool.

**Venue:** A prediction market platform from which GO Market sources markets and executes hedge positions. Currently: Polymarket, Limitless, Kalshi via DFlow.

**vAMM:** Virtual Automated Market Maker. A pricing mechanism that dynamically adjusts odds based on pool utilisation and bet flow, without requiring physical counterparty matching.

---

## 19. FAQ

### General

**What is GO Market?**
GO Market is a protocol that lets you combine prediction market positions from multiple venues into a single accumulator bet with multiplied odds. You stake once, and if every leg resolves in your favour, you receive a single multiplied payout.

**Is GO Market the same as a prediction market?**
No. GO Market does not create its own prediction markets. It aggregates existing markets from Polymarket, Kalshi, and Limitless, and lets you combine them into accumulators. The underlying markets and their resolution remain on their original venues.

**Is GO Market a synthetic product?**
No. GO Market executes real hedge positions on underlying venues for every leg of every acca. When you add a Polymarket market to your acca, the protocol opens a real Polymarket position. Your odds are grounded in real market prices.

**Who is the counterparty to my acca?**
The GO Liquidity Pool — a shared pool of USDC deposited by liquidity providers — is the counterparty. No single company or individual takes the other side. LP capital is the collective house.

### Accas & Betting

**Why do combined odds look lower than multiplying the legs manually?**
The overround. GO Market applies a systematic reduction to combined odds — ranging from 5% for 2-leg accas to 15% for 9-10 leg accas. This is GO Market's structural pricing edge, which accrues primarily to LPs as yield. It is the same mechanic as the house edge in a traditional sportsbook.

**What happens if one leg of my acca loses?**
The acca is immediately settled as lost. You do not receive a partial payout for winning legs. This is the fundamental mechanic of an accumulator — all legs must win.

**Can I cancel an acca after placing it?**
Only if no legs have been executed on underlying venues yet. Once hedge execution begins, cancellation is not available. In practice, execution begins within seconds of acca creation, so cancellation is only possible if there is an immediate execution failure.

**What if a market never resolves?**
If a leg does not resolve within 30 days of the market's scheduled resolution date, the leg enters DISPUTED state and the acca is escalated to the GO Market multisig for manual review. The outcome will be a correct resolution, or a full refund to the user.

**Is there a maximum I can win?**
Per-acca payouts are capped at 5% of the total pool TVL. At $500,000 pool TVL, the maximum payout per acca is $25,000. This cap scales with pool TVL.

### Liquidity Providing

**What yield can I earn as an LP?**
LP yield depends on protocol volume, the overround rate, and float yield. Higher volume means more overround capture. The overround ranges from 5% to 15% per acca resolved, accruing to the pool. Protocol fees (15%) are deducted. Float yield on idle capital adds incremental returns. Exact yield varies with market conditions.

**What is the risk of being an LP?**
LPs take variance risk. In any period, the pool may pay out more than it takes in from losing accas. Over sufficiently long time periods and volume, the overround ensures positive expected value. Short-term losses are possible. LPs should only provide capital they are comfortable with being illiquid for 7+ days.

**Why is there a 7-day withdrawal lock?**
The lock-up period prevents bank-run dynamics — where large LP withdrawals during a losing streak concentrate risk on remaining LPs and potentially render the pool unable to pay out winning accas. 7 days gives the pool time to rebalance and ensures all LPs bear risk fairly through the period they are invested.

**Are my LP funds safe if GO Market is hacked?**
GO Market undergoes independent security audits before mainnet deployment and operates with a TVL cap during its early phase. However, smart contract risk is never zero. LPs should treat GO Market LP positions as DeFi positions carrying smart contract risk, and size accordingly.

### Technical

**Which blockchain is GO Market on?**
GO Market's core contracts are deployed on Base. Hedge positions are executed on Polygon (Polymarket) and Solana (Kalshi via DFlow) via adaptor layers. Users interact only with Base.

**Do I need a Solana wallet to use GO Market?**
No. All user interactions are on Base. The DFlow/Kalshi integration is handled entirely by the protocol's infrastructure. Users never need to manage a Solana wallet.

**Are GO Market's smart contracts open source?**
Yes. All smart contracts will be published on GitHub and verified on Basescan before launch. Audit reports will be published publicly.

**How is GO Market different from Totalis?**
Totalis uses prediction markets purely as price feeds and settlement oracles — positions are synthetic and self-contained within Totalis. GO Market executes real positions on underlying venues. Additionally, GO Market uses an Azuro-style peer-to-pool model where anyone can be an LP — Totalis uses an RFQ model where professional market makers quote prices per acca. GO Market is always available for any acca without waiting for a market maker to respond.

---

_GO Market Protocol Documentation — v1.0_
_This documentation is maintained by the GO Market team. For corrections or suggestions, open an issue on the GO Market GitHub repository._
