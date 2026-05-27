import type { UnifiedMarket } from "@/types/market";
import type { DflowMarket } from "@/types/adaptors/dflow";
import { DflowMarketsResponseSchema } from "@/types/adaptors/dflow";
import type { VenueDataAdapter } from "@/types/venue";

const METADATA_BASE = "https://dev-prediction-markets-api.dflow.net";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CASH_MINT = "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH";

const TICKER_CATEGORY_MAP: Record<string, string[]> = {
  PRES: ["Politics", "Elections"],
  KXELECTIONS: ["Politics", "Elections"],
  KXFED: ["Economics", "Interest Rates"],
  KXECON: ["Economics"],
  KXSB: ["Sports", "Football"],
  KXPGATOUR: ["Sports", "Golf"],
  KXNBA: ["Sports", "Basketball"],
  KXMLB: ["Sports", "Baseball"],
  KXNFL: ["Sports", "Football"],
  KXUFC: ["Sports", "MMA"],
  KXCRYPTO: ["Crypto"],
  KXBTC: ["Crypto", "BTC"],
  KXETH: ["Crypto", "ETH"],
  KXCLIMATE: ["Climate and Weather"],
  KXENT: ["Entertainment"],
  KXAI: ["Science and Technology", "AI"],
  KXSPACE: ["Science and Technology", "Space"],
  KXHLTH: ["Science and Technology", "Public Health"],
  KXCOMM: ["Commodities"],
  KXCOMP: ["Financials", "Companies"],
  KXIPO: ["Financials", "IPOs"],
};

function inferCategory(ticker: string): string[] {
  for (const [prefix, category] of Object.entries(TICKER_CATEGORY_MAP)) {
    if (ticker.startsWith(prefix)) return category;
  }
  return ["Other"];
}

function getScalarPrice(market: DflowMarket): number | null {
  const usdcEntry = market.accounts[USDC_MINT];
  if (usdcEntry?.isInitialized && usdcEntry.scalarOutcomePct != null) {
    return usdcEntry.scalarOutcomePct / 10000;
  }
  const cashEntry = market.accounts[CASH_MINT];
  if (cashEntry?.isInitialized && cashEntry.scalarOutcomePct != null) {
    return cashEntry.scalarOutcomePct / 10000;
  }
  return null;
}

function hasInitializedToken(market: DflowMarket): boolean {
  return Object.values(market.accounts).some((acc) => acc.isInitialized);
}

function toIso(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString();
}

export function normalizeDflow(market: DflowMarket): UnifiedMarket | null {
  if (!hasInitializedToken(market)) return null;

  const c_yes = getScalarPrice(market);

  return {
    id: market.ticker,
    venue: "kalshi",
    slug: market.ticker.toLowerCase(),
    question: market.title,
    category: inferCategory(market.ticker),
    tags: [],
    c_yes: c_yes ?? 0.5,
    volume: market.volume,
    liquidity: market.openInterest,
    resolution_date: toIso(market.expirationTime),
    active: market.status === "active" || market.status === "open",
    end_time: toIso(market.closeTime),
    link: `https://kalshi.com/markets/${market.ticker.toLowerCase()}`,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.DFLOW_API_KEY;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

export class DflowAdapter implements VenueDataAdapter {
  venueId = "kalshi" as const;
  requiresRelayer = true;

  async listMarkets(): Promise<UnifiedMarket[]> {
    const url = `${METADATA_BASE}/api/v1/markets?isInitialized=true&limit=200`;
    const response = await fetchWithTimeout(url, { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error(`DFlow Metadata API error: ${response.status}`);
    }
    const raw: unknown = await response.json();
    const parsed = DflowMarketsResponseSchema.parse(raw);
    const result: UnifiedMarket[] = [];
    for (const market of parsed.markets) {
      if (market.status !== "active" && market.status !== "open") continue;
      const normalized = normalizeDflow(market);
      if (normalized) result.push(normalized);
    }
    return result;
  }

  async getMarketDetail(ticker: string): Promise<UnifiedMarket> {
    const url = `${METADATA_BASE}/api/v1/markets?limit=1`;
    const response = await fetchWithTimeout(url, { headers: buildHeaders() });
    if (!response.ok) {
      throw new Error(`DFlow Metadata API error: ${response.status}`);
    }
    const raw: unknown = await response.json();
    const parsed = DflowMarketsResponseSchema.parse(raw);
    const found = parsed.markets.find((m) => m.ticker === ticker);
    if (!found) throw new Error(`Market ${ticker} not found`);
    const normalized = normalizeDflow(found);
    if (!normalized) throw new Error(`Market ${ticker} has no initialized tokens`);
    return normalized;
  }

  subscribePrices(_ids: string[], callback: (prices: Record<string, number>) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const url = `${METADATA_BASE}/api/v1/markets?isInitialized=true&limit=200`;
        const response = await fetchWithTimeout(url, { headers: buildHeaders() });
        if (!response.ok) return;
        const raw: unknown = await response.json();
        const parsed = DflowMarketsResponseSchema.parse(raw);
        const prices: Record<string, number> = {};
        for (const market of parsed.markets) {
          const price = getScalarPrice(market);
          if (price != null) prices[market.ticker] = price;
        }
        callback(prices);
      } catch {
        /* swallow polling errors */
      }
    }, 15_000);

    return () => clearInterval(interval);
  }
}
