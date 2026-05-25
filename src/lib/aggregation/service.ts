import { PolymarketAdapter } from "@/lib/adaptors/polymarket";
import { setCachedMarkets } from "@/lib/aggregation/cache";
import type { UnifiedMarket } from "@/types/market";

const adapters = [new PolymarketAdapter()];

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export async function refreshAllVenues(): Promise<UnifiedMarket[]> {
  const results = await Promise.allSettled(adapters.map((a) => a.listMarkets()));

  const all: UnifiedMarket[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  setCachedMarkets("all", all);
  return all;
}

export function startPolling(intervalMs = 30_000): void {
  if (pollingInterval) return;
  refreshAllVenues();
  pollingInterval = setInterval(refreshAllVenues, intervalMs);
}

export function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
