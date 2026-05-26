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
  leg: {
    marketId: string;
    question: string;
    venue: string;
    odds: number;
    selectedOutcome: string;
    volume: number;
  };
  onRemove: (id: string) => void;
}) {
  const multiplier = leg.odds > 0 ? (1 / leg.odds).toFixed(2) : "—";
  const isYes = leg.selectedOutcome === "Yes";

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-3 border border-border/50 group hover:border-border/80 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-xs font-medium", venueColor(leg.venue))}>{leg.venue}</span>
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded",
              isYes ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
            )}
          >
            {leg.selectedOutcome}
          </span>
        </div>
        <p className="text-sm text-foreground font-medium leading-snug line-clamp-2 mb-1">
          {leg.question}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{(leg.odds * 100).toFixed(1)}%</span>
          <span>{multiplier}x</span>
          <span>Vol: ${(leg.volume / 1000000).toFixed(1)}M</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(leg.marketId)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-red-400"
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
        <h3 className="text-lg font-semibold text-foreground">Parlay Submitted!</h3>
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
          <h3 className="font-semibold text-foreground text-lg">Your Parlay</h3>
          {legCount > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {legCount} leg{legCount > 1 ? "s" : ""} • {""}
              {legCount < 2 ? "Add more to proceed" : "Ready to stake"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {legCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Remove All
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
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Click &quot;Yes&quot; or &quot;No&quot; on any market to add a leg. Combine 2-10 markets
            for better odds!
          </p>
        </div>
      )}

      {/* Legs */}
      {legCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-semibold text-foreground">Legs</h4>
            <span className="text-xs text-muted-foreground">{legCount}/10</span>
          </div>
          <div className="space-y-2">
            {legs.map((leg) => (
              <AccaLegRow key={leg.marketId} leg={leg} onRemove={removeLeg} />
            ))}
          </div>
        </div>
      )}

      {/* Odds Summary */}
      {legCount >= 2 && (
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Acca Summary
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Combined Odds</span>
              <span className="font-mono font-semibold text-foreground">
                {combinedOdds.toFixed(4)}
              </span>
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

      {/* Stake Input */}
      {legCount >= 2 && submit.state !== "reviewing" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Bet Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={stake || ""}
                onChange={(e) => updateStake(Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 pl-8 text-lg font-mono outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[5, 10, 20, 50].map((amount) => (
              <button
                key={amount}
                onClick={() => updateStake(amount)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                  stake === amount
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80",
                )}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Payout Preview */}
          {stake > 0 && combinedOdds > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">${stake.toFixed(2)}</span>
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-lg font-bold text-primary">
                  ${projectedPayout.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">(est.)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Step */}
      {submit.state === "reviewing" && legs.length >= 2 && (
        <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <h4 className="text-sm font-semibold text-foreground">Confirm Parlay</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Legs</span>
              <span className="font-mono text-foreground">{legCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Odds</span>
              <span className="font-mono text-foreground">
                {combinedOdds.toFixed(4)} ({multiplier}x)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stake</span>
              <span className="font-mono text-foreground">${stake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-2">
              <span>Payout</span>
              <span className="font-mono text-primary font-bold">
                ${projectedPayout.toFixed(2)}
              </span>
            </div>
          </div>
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

      {/* Error */}
      {submit.error && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-sm text-red-500">{submit.error}</p>
        </div>
      )}

      {/* Submit / Login */}
      <div className="space-y-2 pt-2">
        {submit.state === "reviewing" ? (
          <button
            onClick={submit.confirm}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Confirm & Submit
          </button>
        ) : submit.state === "submitting" ? (
          <button
            disabled
            className="w-full rounded-xl bg-primary/70 py-3.5 font-medium text-primary-foreground cursor-wait"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          </button>
        ) : (
          <>
            {!authenticated ? (
              <button
                onClick={login}
                className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Sign In to Place Parlay
              </button>
            ) : (
              <button
                onClick={submit.startReview}
                disabled={!isValid}
                className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                Review Parlay
              </button>
            )}
          </>
        )}
      </div>

      {/* Disclaimer */}
      {legCount > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          Parlay valid for 5 minutes after submission
        </p>
      )}
    </div>
  );
}
