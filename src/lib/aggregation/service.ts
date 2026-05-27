import { PolymarketAdapter } from "@/lib/adaptors/polymarket";
import { DflowAdapter } from "@/lib/adaptors/dflow";
import { setCachedMarkets, getCachedMarkets } from "@/lib/aggregation/cache";
import { validateEnv } from "@/lib/env";
import type { UnifiedMarket } from "@/types/market";

validateEnv();

const adapters = [new PolymarketAdapter(), new DflowAdapter()];

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export async function refreshAllVenues(): Promise<UnifiedMarket[]> {
  const results = await Promise.allSettled(adapters.map((a) => a.listMarkets()));

  const all: UnifiedMarket[] = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const adapter = adapters[i];
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(`[${adapter.venueId}] ${reason}`);
      console.error(`Adaptor ${adapter.venueId} failed:`, result.reason);
    }
  }

  if (all.length === 0 && errors.length > 0) {
    const stale = getCachedMarkets("all");
    if (stale && stale.length > 0) {
      console.warn("All adaptors failed, serving stale cache:", errors.join("; "));
      return stale;
    }
    throw new Error(`All adaptors failed: ${errors.join("; ")}`);
  }

  if (errors.length > 0) {
    console.warn("Some adaptors failed:", errors.join("; "));
  }

  setCachedMarkets("all", all);
  return all;
}

export function startPolling(intervalMs = 30_000): void {
  if (pollingInterval) return;
  refreshAllVenues().catch((err) => console.error("Initial poll failed:", err));
  pollingInterval = setInterval(() => {
    refreshAllVenues().catch((err) => console.error("Poll refresh failed:", err));
  }, intervalMs);
}

export function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
