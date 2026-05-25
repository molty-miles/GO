export function lookupOverroundFactor(legCount: number): number {
  if (legCount < 2) {
    throw new Error("legCount must be at least 2");
  }
  if (legCount <= 2) return 0.95;
  if (legCount <= 4) return 0.9;
  if (legCount <= 6) return 0.85;
  return 0.7;
}

export function computeCombinedOdds(legs: number[], overround: number): number {
  const product = legs.reduce((acc, odds) => acc * odds, 1);
  return product * overround;
}

export function computeHedgeStake(payout: number, legs: number[]): number[] {
  const totalProduct = legs.reduce((acc, odds) => acc * odds, 1);
  return legs.map((odds, _i) => {
    const otherProduct = totalProduct / odds;
    return payout * otherProduct;
  });
}

export function validateAccaLegs(legs: unknown[]): boolean {
  return legs.length >= 2 && legs.length <= 10;
}
