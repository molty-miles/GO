import { parseAbi } from "viem";
import { publicClient, VAULT_ADDRESS, MANAGER_ADDRESS } from "./index";
import type { Address } from "viem";

export type HistoryItemType = "deposit" | "withdraw" | "acca_created" | "acca_settled";

export interface HistoryItem {
  type: HistoryItemType;
  amount: number;
  timestamp: string;
  status?: "WON" | "LOST" | "CANCELLED";
  accaId?: string;
}

const vaultEventAbi = parseAbi([
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
]);

const managerEventAbi = parseAbi([
  "event AccaCreated(bytes32 indexed accaId, address indexed user, uint256 stake, uint256 payout, uint8 legCount)",
  "event AccaSettled(bytes32 indexed accaId, uint8 status, uint256 payout)",
]);

export async function fetchUserHistory(address: Address): Promise<HistoryItem[]> {
  const items: HistoryItem[] = [];

  try {
    const [depositLogs, withdrawLogs] = await Promise.all([
      publicClient.getLogs({
        address: VAULT_ADDRESS,
        event: vaultEventAbi[0],
        args: { user: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: VAULT_ADDRESS,
        event: vaultEventAbi[1],
        args: { user: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
    ]);

    for (const log of depositLogs) {
      items.push({
        type: "deposit",
        amount: Number(log.args.amount) / 1_000_000,
        timestamp: new Date(Number(log.blockNumber) * 1000).toISOString(),
      });
    }

    for (const log of withdrawLogs) {
      items.push({
        type: "withdraw",
        amount: Number(log.args.amount) / 1_000_000,
        timestamp: new Date(Number(log.blockNumber) * 1000).toISOString(),
      });
    }
  } catch {
    /* vault events not available yet */
  }

  try {
    const [accaCreatedLogs, accaSettledLogs] = await Promise.all([
      publicClient.getLogs({
        address: MANAGER_ADDRESS,
        event: managerEventAbi[0],
        args: { user: address },
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address: MANAGER_ADDRESS,
        event: managerEventAbi[1],
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
    ]);

    for (const log of accaCreatedLogs) {
      const accaId = log.args.accaId;
      if (!accaId) continue;
      items.push({
        type: "acca_created",
        amount: Number(log.args.stake) / 1_000_000,
        timestamp: new Date(Number(log.blockNumber) * 1000).toISOString(),
        accaId,
      });
    }

    const settledMap = new Map<string, HistoryItem>();
    for (const log of accaSettledLogs) {
      const accaId = log.args.accaId;
      if (!accaId) continue;
      const status = Number(log.args.status);
      const statusLabel: "WON" | "LOST" | "CANCELLED" =
        status === 1 ? "WON" : status === 2 ? "LOST" : "CANCELLED";
      settledMap.set(accaId, {
        type: "acca_settled",
        amount: Number(log.args.payout) / 1_000_000,
        timestamp: new Date(Number(log.blockNumber) * 1000).toISOString(),
        status: statusLabel,
        accaId,
      });
    }

    for (const [, settled] of settledMap) {
      items.push(settled);
    }
  } catch {
    /* manager events not available yet */
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return items;
}
