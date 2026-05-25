import { useState, useMemo, useCallback } from "react";
import type { UnifiedMarket } from "@/types/market";
import { lookupOverroundFactor } from "@/utils/pricing";

export interface AccaLegInput {
  marketId: string;
  question: string;
  venue: string;
  odds: number;
  selectedOutcome: string;
}

export function useAccaBuilder() {
  const [legs, setLegs] = useState<AccaLegInput[]>([]);
  const [stake, setStake] = useState(0);

  const addLeg = useCallback((market: UnifiedMarket) => {
    setLegs((prev) => {
      if (prev.some((l) => l.marketId === market.id)) return prev;
      if (prev.length >= 10) return prev;
      return [
        ...prev,
        {
          marketId: market.id,
          question: market.question,
          venue: market.venue,
          odds: market.c_yes,
          selectedOutcome: "Yes",
        },
      ];
    });
  }, []);

  const removeLeg = useCallback((marketId: string) => {
    setLegs((prev) => prev.filter((l) => l.marketId !== marketId));
  }, []);

  const clearAll = useCallback(() => {
    setLegs([]);
    setStake(0);
  }, []);

  const legCount = legs.length;
  const { combinedOdds, overroundFactor } = useMemo(() => computeSlipOdds(legs), [legs]);
  const projectedPayout = useMemo(
    () => computeProjectedPayout(stake, combinedOdds),
    [stake, combinedOdds],
  );
  const validationErrors = useMemo(() => validateSlip(legs, stake), [legs, stake]);
  const isValid = validationErrors.length === 0;

  return {
    legs,
    stake,
    legCount,
    combinedOdds,
    overroundFactor,
    projectedPayout,
    validationErrors,
    isValid,
    addLeg,
    removeLeg,
    updateStake: setStake,
    clearAll,
  };
}

export function computeSlipOdds(legs: AccaLegInput[]): {
  combinedOdds: number;
  overroundFactor: number;
} {
  if (legs.length === 0) return { combinedOdds: 0, overroundFactor: 0 };
  const overroundFactor = lookupOverroundFactor(legs.length);
  const rawProduct = legs.reduce((acc, leg) => acc * leg.odds, 1);
  return { combinedOdds: rawProduct * overroundFactor, overroundFactor };
}

export function computeProjectedPayout(stake: number, combinedOdds: number): number {
  if (stake <= 0 || combinedOdds <= 0) return 0;
  return stake / combinedOdds;
}

export function validateSlip(legs: AccaLegInput[], stake: number): string[] {
  const errors: string[] = [];
  if (legs.length < 2) errors.push("Minimum 2 legs required");
  if (legs.length > 10) errors.push("Maximum 10 legs allowed");
  if (stake <= 0) errors.push("Stake must be greater than 0");
  return errors;
}
