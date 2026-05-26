"use client";

import { useState, useEffect } from "react";
import { MarketGrid } from "@/components/markets/MarketGrid";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import type { UnifiedMarket } from "@/types/market";

export default function HomePage() {
  const [markets, setMarkets] = useState<UnifiedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addLeg, legs } = useAccaBuilderContext();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch("/api/markets?sort=trending")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load markets");
        return res.json() as Promise<UnifiedMarket[]>;
      })
      .then((data) => {
        if (!cancelled) {
          setMarkets(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full max-w-full overflow-hidden p-4 pb-24 pt-14 md:mx-auto md:max-w-7xl md:p-6 md:pb-4 md:pt-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold">Markets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Browse and combine prediction markets into accumulator tickets
        </p>
      </div>

      <ErrorBoundary>
        <section>
          {error ? (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          ) : (
            <MarketGrid markets={markets} isLoading={isLoading} onAddLeg={addLeg} legs={legs} />
          )}
        </section>
      </ErrorBoundary>
    </div>
  );
}
