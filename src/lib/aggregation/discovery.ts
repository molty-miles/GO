import type { UnifiedMarket } from "@/types/market";

export interface DiscoveryQuery {
  q?: string;
  venue?: string;
  category?: string;
  minVolume?: number;
  sort?: "volume" | "resolve" | "odds" | "trending";
}

function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const DEDUP_SIMILARITY_THRESHOLD = 0.7;

function isSimilar(a: string, b: string): boolean {
  const na = normalizeQuestion(a);
  const nb = normalizeQuestion(b);
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const intersection = wordsA.filter((w) => wordsB.includes(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union >= DEDUP_SIMILARITY_THRESHOLD;
}

export function deduplicateMarkets(markets: UnifiedMarket[]): UnifiedMarket[] {
  const groups: UnifiedMarket[][] = [];

  for (const market of markets) {
    let added = false;
    for (const group of groups) {
      if (isSimilar(market.question, group[0].question)) {
        group.push(market);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push([market]);
    }
  }

  return groups.map((group) => group.reduce((best, m) => (m.c_yes > best.c_yes ? m : best)));
}

export function filterMarkets(markets: UnifiedMarket[], query: DiscoveryQuery): UnifiedMarket[] {
  let result = markets;

  if (query.q) {
    result = searchMarkets(result, query.q);
  }

  if (query.venue) {
    result = result.filter((m) => m.venue.toLowerCase() === query.venue!.toLowerCase());
  }

  if (query.category) {
    result = result.filter((m) =>
      m.category.some((c) => c.toLowerCase() === query.category!.toLowerCase()),
    );
  }

  if (query.minVolume !== undefined) {
    result = result.filter((m) => m.volume >= query.minVolume!);
  }

  return result;
}

export function sortMarkets(
  markets: UnifiedMarket[],
  sort: NonNullable<DiscoveryQuery["sort"]>,
): UnifiedMarket[] {
  const sorted = [...markets];

  switch (sort) {
    case "volume":
      sorted.sort((a, b) => b.volume - a.volume);
      break;
    case "resolve":
      sorted.sort(
        (a, b) => new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime(),
      );
      break;
    case "odds":
      sorted.sort((a, b) => b.c_yes - a.c_yes);
      break;
    case "trending":
      sorted.sort((a, b) => b.volume - a.volume || b.liquidity - a.liquidity);
      break;
  }

  return sorted;
}

export function searchMarkets(markets: UnifiedMarket[], text: string): UnifiedMarket[] {
  const lower = text.toLowerCase();
  return markets.filter(
    (m) => m.question.toLowerCase().includes(lower) || m.slug.toLowerCase().includes(lower),
  );
}

export function deriveImpliedMultiplier(c_yes: number): number {
  return 1 / c_yes;
}

export function flagBestOdds(
  markets: UnifiedMarket[],
): (UnifiedMarket & { isBestOdds: boolean })[] {
  const bestByQuestion = new Map<string, UnifiedMarket>();

  for (const market of markets) {
    const key = normalizeQuestion(market.question);
    const existing = bestByQuestion.get(key);
    if (!existing || market.c_yes > existing.c_yes) {
      bestByQuestion.set(key, market);
    }
  }

  return markets.map((market) => ({
    ...market,
    isBestOdds: bestByQuestion.get(normalizeQuestion(market.question))?.id === market.id,
  }));
}
