"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UnifiedMarket } from "@/types/market";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  market: UnifiedMarket;
  onAddLeg?: (market: UnifiedMarket) => void;
  isBestOdds?: boolean;
}

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

function volumeBar(v: number, max: number): string {
  const pct = max > 0 ? (v / max) * 100 : 0;
  return `linear-gradient(90deg, rgba(99,102,241,0.3) ${pct}%, transparent ${pct}%)`;
}

export function MarketCard({ market, onAddLeg, isBestOdds }: MarketCardProps) {
  const multiplier = market.c_yes > 0 ? (1 / market.c_yes).toFixed(2) : "—";
  const [livePrice, setLivePrice] = useState<number>(market.c_yes);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/markets/${market.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.c_yes) setLivePrice(data.c_yes);
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [market.id]);

  const priceChanged = livePrice !== market.c_yes;

  const handleAddLeg = () => {
    onAddLeg?.(market);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-3 sm:p-4 transition-colors hover:border-zinc-700 w-full min-w-0",
        "market-card",
        isBestOdds ? "border-emerald-500/40" : "border-border",
      )}
    >
      {isBestOdds && (
        <span className="absolute right-1 top-1 z-10 rounded-md bg-green-600/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400 leading-tight sm:right-2 sm:top-2 sm:px-2 sm:text-xs">
          Best Odds
        </span>
      )}

      <div className="mb-1.5 flex flex-wrap items-center gap-1 pr-4 sm:pr-0">
        <span
          className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", venueColor(market.venue))}
        >
          {market.venue}
        </span>
        {market.category.slice(0, 2).map((cat) => (
          <span
            key={cat}
            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {cat}
          </span>
        ))}
      </div>

      <Link href={`/markets/${market.id}`} className="block flex-1">
        <h3 className="mb-1.5 pr-5 sm:pr-6 market-card-question text-xs sm:text-sm font-medium leading-snug text-foreground hover:text-primary line-clamp-2">
          {market.question}
        </h3>
      </Link>

      <div
        className="mb-1.5 h-0.5 rounded-full sm:mb-2 sm:h-1"
        style={{ background: volumeBar(market.volume, 100000) }}
      />

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "market-card-odds text-base sm:text-lg font-bold text-foreground transition-colors",
                  priceChanged && "text-green-400",
                )}
              >
                {(livePrice * 100).toFixed(1)}%
              </span>
              {priceChanged && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 sm:h-2 sm:w-2" />
              )}
            </div>
            <div className="market-card-label text-[10px] sm:text-xs text-muted-foreground">
              {multiplier}x
            </div>
          </div>

          <div className="shrink-0 text-right market-card-label text-[10px] sm:text-xs text-muted-foreground">
            <div>Vol: {market.volume.toLocaleString()}</div>
          </div>
        </div>

        {onAddLeg && (
          <button
            onClick={handleAddLeg}
            className={cn(
              "market-card-btn w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5",
              addedFeedback
                ? "bg-green-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {addedFeedback ? (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added!
              </>
            ) : (
              "+ Add to Parlay"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
