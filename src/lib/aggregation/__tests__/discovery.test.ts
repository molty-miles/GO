import {
  deduplicateMarkets,
  filterMarkets,
  sortMarkets,
  searchMarkets,
  deriveImpliedMultiplier,
  flagBestOdds,
} from "@/lib/aggregation/discovery";
import type { UnifiedMarket } from "@/types/market";

const baseMarket = (overrides: Partial<UnifiedMarket>): UnifiedMarket => ({
  id: "1",
  venue: "polymarket",
  slug: "test",
  question: "Test market?",
  category: ["Politics"],
  tags: [],
  c_yes: 0.5,
  volume: 1000,
  liquidity: 500,
  resolution_date: "2026-06-01T00:00:00Z",
  active: true,
  end_time: "2026-06-01T00:00:00Z",
  link: "https://polymarket.com/event/test",
  ...overrides,
});

const m1 = baseMarket({
  id: "1",
  venue: "polymarket",
  question: "Who will win the election?",
  c_yes: 0.6,
  volume: 50000,
  resolution_date: "2026-06-15T00:00:00Z",
});
const m2 = baseMarket({
  id: "2",
  venue: "kalshi",
  question: "Who will win the election?",
  c_yes: 0.58,
  volume: 30000,
  resolution_date: "2026-06-15T00:00:00Z",
});
const m3 = baseMarket({
  id: "3",
  venue: "polymarket",
  question: "Will GDP grow?",
  c_yes: 0.7,
  volume: 10000,
  resolution_date: "2026-05-01T00:00:00Z",
});
const m4 = baseMarket({
  id: "4",
  venue: "limitless",
  question: "Bitcoin above 100k?",
  c_yes: 0.45,
  volume: 80000,
  resolution_date: "2026-07-01T00:00:00Z",
});

describe("deduplicateMarkets", () => {
  it("deduplicates near-identical questions across venues", () => {
    const result = deduplicateMarkets([m1, m2]);
    expect(result).toHaveLength(1);
  });

  it("keeps distinct questions separate", () => {
    const result = deduplicateMarkets([m1, m3, m4]);
    expect(result).toHaveLength(3);
  });

  it("keeps the entry with highest c_yes when deduplicating", () => {
    const result = deduplicateMarkets([m1, m2]);
    expect(result[0].c_yes).toBeCloseTo(0.6, 2);
    expect(result[0].venue).toBe("polymarket");
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateMarkets([])).toEqual([]);
  });
});

describe("filterMarkets", () => {
  it("filters by venue", () => {
    const result = filterMarkets([m1, m2, m3, m4], { venue: "polymarket" });
    expect(result).toHaveLength(2);
  });

  it("filters by category", () => {
    const custom = baseMarket({ id: "5", category: ["Sports"], question: "Sports?" });
    const result = filterMarkets([m1, custom], { category: "Sports" });
    expect(result).toHaveLength(1);
  });

  it("filters by minVolume", () => {
    const result = filterMarkets([m1, m3], { minVolume: 20000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("applies all filters together", () => {
    const result = filterMarkets([m1, m2, m3, m4], {
      venue: "polymarket",
      category: "Politics",
      minVolume: 20000,
    });
    expect(result).toHaveLength(1);
  });
});

describe("sortMarkets", () => {
  it("sorts by volume descending", () => {
    const result = sortMarkets([m3, m4, m1], "volume");
    expect(result[0].id).toBe("4");
    expect(result[2].id).toBe("3");
  });

  it("sorts by resolve date ascending", () => {
    const result = sortMarkets([m1, m3, m4], "resolve");
    expect(result[0].id).toBe("3");
  });

  it("sorts by liquidity descending", () => {
    const result = sortMarkets([m3, m4, m1], "liquidity");
    expect(result[0].id).toBe("4");
    expect(result[2].id).toBe("3");
  });
});

describe("searchMarkets", () => {
  it("finds matching text in question", () => {
    const result = searchMarkets([m1, m2, m3, m4], "election");
    expect(result).toHaveLength(2);
  });

  it("is case-insensitive", () => {
    const result = searchMarkets([m1], "ELECTION");
    expect(result).toHaveLength(1);
  });

  it("returns empty for no match", () => {
    const result = searchMarkets([m1], "zzzzz");
    expect(result).toHaveLength(0);
  });
});

describe("deriveImpliedMultiplier", () => {
  it("returns 1 / c_yes", () => {
    expect(deriveImpliedMultiplier(0.5)).toBeCloseTo(2.0, 2);
  });

  it("returns ~1.54 for 0.65", () => {
    expect(deriveImpliedMultiplier(0.65)).toBeCloseTo(1.54, 2);
  });

  it("returns 10 for 0.1", () => {
    expect(deriveImpliedMultiplier(0.1)).toBeCloseTo(10.0, 2);
  });
});

describe("flagBestOdds", () => {
  it("flags the market with highest c_yes among duplicates", () => {
    const result = flagBestOdds([m1, m2]);
    expect(result.find((m) => m.isBestOdds)!.id).toBe("1");
  });
});
