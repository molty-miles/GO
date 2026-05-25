import { VAULT_ADDRESS } from "@/lib/contract";
import { getPublicClient } from "./client";
import type { AccaPosition } from "@/hooks/useAccas";

export type SettlementEvent = {
  accaId: string;
  type: "LEG_RESOLVED" | "ACCA_SETTLED" | "ACCA_CANCELLED";
  legIndex?: number;
  won?: boolean;
  payout?: number;
  timestamp: string;
};

export type SettlementListener = (event: SettlementEvent) => void;

const listeners = new Set<SettlementListener>();

export function onSettlementEvent(cb: SettlementListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(event: SettlementEvent) {
  listeners.forEach((cb) => cb(event));
}

export function handleSettlementEvent(event: SettlementEvent) {
  notify(event);
}

export async function pollSettlements(accas: AccaPosition[]): Promise<SettlementEvent[]> {
  const events: SettlementEvent[] = [];

  for (const acca of accas) {
    if (acca.status !== "OPEN") continue;

    try {
      const client = getPublicClient();
      await client.getLogs({
        address: VAULT_ADDRESS,
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      for (const leg of acca.legs) {
        if (leg.state !== "PENDING") continue;

        const resolved = checkLegResolution(leg.marketId);
        if (resolved) {
          events.push({
            accaId: acca.id,
            type: "LEG_RESOLVED",
            legIndex: acca.legs.indexOf(leg),
            won: resolved.won,
            payout: resolved.payout,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch {
      // silent — polling will retry
    }
  }

  events.forEach(handleSettlementEvent);
  return events;
}

function checkLegResolution(_marketId: string): { won: boolean; payout: number } | null {
  return null;
}

export function createSettlementStore() {
  let events: SettlementEvent[] = [];

  return {
    getEvents: () => events,
    addEvent: (e: SettlementEvent) => {
      events = [...events, e];
    },
    clear: () => {
      events = [];
    },
  };
}

export const settlementStore = createSettlementStore();
