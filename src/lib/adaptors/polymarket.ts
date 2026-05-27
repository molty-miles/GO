import type { UnifiedMarket } from "@/types/market";
import type { GammaEvent } from "@/types/adaptors/polymarket";
import { GammaEventsResponseSchema } from "@/types/adaptors/polymarket";
import type { VenueDataAdapter } from "@/types/venue";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_WS = "wss://ws-subscriptions-clob.polymarket.com/ws/live";

export function normalizePolymarket(event: GammaEvent): UnifiedMarket[] {
  const category = event.category ? [event.category] : [];
  const tags = event.tags?.map((t) => t.label) ?? [];

  return event.markets.map((market) => {
    const outcomePrices: string[] = JSON.parse(market.outcomePrices);
    const c_yes = parseFloat(outcomePrices[0]);

    return {
      id: market.id,
      venue: "polymarket" as const,
      slug: market.slug,
      question: market.question,
      category,
      tags,
      c_yes,
      volume: parseFloat(market.volume),
      liquidity: parseFloat(market.liquidity),
      resolution_date: market.endDate,
      active: market.active,
      end_time: market.endDate,
      link: `https://polymarket.com/event/${event.slug}`,
    };
  });
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

export class PolymarketAdapter implements VenueDataAdapter {
  venueId = "polymarket" as const;
  requiresRelayer = true;

  async listMarkets(): Promise<UnifiedMarket[]> {
    const response = await fetchWithTimeout(
      `${GAMMA_BASE}/events?limit=200&active=true&closed=false`,
    );
    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }
    const raw: unknown = await response.json();
    const events = GammaEventsResponseSchema.parse(raw);
    return events.flatMap(normalizePolymarket);
  }

  async getMarketDetail(id: string): Promise<UnifiedMarket> {
    const response = await fetchWithTimeout(`${GAMMA_BASE}/events/${id}`);
    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }
    const raw: unknown = await response.json();
    const event = GammaEventsResponseSchema.parse([raw]);
    const markets = normalizePolymarket(event[0]);
    if (markets.length === 0) {
      throw new Error(`No markets found for event ${id}`);
    }
    return markets[0];
  }

  subscribePrices(ids: string[], callback: (prices: Record<string, number>) => void): () => void {
    let ws: WebSocket | null = new WebSocket(CLOB_WS);

    ws.onopen = () => {
      ws?.send(
        JSON.stringify({
          type: "subscribe",
          channel: "price",
          assets: ids,
        }),
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.prices) {
          callback(data.prices);
        }
      } catch {
        /* skip malformed messages */
      }
    };

    ws.onerror = (event) => {
      console.error("[polymarket] WebSocket error:", event);
    };

    return () => {
      ws?.close();
      ws = null;
    };
  }
}
