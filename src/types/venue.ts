import type { UnifiedMarket } from "@/types/market";

export type VenueId = "polymarket" | "kalshi" | "limitless";

export interface VenueDataAdapter {
  venueId: VenueId;
  requiresRelayer: boolean;
  listMarkets(): Promise<UnifiedMarket[]>;
  getMarketDetail(id: string): Promise<UnifiedMarket>;
  subscribePrices(ids: string[], callback: (prices: Record<string, number>) => void): () => void;
}
