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
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", statusColor(status))}>{status}</span>
          <span className="text-xs text-muted-foreground">
            {resolved}/{total} resolved
          </span>
        </div>
        <span className="text-xs text-muted-foreground">#{id.slice(0, 8)}</span>
      </div>

      <div className="mb-3 space-y-2">
        {legs.slice(0, 3).map((leg, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="max-w-[60%] truncate text-muted-foreground">{leg.question}</span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                leg.state === "WON"
                  ? "text-emerald-500"
                  : leg.state === "LOST"
                    ? "text-red-500"
                    : "text-yellow-400",
              )}
            >
              {leg.state === "PENDING" ? "~" : leg.state}
            </span>
          </div>
        ))}
        {legs.length > 3 && (
          <div className="text-xs text-muted-foreground">+{legs.length - 3} more</div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Stake: </span>
          <span className="text-foreground">${stake.toFixed(2)}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Payout: </span>
          <span className="text-emerald-500">${projectedPayout.toFixed(2)}</span>
        </div>
        {onView && (
          <button
            onClick={() => onView(id)}
            className="rounded-lg bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}
