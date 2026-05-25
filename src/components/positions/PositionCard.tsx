"use client";

import { cn } from "@/lib/utils";

interface LegDisplay {
  question: string;
  venue: string;
  outcome: string;
  odds: number;
  state: "PENDING" | "WON" | "LOST";
}

interface PositionCardProps {
  id: string;
  legs: LegDisplay[];
  stake: number;
  projectedPayout: number;
  status: "OPEN" | "WON" | "LOST";
  onView?: (id: string) => void;
}

function statusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "text-yellow-400";
    case "WON":
      return "text-green-400";
    case "LOST":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

export function PositionCard({
  id,
  legs,
  stake,
  projectedPayout,
  status,
  onView,
}: PositionCardProps) {
  const resolved = legs.filter((l) => l.state !== "PENDING").length;
  const total = legs.length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", statusColor(status))}>{status}</span>
          <span className="text-xs text-zinc-500">
            {resolved}/{total} resolved
          </span>
        </div>
        <span className="text-xs text-zinc-500">#{id.slice(0, 8)}</span>
      </div>

      <div className="mb-3 space-y-2">
        {legs.slice(0, 3).map((leg, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="max-w-[60%] truncate text-zinc-300">{leg.question}</span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                leg.state === "WON"
                  ? "text-green-400"
                  : leg.state === "LOST"
                    ? "text-red-400"
                    : "text-yellow-400",
              )}
            >
              {leg.state === "PENDING" ? "~" : leg.state}
            </span>
          </div>
        ))}
        {legs.length > 3 && <div className="text-xs text-zinc-500">+{legs.length - 3} more</div>}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="text-sm">
          <span className="text-zinc-400">Stake: </span>
          <span className="text-white">${stake.toFixed(2)}</span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-400">Payout: </span>
          <span className="text-green-400">${projectedPayout.toFixed(2)}</span>
        </div>
        {onView && (
          <button
            onClick={() => onView(id)}
            className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}
