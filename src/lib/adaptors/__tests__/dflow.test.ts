import { normalizeDflow, DflowAdapter } from "@/lib/adaptors/dflow";
import type { DflowMarket } from "@/types/adaptors/dflow";

const mockMarket: DflowMarket = {
  ticker: "KXSB-26-NE",
  eventTicker: "KXSB-26",
  marketType: "binary",
  title: "Will the New England win the 2026 Pro Football Championship?",
  subtitle: "",
  yesSubTitle: "New England",
  noSubTitle: "New England",
  openTime: 1739372400,
  closeTime: 1770607472,
  expirationTime: 1833634800,
  status: "active",
  volume: 158189302,
  openInterest: 116702006,
  fractionalTradingEnabled: false,
  result: null,
  accounts: {
    CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: {
      marketLedger: "AAzsPRQMWtPek2JrKUqgTmzdjwWZ1mUf51mFFU77XVMf",
      yesMint: "eCvcRyx2KeTVFV1EJrsq7CeAriRhM44obYbM1g76SmD",
      noMint: "9pTmuHMeurV36NkJuWT7se4rRWN2umxoHANSo7cTb9eP",
      isInitialized: true,
      redemptionStatus: "open",
      scalarOutcomePct: 6500,
    },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
      marketLedger: "B6rdzcRSX1nviZgtefg8nhsiL1C2auFAkgcUUUgPYFcE",
      yesMint: "9miwbhsTeybk67CVoNc986TswvWRKE6hhzwPLGoCASRe",
      noMint: "D9k58UM9BMSYrHbX5aCNw2zQaLxTqabdkbNQAx69hfUi",
      isInitialized: true,
      redemptionStatus: "open",
      scalarOutcomePct: 6500,
    },
  },
};

/* ---------- normalizeDflow (pure function, fully tested) ---------- */

describe("normalizeDflow", () => {
  it("normalizes a binary market correctly", () => {
    const result = normalizeDflow(mockMarket);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("KXSB-26-NE");
    expect(result!.venue).toBe("kalshi");
    expect(result!.question).toBe("Will the New England win the 2026 Pro Football Championship?");
    expect(result!.slug).toBe("kxsb-26-ne");
    expect(result!.c_yes).toBeCloseTo(0.65, 2);
    expect(result!.volume).toBe(158189302);
    expect(result!.liquidity).toBe(116702006);
    expect(result!.active).toBe(true);
  });

  it("infers Sports category from KXSB prefix", () => {
    const result = normalizeDflow(mockMarket);
    expect(result!.category).toEqual(expect.arrayContaining(["Sports"]));
  });

  it("infers Politics category from PRES prefix", () => {
    const presMarket: DflowMarket = {
      ...mockMarket,
      ticker: "PRES-2024-DJT",
      title: "Will Trump win?",
    };
    const result = normalizeDflow(presMarket);
    expect(result!.category).toEqual(expect.arrayContaining(["Politics"]));
  });

  it("constructs kalshi.com link", () => {
    const result = normalizeDflow(mockMarket);
    expect(result!.link).toContain("kalshi.com");
    expect(result!.link).toContain("kxsb-26-ne");
  });

  it("converts unix timestamps to ISO strings", () => {
    const result = normalizeDflow(mockMarket);
    expect(result!.resolution_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result!.end_time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns null for markets with no initialized tokens", () => {
    const uninitMarket: DflowMarket = {
      ...mockMarket,
      accounts: {
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
          marketLedger: "B6rdzcRSX1nviZgtefg8nhsiL1C2auFAkgcUUUgPYFcE",
          yesMint: "9miwbhsTeybk67CVoNc986TswvWRKE6hhzwPLGoCASRe",
          noMint: "D9k58UM9BMSYrHbX5aCNw2zQaLxTqabdkbNQAx69hfUi",
          isInitialized: false,
          scalarOutcomePct: null,
        },
      },
    };
    expect(normalizeDflow(uninitMarket)).toBeNull();
  });

  it("falls back to CASH mint price if USDC mint is not initialized", () => {
    const cashOnly: DflowMarket = {
      ...mockMarket,
      accounts: {
        CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH: {
          marketLedger: "AAzsPRQMWtPek2JrKUqgTmzdjwWZ1mUf51mFFU77XVMf",
          yesMint: "eCvcRyx2KeTVFV1EJrsq7CeAriRhM44obYbM1g76SmD",
          noMint: "9pTmuHMeurV36NkJuWT7se4rRWN2umxoHANSo7cTb9eP",
          isInitialized: true,
          scalarOutcomePct: 4200,
        },
      },
    };
    const result = normalizeDflow(cashOnly);
    expect(result).not.toBeNull();
    expect(result!.c_yes).toBeCloseTo(0.42, 2);
  });

  it("handles null scalarOutcomePct gracefully", () => {
    const nullPrice: DflowMarket = {
      ...mockMarket,
      accounts: {
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
          marketLedger: "B6rdzcRSX1nviZgtefg8nhsiL1C2auFAkgcUUUgPYFcE",
          yesMint: "9miwbhsTeybk67CVoNc986TswvWRKE6hhzwPLGoCASRe",
          noMint: "D9k58UM9BMSYrHbX5aCNw2zQaLxTqabdkbNQAx69hfUi",
          isInitialized: true,
          scalarOutcomePct: null,
        },
      },
    };
    const result = normalizeDflow(nullPrice);
    expect(result).not.toBeNull();
    expect(result!.c_yes).toBe(0.5);
  });

  it("assigns Other category for unknown ticker prefix", () => {
    const unknown: DflowMarket = {
      ...mockMarket,
      ticker: "XYZ-123",
    };
    const result = normalizeDflow(unknown);
    expect(result!.category).toEqual(["Other"]);
  });
});

/* ---------- DflowAdapter (mocked HTTP) ---------- */

const mockFetchResponse = (body: unknown, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("DflowAdapter", () => {
  let adapter: DflowAdapter;
  let originalFetch: unknown;

  beforeAll(() => {
    originalFetch = (globalThis as Record<string, unknown>).fetch;
  });

  beforeEach(() => {
    adapter = new DflowAdapter();
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).fetch = originalFetch;
  });

  describe("listMarkets", () => {
    it("returns normalized markets from API", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ markets: [mockMarket], cursor: 0 }));
      const result = await adapter.listMarkets();
      expect(result).toHaveLength(1);
      expect(result[0].venue).toBe("kalshi");
      expect(result[0].id).toBe("KXSB-26-NE");
    });

    it("filters out non-active markets", async () => {
      const finalizedMarket: DflowMarket = {
        ...mockMarket,
        status: "finalized",
      };
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ markets: [finalizedMarket], cursor: 0 }));
      const result = await adapter.listMarkets();
      expect(result).toHaveLength(0);
    });

    it("throws on non-ok response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ error: "Unauthorized" }, 401));
      await expect(adapter.listMarkets()).rejects.toThrow("DFlow Metadata API error: 401");
    });

    it("throws on malformed JSON response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      } as Response);
      await expect(adapter.listMarkets()).rejects.toThrow();
    });

    it("filters out markets without initialized tokens", async () => {
      const uninit: DflowMarket = {
        ...mockMarket,
        accounts: {
          EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
            marketLedger: "B6rdzcRSX1nviZgtefg8nhsiL1C2auFAkgcUUUgPYFcE",
            yesMint: "9miwbhsTeybk67CVoNc986TswvWRKE6hhzwPLGoCASRe",
            noMint: "D9k58UM9BMSYrHbX5aCNw2zQaLxTqabdkbNQAx69hfUi",
            isInitialized: false,
            scalarOutcomePct: null,
          },
        },
      };
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ markets: [uninit], cursor: 0 }));
      const result = await adapter.listMarkets();
      expect(result).toHaveLength(0);
    });
  });

  describe("getMarketDetail", () => {
    it("returns a single market by ticker", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ markets: [mockMarket], cursor: 0 }));
      const result = await adapter.getMarketDetail("KXSB-26-NE");
      expect(result.id).toBe("KXSB-26-NE");
    });

    it("throws when ticker not found", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ markets: [], cursor: 0 }));
      await expect(adapter.getMarketDetail("NONEXISTENT")).rejects.toThrow(
        "Market NONEXISTENT not found",
      );
    });

    it("throws on non-ok response", async () => {
      (globalThis as Record<string, unknown>).fetch = jest
        .fn()
        .mockResolvedValue(mockFetchResponse({ error: "Not Found" }, 404));
      await expect(adapter.getMarketDetail("KXSB-26-NE")).rejects.toThrow(
        "DFlow Metadata API error: 404",
      );
    });
  });

  describe("subscribePrices", () => {
    it("returns an unsubscribe function", () => {
      const unsubscribe = adapter.subscribePrices(["KXSB-26-NE"], jest.fn());
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });
});

/* ---------- Integration test (skipped without network) ---------- */

describe("DFlow integration", () => {
  it.skip("fetches live markets from DFlow Metadata API", async () => {
    const adapter = new DflowAdapter();
    const markets = await adapter.listMarkets();
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0].venue).toBe("kalshi");
  });
});
