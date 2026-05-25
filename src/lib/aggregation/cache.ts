import type { UnifiedMarket } from "@/types/market";

interface CacheEntry {
  markets: UnifiedMarket[];
  timestamp: number;
}

const store = new Map<string, CacheEntry>();

const METADATA_TTL = 60_000;

export function setCachedMarkets(key: string, markets: UnifiedMarket[]): void {
  store.set(key, { markets, timestamp: Date.now() });
}

export function getCachedMarkets(key: string): UnifiedMarket[] | null {
  const entry = store.get(key);
  if (!entry) return null;
  return entry.markets;
}

export function getCachedMarketsWithTTL(
  key: string,
  ttl: number = METADATA_TTL,
): UnifiedMarket[] | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    store.delete(key);
    return null;
  }
  return entry.markets;
}

export function getAllCached(): UnifiedMarket[] {
  const all: UnifiedMarket[] = [];
  for (const entry of store.values()) {
    all.push(...entry.markets);
  }
  return all;
}

export function invalidateCache(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
