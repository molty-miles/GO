"use client";

import { useState, useEffect } from "react";
import { MarketGrid } from "@/components/markets/MarketGrid";
import { TrendingSection } from "@/components/social/TrendingSection";
import { PopularCombos } from "@/components/social/PopularCombos";
import { EditorialPicks } from "@/components/social/EditorialPicks";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { UnifiedMarket } from "@/types/market";

export default function HomePage() {
  const [markets, setMarkets] = useState<UnifiedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-8 p-4 pb-24 md:pb-4">
      <div>
        <h1 className="text-xl font-bold">GO Market</h1>
        <p className="text-sm text-muted-foreground">
          Cross-platform prediction market accumulator
        </p>
      </div>

      <ErrorBoundary>
        <TrendingSection markets={markets} isLoading={isLoading} />
      </ErrorBoundary>

      <ErrorBoundary>
        <PopularCombos />
      </ErrorBoundary>

      <ErrorBoundary>
        <EditorialPicks />
      </ErrorBoundary>

      <ErrorBoundary>
        <section>
          <h2 className="mb-3 text-lg font-bold">All Markets</h2>
          {error ? (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          ) : (
            <MarketGrid markets={markets} isLoading={isLoading} />
          )}
        </section>
      </ErrorBoundary>
    </div>
  );
}
