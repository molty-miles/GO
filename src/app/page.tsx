"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketGrid } from "@/components/markets/MarketGrid";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import { cn } from "@/lib/utils";
import type { UnifiedMarket } from "@/types/market";

type SortMode = "trending" | "volume" | "odds";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "volume", label: "By Volume" },
  { value: "odds", label: "Best Odds" },
];

export default function HomePage() {
  const [markets, setMarkets] = useState<UnifiedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("trending");
  const { addLeg, legs } = useAccaBuilderContext();

  const fetchMarkets = useCallback(async (sortMode: SortMode) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/markets?sort=${sortMode}`);
      if (!res.ok) throw new Error("Failed to load markets");
      const data = await res.json();
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMarkets(sort).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [sort, fetchMarkets]);

  return (
    <div className="w-full max-w-full overflow-hidden p-4 pb-24 pt-14 md:mx-auto md:max-w-7xl md:p-6 md:pb-4 md:pt-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold">Markets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Browse and combine prediction markets into accumulator tickets
        </p>
      </div>

      {/* Sort tabs */}
      <div className="mb-4 flex gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              sort === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {opt.label}
          </button>
        ))}
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
