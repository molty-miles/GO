"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UnifiedMarket } from "@/types/market";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import { MarketGridSkeleton } from "@/components/ui/SkeletonCard";
import { cn } from "@/lib/utils";

function venueColor(venue: string): string {
  switch (venue) {
    case "polymarket":
      return "bg-blue-500/20 text-blue-400";
    case "kalshi":
      return "bg-green-500/20 text-green-400";
    case "limitless":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-zinc-500/20 text-zinc-400";
  }
}

function venueUrl(venue: string, slug: string): string {
  switch (venue) {
    case "polymarket":
      return `https://polymarket.com/event/${slug}`;
    case "kalshi":
      return `https://kalshi.com/markets/${slug}`;
    case "limitless":
      return `https://limitless.exchange/market/${slug}`;
    default:
      return "#";
  }
}

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addLeg, legCount } = useAccaBuilderContext();
  const [market, setMarket] = useState<UnifiedMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMarket() {
      try {
        const response = await fetch(`/api/markets/${id}`);
        if (!response.ok) throw new Error("Market not found");
        const data = await response.json();
        if (!cancelled) setMarket(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load market");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMarket();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 pb-24 md:pb-4">
        <MarketGridSkeleton count={1} />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <h2 className="text-lg font-medium text-foreground">{error ?? "Market not found"}</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Markets
        </button>
      </div>
    );
  }

  const multiplier = market.c_yes > 0 ? (1 / market.c_yes).toFixed(2) : "—";

  const handleAddLeg = () => {
    addLeg(market);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="p-4 pb-24 md:pb-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={cn("rounded-md px-2.5 py-1 text-sm font-medium", venueColor(market.venue))}
            >
              {market.venue}
            </span>
            {market.category.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="mb-4 text-xl font-bold leading-snug text-foreground">{market.question}</h1>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-background p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {(market.c_yes * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Yes Probability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{multiplier}x</div>
              <div className="text-sm text-muted-foreground">Multiplier</div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Volume</span>
              <span className="text-foreground">${market.volume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Liquidity</span>
              <span className="text-foreground">${market.liquidity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Resolution Date</span>
              <span className="text-foreground">
                {new Date(market.resolution_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-muted-foreground">{market.slug}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAddLeg}
              className={cn(
                "w-full rounded-xl py-3 font-medium text-primary-foreground transition-all",
                added ? "bg-green-600" : "bg-primary hover:bg-primary/90",
              )}
            >
              {added
                ? `Added! (${legCount + 1} leg${legCount + 1 > 1 ? "s" : ""})`
                : "+ Add to Acca"}
            </button>

            {market.link && (
              <a
                href={venueUrl(market.venue, market.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border py-3 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                View on {market.venue}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
