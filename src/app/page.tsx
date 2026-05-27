"use client";

import { useState, useEffect } from "react";
import { MarketGrid } from "@/components/markets/MarketGrid";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import { cn } from "@/lib/utils";
import type { UnifiedMarket } from "@/types/market";

type SortMode = "trending" | "volume" | "liquidity";
type Category = "All" | "Politics" | "Sports" | "Crypto" | "Entertainment" | "Esports" | "Finance";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "volume", label: "Volume" },
  { value: "liquidity", label: "Liquidity" },
];

const CATEGORY_TABS: Category[] = [
  "All",
  "Politics",
  "Sports",
  "Crypto",
  "Entertainment",
  "Esports",
  "Finance",
];

// Keyword mapping for category-based search (Option 1: mimics Polymarket/Kalshi grouping)
const CATEGORY_KEYWORDS: Record<Exclude<Category, "All">, string> = {
  Politics: "election trump harris biden senate congress president vote politics",
  Sports: "nfl nba soccer football basketball tennis ufc premier league sports",
  Crypto: "bitcoin btc ethereum eth solana sol crypto coinbase",
  Entertainment: "oscar emmy movie film music grammy celebrity entertainment",
  Esports: "lol valorant csgo dota esports gaming",
  Finance: "fed rate inflation gdp stock market recession economy finance",
};

export default function HomePage() {
  const [markets, setMarkets] = useState<UnifiedMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortMode>("trending");
  const { addLeg, legs } = useAccaBuilderContext();

  // Fetch when category or sort changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("sort", sort);

        if (activeCategory !== "All") {
          const keywords = CATEGORY_KEYWORDS[activeCategory];
          if (keywords) params.set("q", keywords);
        }

        const res = await fetch(`/api/markets?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load markets");
        const data = await res.json();
        if (!cancelled) setMarkets(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load markets");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, sort]);

  return (
    <div className="w-full max-w-full overflow-hidden p-4 pb-24 pt-14 md:mx-auto md:max-w-7xl md:p-6 md:pb-4 md:pt-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold">Markets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Browse and combine prediction markets into accumulator tickets
        </p>
      </div>

      {/* Category Tabs (Primary Navigation) */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort Controls (Secondary) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sort === opt.value
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          Sorted server-side
        </span>
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
