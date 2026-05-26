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

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-colors hover:border-zinc-700",
        isBestOdds ? "border-emerald-500/40" : "border-border",
      )}
    >
      {isBestOdds && (
        <span className="absolute right-2 top-2 rounded-md bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-400">
          Best Odds
        </span>
      )}

      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn("rounded-md px-2 py-0.5 text-xs font-medium", venueColor(market.venue))}
        >
          {market.venue}
        </span>
        {market.category.slice(0, 2).map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            {cat}
          </span>
        ))}
      </div>

      <Link href={`/markets/${market.id}`} className="block">
        <h3 className="mb-3 text-sm font-medium leading-snug text-foreground hover:text-primary">
          {market.question}
        </h3>
      </Link>

      <div
        className="mb-3 h-1 rounded-full"
        style={{ background: volumeBar(market.volume, 100000) }}
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-lg font-bold text-foreground transition-colors",
                priceChanged && "text-green-400",
              )}
            >
              {(livePrice * 100).toFixed(1)}%
            </span>
            {priceChanged && <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />}
          </div>
          <div className="text-xs text-muted-foreground">{multiplier}x</div>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <div>Vol: {market.volume.toLocaleString()}</div>
        </div>

        {onAddLeg && (
          <button
            onClick={() => onAddLeg(market)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 md:opacity-0 md:group-hover:opacity-100"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}
