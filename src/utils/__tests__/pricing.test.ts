import {
  lookupOverroundFactor,
  computeCombinedOdds,
  computeHedgeStake,
  validateAccaLegs,
} from "@/utils/pricing";

describe("lookupOverroundFactor", () => {
  it("returns 0.95 for 2 legs", () => {
    expect(lookupOverroundFactor(2)).toBe(0.95);
  });

  it("returns 0.90 for 3 legs", () => {
    expect(lookupOverroundFactor(3)).toBe(0.9);
  });

  it("returns 0.90 for 4 legs", () => {
    expect(lookupOverroundFactor(4)).toBe(0.9);
  });

  it("returns 0.85 for 5 legs", () => {
    expect(lookupOverroundFactor(5)).toBe(0.85);
  });

  it("returns 0.85 for 6 legs", () => {
    expect(lookupOverroundFactor(6)).toBe(0.85);
  });

  it("returns 0.70 for 7 legs", () => {
    expect(lookupOverroundFactor(7)).toBe(0.7);
  });

  it("returns 0.70 for 10 legs", () => {
    expect(lookupOverroundFactor(10)).toBe(0.7);
  });

  it("throws for fewer than 2 legs", () => {
    expect(() => lookupOverroundFactor(1)).toThrow();
    expect(() => lookupOverroundFactor(0)).toThrow();
  });
});

describe("computeCombinedOdds", () => {
  it("multiplies leg odds by overround factor", () => {
    const result = computeCombinedOdds([0.6, 0.55, 0.5], 0.9);
    expect(result).toBeCloseTo(0.1485, 4);
  });

  it("returns 0 when a leg has 0 odds", () => {
    const result = computeCombinedOdds([0.6, 0, 0.5], 0.9);
    expect(result).toBe(0);
  });

  it("works with 2 legs", () => {
    const result = computeCombinedOdds([0.5, 0.5], 0.95);
    expect(result).toBeCloseTo(0.2375, 4);
  });

  it("works with 10 legs of 1.0 odds", () => {
    const legs = Array(10).fill(1.0);
    const result = computeCombinedOdds(legs, 0.7);
    expect(result).toBeCloseTo(0.7, 4);
  });
});

describe("computeHedgeStake", () => {
  it("matches PRD example for 3 legs", () => {
    const payout = 673;
    const legs = [0.6, 0.55, 0.5];
    const result = computeHedgeStake(payout, legs);
    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(185, 0);
    expect(result[1]).toBeCloseTo(202, 0);
    expect(result[2]).toBeCloseTo(222, 0);
  });

  it("returns single element for 2 legs", () => {
    const result = computeHedgeStake(100, [0.6, 0.5]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(50, 0);
    expect(result[1]).toBeCloseTo(60, 0);
  });
});

describe("validateAccaLegs", () => {
  it("returns true for 2 legs", () => {
    expect(validateAccaLegs([{}, {}])).toBe(true);
  });

  it("returns true for 10 legs", () => {
    const legs = Array(10).fill({});
    expect(validateAccaLegs(legs)).toBe(true);
  });

  it("returns false for 1 leg", () => {
    expect(validateAccaLegs([{}])).toBe(false);
  });

  it("returns false for 11 legs", () => {
    const legs = Array(11).fill({});
    expect(validateAccaLegs(legs)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(validateAccaLegs([])).toBe(false);
  });
});
