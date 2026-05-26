import { computeSlipOdds, computeProjectedPayout, validateSlip } from "@/hooks/useAccaBuilder";
import type { AccaLegInput } from "@/hooks/useAccaBuilder";

const leg1: AccaLegInput = {
  marketId: "1",
  question: "Will BTC > 100k?",
  venue: "polymarket",
  slug: "will-btc-100k",
  odds: 0.6,
  selectedOutcome: "Yes",
  link: "https://polymarket.com/event/will-btc-100k",
  volume: 1000000,
  resolutionDate: "2026-12-31",
};

const leg2: AccaLegInput = {
  marketId: "2",
  question: "Will ETH > 5k?",
  venue: "limitless",
  slug: "will-eth-5k",
  odds: 0.55,
  selectedOutcome: "Yes",
  link: "https://limitless.exchange/market/will-eth-5k",
  volume: 500000,
  resolutionDate: "2026-12-31",
};

const leg3: AccaLegInput = {
  marketId: "3",
  question: "Will SOL > 200?",
  venue: "polymarket",
  slug: "will-sol-200",
  odds: 0.5,
  selectedOutcome: "Yes",
  link: "https://polymarket.com/event/will-sol-200",
  volume: 800000,
  resolutionDate: "2026-12-31",
};

describe("computeSlipOdds", () => {
  it("computes combined odds for 2 legs", () => {
    const result = computeSlipOdds([leg1, leg2]);
    const rawProduct = 0.6 * 0.55;
    expect(result.overroundFactor).toBe(0.95);
    expect(result.combinedOdds).toBeCloseTo(rawProduct * 0.95, 4);
  });

  it("computes for 3 legs with 0.90 overround", () => {
    const result = computeSlipOdds([leg1, leg2, leg3]);
    expect(result.overroundFactor).toBe(0.9);
  });

  it("returns 0 odds for empty legs", () => {
    const result = computeSlipOdds([]);
    expect(result.combinedOdds).toBe(0);
    expect(result.overroundFactor).toBe(0);
  });
});

describe("computeProjectedPayout", () => {
  it("computes payout from stake and combined odds", () => {
    expect(computeProjectedPayout(100, 0.1485)).toBeCloseTo(673.4, 0);
  });

  it("returns 0 for 0 stake", () => {
    expect(computeProjectedPayout(0, 0.5)).toBe(0);
  });
});

describe("validateSlip", () => {
  it("returns error for fewer than 2 legs", () => {
    const errors = validateSlip([leg1], 100);
    expect(errors).toContain("Minimum 2 legs required");
  });

  it("returns error for more than 10 legs", () => {
    const manyLegs = Array(11).fill(leg1);
    const errors = validateSlip(manyLegs, 100);
    expect(errors).toContain("Maximum 10 legs allowed");
  });

  it("returns error for zero or negative stake", () => {
    const errors1 = validateSlip([leg1, leg2], 0);
    expect(errors1).toContain("Stake must be greater than 0");

    const errors2 = validateSlip([leg1, leg2], -5);
    expect(errors2).toContain("Stake must be greater than 0");
  });

  it("returns no errors for valid slip", () => {
    const errors = validateSlip([leg1, leg2], 100);
    expect(errors).toHaveLength(0);
  });

  it("returns multiple errors for invalid slip", () => {
    const errors = validateSlip([leg1], 0);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
