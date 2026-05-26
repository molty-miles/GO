"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAccaBuilder } from "@/hooks/useAccaBuilder";
import type { AccaLegInput } from "@/hooks/useAccaBuilder";
import type { UnifiedMarket } from "@/types/market";

interface AccaBuilderContextValue {
  legs: AccaLegInput[];
  stake: number;
  legCount: number;
  combinedOdds: number;
  overroundFactor: number;
  projectedPayout: number;
  validationErrors: string[];
  isValid: boolean;
  addLeg: (market: UnifiedMarket, outcome?: "Yes" | "No") => void;
  removeLeg: (marketId: string) => void;
  updateStake: (amount: number) => void;
  clearAll: () => void;
}

const AccaBuilderContext = createContext<AccaBuilderContextValue | null>(null);

export function AccaBuilderProvider({ children }: { children: ReactNode }) {
  const builder = useAccaBuilder();
  return <AccaBuilderContext.Provider value={builder}>{children}</AccaBuilderContext.Provider>;
}

export function useAccaBuilderContext(): AccaBuilderContextValue {
  const ctx = useContext(AccaBuilderContext);
  if (!ctx) throw new Error("useAccaBuilderContext must be used within AccaBuilderProvider");
  return ctx;
}
