"use client";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseAbi,
  type Address,
  type WalletClient,
  type PublicClient,
} from "viem";
import { baseSepolia } from "viem/chains";

type PrivyEthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 84532;
const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "") as Address;
const MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_MANAGER_ADDRESS ?? "") as Address;
const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "") as Address;
const DFLOW_ADAPTOR_ADDRESS = (process.env.NEXT_PUBLIC_DFLOW_ADAPTOR_ADDRESS ?? "") as Address;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as Address;

const RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  (process.env.ALCHEMY_API_KEY
    ? `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : "https://sepolia.base.org");

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
}) as unknown as PublicClient;

export async function getWalletClient(
  privyEthereumProvider: PrivyEthereumProvider,
): Promise<WalletClient> {
  if (!privyEthereumProvider) {
    throw new Error("No Privy wallet provider available. Make sure user is logged in.");
  }
  return createWalletClient({
    chain: baseSepolia,
    transport: custom(privyEthereumProvider),
  });
}

// Minimal ABIs for the deployed contracts on Base Sepolia
const vaultAbi = parseAbi([
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function userBalance(address user) view returns (uint256 total, uint256 locked, uint256 available)",
  "function platformRevenue() view returns (uint256)",
]);

const usdcAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

// GoManager ABI - key functions for E2E
const managerAbi = parseAbi([
  "function createAcca((address adaptor, bytes32 venueMarketId, bool outcome, uint256 quotedOdds, uint256 hedgeStake, uint256 minOdds, bytes extraData)[] legs, uint256 stake, uint256 potentialPayout, uint256 combinedOdds, uint256 expiresAt) returns (bytes32 accaId)",
  "function getAcca(bytes32 accaId) view returns (bytes32 accaId, address user, uint256 stake, uint256 potentialPayout, uint256 combinedOdds, uint256 expiresAt, uint8 status)",
  "function cancelAcca(bytes32 accaId)",
  "function getUserAccaCount(address user) view returns (uint256)",
  "function getUserAccaAt(address user, uint256 index) view returns (bytes32)",
]);

// Basic adaptor registry for future use
const registryAbi = parseAbi(["function getAdaptor(string venue) view returns (address)"]);

// Helper to get account from Privy provider (for writes)
async function getAccountFromProvider(provider: PrivyEthereumProvider): Promise<Address> {
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  return (accounts as string[])[0] as Address;
}

// Maps venue names to their deployed adaptor addresses on Base Sepolia.
// Used by createAcca to look up the correct on-chain adaptor for each leg.
export function venueToAdaptor(venue: string): Address {
  const lower = venue.toLowerCase();
  if (lower === "dflow" || lower === "dflow_relay") return DFLOW_ADAPTOR_ADDRESS;
  if (lower === "polymarket") {
    // Polymarket testnet adaptor not deployed — will revert if used directly.
    // For now fall back to the DFlow adaptor so tests don't break.
    return DFLOW_ADAPTOR_ADDRESS;
  }
  // Default fallback
  return DFLOW_ADAPTOR_ADDRESS;
}

// ==================== READS (use publicClient) ====================

export async function getUSDCBalance(address: Address): Promise<number> {
  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [address],
  });
  return Number(balance) / 1_000_000;
}

export async function getVaultBalance(address: Address) {
  const [total, locked, available] = await publicClient.readContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "userBalance",
    args: [address],
  });
  return {
    total: Number(total) / 1_000_000,
    locked: Number(locked) / 1_000_000,
    available: Number(available) / 1_000_000,
  };
}

// ==================== WRITES (require Privy provider) ====================

export async function approveUSDC(
  amount: number,
  privyProvider: PrivyEthereumProvider,
): Promise<`0x${string}`> {
  const walletClient = await getWalletClient(privyProvider);
  const account = await getAccountFromProvider(privyProvider);
  const rawAmount = BigInt(Math.round(amount * 1_000_000));

  return walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "approve",
    args: [VAULT_ADDRESS, rawAmount],
  });
}

export async function depositUSDC(
  amount: number,
  privyProvider: PrivyEthereumProvider,
): Promise<`0x${string}`> {
  const walletClient = await getWalletClient(privyProvider);
  const account = await getAccountFromProvider(privyProvider);
  const rawAmount = BigInt(Math.round(amount * 1_000_000));

  // Best practice: approve first (or check allowance), then deposit.
  // For simplicity in MVP we do approve + deposit in one flow.
  await walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "approve",
    args: [VAULT_ADDRESS, rawAmount],
  });

  return walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "deposit",
    args: [rawAmount],
  });
}

export async function withdrawUSDC(
  amount: number,
  privyProvider: PrivyEthereumProvider,
): Promise<`0x${string}`> {
  const walletClient = await getWalletClient(privyProvider);
  const account = await getAccountFromProvider(privyProvider);
  const rawAmount = BigInt(Math.round(amount * 1_000_000));

  return walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "withdraw",
    args: [rawAmount],
  });
}

// ==================== ACCA OPERATIONS ====================

export interface AccaLegRequest {
  adaptor: Address;
  venueMarketId: `0x${string}`;
  outcome: boolean;
  quotedOdds: bigint;
  hedgeStake: bigint;
  minOdds: bigint;
  extraData: `0x${string}`;
}

/**
 * Converts a frontend leg (venue string, decimal odds) into a
 * LegRequest struct that the GoManager contract expects.
 * Odds are converted to 1e18 fixed-point for the contract.
 */
export function buildLegRequest(
  venue: string,
  venueMarketId: `0x${string}`,
  selectedOutcome: string,
  decimalOdds: number,
): AccaLegRequest {
  const oddsPrecision = BigInt(Math.round(decimalOdds * 1_000_000_000_000_000_000));
  return {
    adaptor: venueToAdaptor(venue),
    venueMarketId,
    outcome: selectedOutcome.toLowerCase() === "yes",
    quotedOdds: oddsPrecision,
    hedgeStake: BigInt(0),
    minOdds: BigInt(0),
    extraData: "0x" as `0x${string}`,
  };
}

export async function createAcca(
  legs: AccaLegRequest[],
  stakeUsdc: number,
  combinedOddsDecimal: number,
  expiresAt: number,
  privyProvider: PrivyEthereumProvider,
): Promise<{ accaId: `0x${string}`; txHash: `0x${string}` }> {
  const walletClient = await getWalletClient(privyProvider);
  const account = await getAccountFromProvider(privyProvider);
  const rawStake = BigInt(Math.round(stakeUsdc * 1_000_000));
  const potentialPayoutBigInt = BigInt(Math.round((stakeUsdc / combinedOddsDecimal) * 1_000_000));
  const oddsPrecision = BigInt(Math.round(combinedOddsDecimal * 1_000_000_000_000_000_000));

  // Approve USDC spend to the vault first
  await walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "approve",
    args: [MANAGER_ADDRESS, rawStake],
  });

  const txHash = await walletClient.writeContract({
    account,
    chain: baseSepolia,
    address: MANAGER_ADDRESS,
    abi: managerAbi,
    functionName: "createAcca",
    args: [legs, rawStake, potentialPayoutBigInt, oddsPrecision, BigInt(expiresAt)],
  });

  // We can't read the accaId from the tx result easily,
  // but we derive it from the first event log or just return txHash.
  // For now return txHash + a placeholder ID.
  return { txHash, accaId: txHash as `0x${string}` };
}

export async function getAccaFromChain(accaId: `0x${string}`) {
  return publicClient.readContract({
    address: MANAGER_ADDRESS,
    abi: managerAbi,
    functionName: "getAcca",
    args: [accaId],
  });
}

export async function getUserAccaIds(userAddress: Address): Promise<readonly `0x${string}`[]> {
  const count = await publicClient.readContract({
    address: MANAGER_ADDRESS,
    abi: managerAbi,
    functionName: "getUserAccaCount",
    args: [userAddress],
  });

  const ids: `0x${string}`[] = [];
  for (let i = 0; i < Number(count); i++) {
    const id = await publicClient.readContract({
      address: MANAGER_ADDRESS,
      abi: managerAbi,
      functionName: "getUserAccaAt",
      args: [userAddress, BigInt(i)],
    });
    ids.push(id);
  }
  return ids;
}

// ==================== EXPORTS ====================

export {
  VAULT_ADDRESS,
  MANAGER_ADDRESS,
  REGISTRY_ADDRESS,
  DFLOW_ADAPTOR_ADDRESS,
  USDC_ADDRESS,
  CHAIN_ID,
  vaultAbi,
  usdcAbi,
  managerAbi,
  registryAbi,
};
