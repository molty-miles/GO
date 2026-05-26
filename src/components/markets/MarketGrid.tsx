import { useState, useMemo } from "react";
import type { UnifiedMarket } from "@/types/market";
import { MarketCard } from "@/components/markets/MarketCard";
import type { AccaLegInput } from "@/hooks/useAccaBuilder";

interface MarketGridProps {
  markets: UnifiedMarket[];
  isLoading?: boolean;
  onAddLeg?: (market: UnifiedMarket, outcome?: "Yes" | "No") => void;
  legs?: AccaLegInput[];
}

function flagBestOdds(markets: UnifiedMarket[]): UnifiedMarket[] {
  // Mark the best odds market per venue
  const byVenue: Record<string, UnifiedMarket[]> = {};
  markets.forEach((m) => {
    if (!byVenue[m.venue]) byVenue[m.venue] = [];
    byVenue[m.venue].push(m);
  });

  const bestIds = new Set<string>();
  Object.values(byVenue).forEach((group) => {
    if (group.length === 0) return;
    const best = [...group].sort((a, b) => b.c_yes - a.c_yes)[0];
    if (best) bestIds.add(best.id);
  });

  return markets.map((m) => ({ ...m, isBestOdds: bestIds.has(m.id) }));
}

export function MarketGrid({ markets, isLoading, onAddLeg, legs = [] }: MarketGridProps) {
  const [filter, setFilter] = useState("");

  const flagged = useMemo(() => flagBestOdds(markets), [markets]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return flagged;
    return flagged.filter(
      (m) =>
        m.question.toLowerCase().includes(q) ||
        m.venue.toLowerCase().includes(q) ||
        m.category.some((c) => c.toLowerCase().includes(q)),
    );
  }, [flagged, filter]);

  const isInParlay = (marketId: string) => legs.find((leg) => leg.marketId === marketId);

  const getParlayOutcome = (marketId: string): "Yes" | "No" | undefined => {
    const leg = legs.find((l) => l.marketId === marketId);
    return leg?.selectedOutcome;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">No markets found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search markets..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none"
        />
        <svg
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} market{filtered.length !== 1 && "s"}
        </span>
        {legs.length > 0 && (
          <span className="text-primary">
            {legs.length} leg{legs.length !== 1 ? "s" : ""} in parlay
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((market) => {
          const leg = isInParlay(market.id);
          return (
            <MarketCard
              key={market.id}
              market={market}
              onAddLeg={onAddLeg}
              isInParlay={!!leg}
              parlayOutcome={getParlayOutcome(market.id)}
              isBestOdds={market.isBestOdds}
            />
          );
        })}
      </div>
    </div>
  );
}
