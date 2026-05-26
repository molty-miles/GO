"use client";

import type { UnifiedMarket } from "@/types/market";
import { MarketCard } from "@/components/markets/MarketCard";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";

interface TrendingSectionProps {
  markets: UnifiedMarket[];
  isLoading: boolean;
}

export function TrendingSection({ markets, isLoading }: TrendingSectionProps) {
  const { addLeg } = useAccaBuilderContext();

  const trending = [...markets]
    .sort((a, b) => b.volume - a.volume || b.liquidity - a.liquidity)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Trending</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  if (trending.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">Trending</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trending.map((market) => (
          <MarketCard key={market.id} market={market} onAddLeg={addLeg} />
        ))}
      </div>
    </section>
  );
}
