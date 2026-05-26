"use client";

import { useState, useMemo } from "react";
import type { UnifiedMarket } from "@/types/market";
import { MarketCard } from "@/components/markets/MarketCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { MarketGridSkeleton } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { flagBestOdds } from "@/lib/aggregation/discovery";
import { cn } from "@/lib/utils";

interface MarketGridProps {
  markets: UnifiedMarket[];
  isLoading: boolean;
  onAddLeg?: (market: UnifiedMarket) => void;
}

const categories = ["All", "Politics", "Sports", "Crypto", "Entertainment", "Science"];
const sortOptions = [
  { value: "trending", label: "Trending" },
  { value: "volume", label: "Volume" },
  { value: "resolve", label: "Closing Soon" },
  { value: "odds", label: "Highest Odds" },
] as const;

export function MarketGrid({ markets, isLoading, onAddLeg }: MarketGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<string>("trending");

  const flagged = useMemo(() => flagBestOdds(markets), [markets]);

  const filtered = flagged
    .filter((m) => {
      if (category !== "All" && !m.category.includes(category)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.question.toLowerCase().includes(q) && !m.slug.toLowerCase().includes(q))
          return false;
      }
      return m.active;
    })
    .sort((a, b) => {
      switch (sort) {
        case "volume":
          return b.volume - a.volume;
        case "resolve":
          return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
        case "odds":
          return b.c_yes - a.c_yes;
        default:
          return b.volume - a.volume || b.liquidity - a.liquidity;
      }
    });

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="sm:ml-auto rounded-full bg-secondary px-3 py-1.5 text-xs sm:text-sm text-secondary-foreground outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <MarketGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No markets found"
          description="Try adjusting your filters or search query"
          action={{
            label: "Clear filters",
            onClick: () => {
              setSearch("");
              setCategory("All");
            },
          }}
        />
      ) : (
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onAddLeg={onAddLeg}
              isBestOdds={market.isBestOdds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
