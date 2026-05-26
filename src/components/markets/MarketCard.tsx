"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UnifiedMarket } from "@/types/market";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  market: UnifiedMarket;
  onAddLeg?: (market: UnifiedMarket, outcome: "Yes" | "No") => void;
  isInParlay?: boolean;
  parlayOutcome?: "Yes" | "No" | null;
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

export function MarketCard({
  market,
  onAddLeg,
  isInParlay,
  parlayOutcome,
  isBestOdds,
}: MarketCardProps) {
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

  const yesPrice = livePrice;
  const noPrice = 1 - livePrice;
  const priceChanged = livePrice !== market.c_yes;

  const handleAddYes = () => {
    onAddLeg?.(market, "Yes");
  };

  const handleAddNo = () => {
    onAddLeg?.(market, "No");
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-3 sm:p-4 transition-all duration-200 w-full min-w-0",
        "hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20",
        isBestOdds ? "border-emerald-500/40" : "border-border",
        isInParlay && "border-primary/40 ring-1 ring-primary/20",
      )}
    >
      {/* Best Odds Badge */}
      {isBestOdds && (
        <span className="absolute right-2 top-2 z-10 rounded-md bg-emerald-600/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 leading-tight">
          Best Odds
        </span>
      )}

      {/* Parlay Added Indicator */}
      {isInParlay && parlayOutcome && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {parlayOutcome}
        </div>
      )}

      {/* Header: Venue + Date */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              venueColor(market.venue),
            )}
          >
            {market.venue}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(market.resolution_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {/* External Link */}
        <a
          href={venueUrl(market.venue, market.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {market.venue.charAt(0).toUpperCase() + market.venue.slice(1)}
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Market Question */}
      <Link href={`/markets/${market.id}`} className="block flex-1">
        <h3 className="mb-2 pr-0 market-card-question text-sm font-semibold leading-snug text-foreground hover:text-primary line-clamp-2 transition-colors">
          {market.question}
        </h3>
      </Link>

      {/* Data Points Row */}
      <div className="mb-3 flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-mono">${(market.volume / 1000000).toFixed(1)}M vol</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{(market.liquidity / 1000).toFixed(0)}K liq</span>
        </div>
      </div>

      {/* Price & Action Section */}
      <div className="mt-auto space-y-2">
        {/* Price Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-lg font-bold text-foreground transition-colors",
                priceChanged && "text-green-400",
              )}
            >
              {(yesPrice * 100).toFixed(0)}%
            </span>
            {priceChanged && <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />}
            <span className="text-xs text-muted-foreground">Yes</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-muted-foreground">
              {(noPrice * 100).toFixed(0)}%
            </span>
            <span className="ml-1 text-xs text-muted-foreground">No</span>
          </div>
        </div>

        {/* Yes/No Action Buttons */}
        {onAddLeg && (
          <div className="flex gap-2">
            <button
              onClick={handleAddYes}
              disabled={isInParlay && parlayOutcome === "Yes"}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5",
                isInParlay && parlayOutcome === "Yes"
                  ? "bg-green-600/30 text-green-400 border border-green-500/40 cursor-default"
                  : "bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 hover:border-green-500/50",
              )}
            >
              {isInParlay && parlayOutcome === "Yes" ? (
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
                  Added
                </>
              ) : (
                "Yes"
              )}
            </button>
            <button
              onClick={handleAddNo}
              disabled={isInParlay && parlayOutcome === "No"}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5",
                isInParlay && parlayOutcome === "No"
                  ? "bg-red-600/30 text-red-400 border border-red-500/40 cursor-default"
                  : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 hover:border-red-500/50",
              )}
            >
              {isInParlay && parlayOutcome === "No" ? (
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
                  Added
                </>
              ) : (
                "No"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
