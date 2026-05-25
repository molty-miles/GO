"use client";

import type { Address } from "./types";

const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "") as Address;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as Address;

const VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "userBalance",
    inputs: [{ type: "address", name: "user" }],
    outputs: [
      { type: "uint256", name: "total" },
      { type: "uint256", name: "locked" },
      { type: "uint256", name: "available" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformRevenue",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

function encodeFunctionCall(
  abi: readonly unknown[],
  fnName: string,
  args: (string | bigint)[],
): string {
  const fn = (abi as { name?: string; inputs?: { type: string }[] }[]).find(
    (f) => f.name === fnName,
  );
  if (!fn || !fn.inputs) throw new Error(`Function ${fnName} not found in ABI`);
  const signature = `${fnName}(${fn.inputs.map((i: { type: string }) => i.type).join(",")})`;
  const hash = keccak256(signature).slice(0, 10);
  return hash + args.map((a) => padHex(a.toString(16), 64)).join("");
}

function keccak256(input: string): string {
  let hash = "0x" + "0".repeat(64);
  for (let i = 0; i < input.length; i++) {
    hash += input.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hash.slice(0, 66);
}

function padHex(hex: string, bytes: number): string {
  return hex.padStart(bytes, "0").slice(0, bytes);
}

function getProvider() {
  const ethereum = (globalThis as Record<string, unknown>).ethereum as
    | { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
    | undefined;
  if (!ethereum) throw new Error("No wallet connected");
  return ethereum;
}

async function ethCall(to: string, data: string): Promise<string> {
  const provider = getProvider();
  return provider.request({
    method: "eth_call",
    params: [{ to, data }, "latest"],
  }) as Promise<string>;
}

async function ethSendTransaction(to: string, data: string): Promise<string> {
  const provider = getProvider();
  const accounts = await provider.request({
    method: "eth_requestAccounts",
  });
  return provider.request({
    method: "eth_sendTransaction",
    params: [{ from: (accounts as string[])[0], to, data }],
  }) as Promise<string>;
}

export async function getUSDCBalance(address: Address): Promise<number> {
  const data = encodeFunctionCall(USDC_ABI, "balanceOf", [address]);
  const result = await ethCall(USDC_ADDRESS, data);
  return Number(BigInt(result)) / 1_000_000;
}

export async function getVaultBalance(address: Address) {
  const data = encodeFunctionCall(VAULT_ABI, "userBalance", [address]);
  const result = await ethCall(VAULT_ADDRESS, data);
  const totalHex = "0x" + result.slice(2, 66);
  const lockedHex = "0x" + result.slice(66, 130);
  const availableHex = "0x" + result.slice(130, 194);
  return {
    total: Number(BigInt(totalHex)) / 1_000_000,
    locked: Number(BigInt(lockedHex)) / 1_000_000,
    available: Number(BigInt(availableHex)) / 1_000_000,
  };
}

export async function depositUSDC(amount: number): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 1_000_000));
  const approveData = encodeFunctionCall(USDC_ABI, "approve", [VAULT_ADDRESS, rawAmount]);
  await ethSendTransaction(USDC_ADDRESS, approveData);
  const depositData = encodeFunctionCall(VAULT_ABI, "deposit", [rawAmount]);
  return ethSendTransaction(VAULT_ADDRESS, depositData);
}

export async function withdrawUSDC(amount: number): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 1_000_000));
  const data = encodeFunctionCall(VAULT_ABI, "withdraw", [rawAmount]);
  return ethSendTransaction(VAULT_ADDRESS, data);
}

export { VAULT_ADDRESS, USDC_ADDRESS, VAULT_ABI, USDC_ABI };
