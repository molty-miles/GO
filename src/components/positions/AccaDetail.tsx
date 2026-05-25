"use client";

import type { AccaPosition } from "@/hooks/useAccas";
import { cn } from "@/lib/utils";

interface AccaDetailProps {
  acca: AccaPosition;
  onClose: () => void;
}

function venueColor(venue: string): string {
  switch (venue) {
    case "polymarket":
      return "text-blue-400";
    case "kalshi":
      return "text-green-400";
    case "limitless":
      return "text-purple-400";
    default:
      return "text-zinc-400";
  }
}

function stateBadge(state: string): string {
  switch (state) {
    case "WON":
      return "bg-green-600/20 text-green-400";
    case "LOST":
      return "bg-red-600/20 text-red-400";
    default:
      return "bg-yellow-600/20 text-yellow-400";
  }
}

export function AccaDetail({ acca, onClose }: AccaDetailProps) {
  const resolved = acca.legs.filter((l) => l.state !== "PENDING").length;
  const total = acca.legs.length;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 p-4 md:inset-x-auto md:right-4 md:top-24 md:w-96 md:rounded-2xl md:border">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Acca Detail</h3>
            <p className="text-xs text-zinc-500">{acca.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status bar */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={cn("rounded-full px-3 py-1 text-xs font-medium", stateBadge(acca.status))}
          >
            {acca.status}
          </span>
          <span className="text-xs text-zinc-500">
            {resolved}/{total} legs resolved
          </span>
        </div>

        {/* Legs */}
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-zinc-400">Legs</h4>
          {acca.legs.map((leg, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-medium", venueColor(leg.venue))}>
                  {leg.venue}
                </span>
                <span
                  className={cn(
                    "ml-auto rounded px-2 py-0.5 text-xs font-medium",
                    stateBadge(leg.state),
                  )}
                >
                  {leg.state}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-300">{leg.question}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {leg.selectedOutcome} @ {(leg.odds * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-2 rounded-xl bg-zinc-900 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Stake</span>
            <span className="text-white">${acca.stake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Combined Odds</span>
            <span className="text-white">{acca.combinedOdds.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Projected Payout</span>
            <span className={cn(acca.status === "WON" ? "text-green-400" : "text-white")}>
              ${acca.projectedPayout.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
