export function computeHedgeStake(
  totalStake: number,
  legOdds: number[],
  targetOdds: number,
): number[] {
  if (legOdds.length === 0 || legOdds.some((o) => o <= 0)) {
    return legOdds.map(() => 0);
  }

  const product = legOdds.reduce((a, b) => a * b, 1);
  const rawTarget = product / targetOdds;

  return legOdds.map((odds) => {
    const portion = (rawTarget * odds) / product;
    return Math.round(totalStake * portion * 100) / 100;
  });
}

export function computeEffectiveMultiplier(combinedOdds: number, overroundFactor: number): number {
  if (combinedOdds <= 0 || overroundFactor <= 0) return 0;
  return (1 / combinedOdds) * overroundFactor;
}

export function computeSlippageTolerance(quotedOdds: number, actualOdds: number): number {
  if (quotedOdds <= 0) return 1;
  return Math.abs(actualOdds - quotedOdds) / quotedOdds;
}

export function validateOddsRange(odds: number): boolean {
  return odds > 0 && odds <= 1;
}
