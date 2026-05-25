import { normalizePolymarket, PolymarketAdapter } from "@/lib/adaptors/polymarket";
import type { GammaEvent } from "@/types/adaptors/polymarket";

const mockEvent: GammaEvent = {
  id: "123",
  title: "Test Event",
  slug: "test-event",
  active: true,
  liquidity: 50000,
  volume: 100000,
  endDate: "2026-07-31T12:00:00Z",
  category: "Sports",
  markets: [
    {
      id: "456",
      question: "Will Team A win?",
      slug: "will-team-a-win",
      outcomes: '["Yes", "No"]',
      outcomePrices: '["0.65", "0.35"]',
      volume: "50000",
      liquidity: "25000",
      active: true,
      endDate: "2026-07-31T12:00:00Z",
    },
    {
      id: "457",
      question: "Will Team A win by 5+?",
      slug: "will-team-a-win-by-5",
      outcomes: '["Yes", "No"]',
      outcomePrices: '["0.3", "0.7"]',
      volume: "10000",
      liquidity: "5000",
      active: true,
      endDate: "2026-07-31T12:00:00Z",
    },
  ],
};

/* ---------- normalizePolymarket (pure function, fully tested) ---------- */

describe("normalizePolymarket", () => {
  it("normalizes multiple markets from a single event", () => {
    const result = normalizePolymarket(mockEvent);
    expect(result).toHaveLength(2);
  });

  it("maps fields correctly", () => {
    const result = normalizePolymarket(mockEvent);
    const first = result[0];
    expect(first.id).toBe("456");
    expect(first.venue).toBe("polymarket");
    expect(first.question).toBe("Will Team A win?");
    expect(first.slug).toBe("will-team-a-win");
    expect(first.c_yes).toBeCloseTo(0.65, 2);
    expect(first.volume).toBe(50000);
    expect(first.liquidity).toBe(25000);
    expect(first.active).toBe(true);
    expect(first.resolution_date).toBe("2026-07-31T12:00:00Z");
    expect(first.category).toEqual(["Sports"]);
  });

  it("parses outcomePrices as floats", () => {
    const result = normalizePolymarket(mockEvent);
    expect(typeof result[0].c_yes).toBe("number");
    expect(typeof result[1].c_yes).toBe("number");
  });

  it("constructs venue link using slug", () => {
    const result = normalizePolymarket(mockEvent);
    expect(result[0].link).toContain("polymarket.com");
    expect(result[0].link).toContain("test-event");
  });

  it("handles empty markets array", () => {
    const emptyEvent: GammaEvent = {
      ...mockEvent,
      markets: [],
    };
    const result = normalizePolymarket(emptyEvent);
    expect(result).toHaveLength(0);
  });

  it("handles missing optional fields gracefully", () => {
    const minimalEvent: GammaEvent = {
      id: "1",
      title: "Minimal",
      slug: "minimal",
      active: true,
      liquidity: 0,
      volume: 0,
      markets: [
        {
          id: "1",
          question: "Test?",
          slug: "test",
          outcomes: '["Yes","No"]',
          outcomePrices: '["0.5","0.5"]',
          volume: "0",
          liquidity: "0",
          active: true,
          endDate: "2026-01-01T00:00:00Z",
        },
      ],
    };
    const result = normalizePolymarket(minimalEvent);
    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual([]);
    expect(result[0].tags).toEqual([]);
  });
});

/* ---------- PolymarketAdapter (mocked HTTP) ---------- */

const mockFetchResponse = (body: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("PolymarketAdapter", () => {
  let adapter: PolymarketAdapter;
  let originalFetch: unknown;

  beforeAll(() => {
    originalFetch = (globalThis as Record<string, unknown>).fetch;
  });

  beforeEach(() => {
    adapter = new PolymarketAdapter();
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).fetch = originalFetch;
  });

  describe("listMarkets", () => {
    it("returns normalized markets from API", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse([mockEvent]));
      const result = await adapter.listMarkets();
      expect(result).toHaveLength(2);
      expect(result[0].venue).toBe("polymarket");
    });

    it("throws on non-ok response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ error: "Unauthorized" }, 401));
      await expect(adapter.listMarkets()).rejects.toThrow("Gamma API error: 401");
    });

    it("throws on malformed JSON response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      } as Response);
      await expect(adapter.listMarkets()).rejects.toThrow();
    });
  });

  describe("getMarketDetail", () => {
    it("returns a single market from event", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse(mockEvent));
      const result = await adapter.getMarketDetail("123");
      expect(result.id).toBe("456");
    });

    it("throws on non-ok response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ error: "Not Found" }, 404));
      await expect(adapter.getMarketDetail("999")).rejects.toThrow("Gamma API error: 404");
    });
  });

  describe("subscribePrices", () => {
    it("returns an unsubscribe function", () => {
      const unsubscribe = adapter.subscribePrices(["456"], jest.fn());
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });
});

/* ---------- Integration test (skipped without network) ---------- */

describe("Polymarket integration", () => {
  it.skip("fetches live events from Gamma API", async () => {
    const adapter = new PolymarketAdapter();
    const markets = await adapter.listMarkets();
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0].c_yes).toBeGreaterThanOrEqual(0);
  });
});
