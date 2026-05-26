"use client";

import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import { useSubmitAcca } from "@/hooks/useSubmitAcca";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

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

function AccaLegRow({
  leg,
  onRemove,
}: {
  leg: { marketId: string; question: string; venue: string; odds: number };
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-card p-3 border border-border/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-medium", venueColor(leg.venue))}>{leg.venue}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{leg.question}</p>
        <span className="text-xs text-muted-foreground">Yes @ {(leg.odds * 100).toFixed(1)}%</span>
      </div>
      <button
        onClick={() => onRemove(leg.marketId)}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-red-500"
        aria-label="Remove leg"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function AccaSlip({ onClose }: { onClose?: () => void }) {
  const {
    legs,
    stake,
    legCount,
    combinedOdds,
    overroundFactor,
    projectedPayout,
    validationErrors,
    isValid,
    removeLeg,
    updateStake,
    clearAll,
  } = useAccaBuilderContext();
  const { authenticated, login } = useUser();
  const submit = useSubmitAcca();

  const multiplier = combinedOdds > 0 ? (1 / combinedOdds).toFixed(2) : "—";

  if (submit.state === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="mb-3 h-12 w-12 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-foreground">Acca Submitted!</h3>
        <p className="mt-1 text-sm text-muted-foreground">Track its progress in Positions</p>
        <button
          onClick={() => {
            clearAll();
            submit.reset();
            onClose?.();
          }}
          className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm text-secondary-foreground"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <h3 className="font-semibold text-foreground">Parlay Slip</h3>
          {legCount > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {legCount} leg{legCount > 1 ? "s" : ""} • {legCount < 2 ? "Add more to proceed" : "Ready to stake"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {legCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
          )}
        </div>
      </div>

      {/* Empty state */}
      {legCount === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-3">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h4 className="mb-1 font-semibold text-foreground">Build Your Parlay</h4>
          <p className="text-xs text-muted-foreground">
            Tap {String.fromCharCode(34)}+ Add to Parlay{String.fromCharCode(34)} on any market to get started. Combine 2-10 markets for better odds!
          </p>
        </div>
      )}

      {/* Legs */}
      {legCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-semibold text-foreground">Your Legs</h4>
            <span className="text-xs text-muted-foreground">{legCount}/10</span>
          </div>
          <div className="space-y-2">
            {legs.map((leg) => (
              <AccaLegRow key={leg.marketId} leg={leg} onRemove={removeLeg} />
            ))}
          </div>
        </div>
      )}

      {/* Odds display */}
      {legCount >= 2 && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <h4 className="text-xs font-semibold text-foreground">Acca Summary</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Combined Odds</span>
              <span className="font-mono font-semibold text-foreground">{combinedOdds.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Multiplier</span>
              <span className="font-mono font-semibold text-primary">{multiplier}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overround</span>
              <span className="font-mono text-muted-foreground">
                {(overroundFactor * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stake input + payout */}
      {legCount >= 2 && submit.state !== "reviewing" && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Stake (USDC)</label>
            <input
              type="number"
              value={stake || ""}
              onChange={(e) => updateStake(Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          {stake > 0 && combinedOdds > 0 && (
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-center border border-primary/20">
              <span className="text-xs text-muted-foreground">Projected Payout: </span>
              <span className="text-lg font-bold text-primary">${projectedPayout.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Validation */}
      {validationErrors.length > 0 && (
        <div className="space-y-1 rounded-lg bg-destructive/10 p-3">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-500">
              • {err}
            </p>
          ))}
        </div>
      )}

      {/* Review step */}
      {submit.state === "reviewing" && legs.length >= 2 && (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
          <h4 className="text-sm font-semibold text-foreground">Confirm Parlay</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Legs: {legCount}</p>
            <p>
              Odds: {combinedOdds.toFixed(4)} ({multiplier}x)
            </p>
            <p>Stake: ${stake.toFixed(2)}</p>
            <p>Payout: ${projectedPayout.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {submit.error && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-sm text-red-500">{submit.error}</p>
        </div>
      )}

      {/* Submit / Login buttons */}
      <div className="space-y-2">
        {submit.state === "reviewing" ? (
          <button
            onClick={submit.confirm}
            className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
          >
            Confirm & Submit
          </button>
        ) : submit.state === "submitting" ? null : (
          <>
            {!authenticated ? (
              <button
                onClick={login}
                className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
              >
                Sign In to Place Parlay
              </button>
            ) : (
              <button
                onClick={submit.startReview}
                disabled={!isValid}
                className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Parlay
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
