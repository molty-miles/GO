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
    <div className="flex items-start gap-2 rounded-lg bg-zinc-900 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs font-medium", venueColor(leg.venue))}>{leg.venue}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-300">{leg.question}</p>
        <span className="text-xs text-zinc-500">Yes @ {(leg.odds * 100).toFixed(1)}%</span>
      </div>
      <button
        onClick={() => onRemove(leg.marketId)}
        className="shrink-0 rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
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
          className="mb-3 h-12 w-12 text-green-400"
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
        <h3 className="text-lg font-semibold text-white">Acca Submitted!</h3>
        <p className="mt-1 text-sm text-zinc-400">Track its progress in Positions</p>
        <button
          onClick={() => {
            clearAll();
            submit.reset();
            onClose?.();
          }}
          className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">
          Acca Slip
          {legCount > 0 && (
            <span className="ml-2 text-sm text-zinc-500">
              {legCount} leg{legCount > 1 ? "s" : ""}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {legCount > 0 && (
            <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
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
        <div className="flex flex-col items-center py-8 text-center">
          <svg
            className="mb-2 h-8 w-8 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm text-zinc-500">
            Tap {String.fromCharCode(34)}+ Add{String.fromCharCode(34)} on any market to build your
            accumulator
          </p>
        </div>
      )}

      {/* Legs */}
      {legCount > 0 && (
        <div className="space-y-2">
          {legs.map((leg) => (
            <AccaLegRow key={leg.marketId} leg={leg} onRemove={removeLeg} />
          ))}
        </div>
      )}

      {/* Odds display */}
      {legCount >= 2 && (
        <div className="space-y-2 rounded-xl bg-zinc-900 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Combined Odds</span>
            <span className="font-mono text-white">{combinedOdds.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Multiplier</span>
            <span className="font-mono text-indigo-400">{multiplier}x</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Overround</span>
            <span className="font-mono text-zinc-400">{(overroundFactor * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Stake input + payout */}
      {legCount >= 2 && submit.state !== "reviewing" && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 text-xs text-zinc-500">Stake (USDC)</label>
            <input
              type="number"
              value={stake || ""}
              onChange={(e) => updateStake(Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-lg text-white outline-none placeholder-zinc-600 focus:border-indigo-500"
            />
          </div>
          {stake > 0 && combinedOdds > 0 && (
            <div className="rounded-xl bg-indigo-600/10 px-3 py-2 text-center">
              <span className="text-sm text-zinc-400">Projected Payout: </span>
              <span className="text-lg font-bold text-indigo-400">
                ${projectedPayout.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Validation */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Review step */}
      {submit.state === "reviewing" && legs.length >= 2 && (
        <div className="space-y-2 rounded-xl border border-indigo-600/30 bg-indigo-950/20 p-3">
          <h4 className="text-sm font-semibold text-white">Confirm Acca</h4>
          <div className="space-y-1 text-sm text-zinc-300">
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
      {submit.error && <p className="text-sm text-red-400">{submit.error}</p>}

      {/* Submit / Login buttons */}
      <div className="space-y-2">
        {submit.state === "reviewing" ? (
          <button
            onClick={submit.confirm}
            className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Confirm & Submit
          </button>
        ) : submit.state === "submitting" ? null : (
          <>
            {!authenticated ? (
              <button
                onClick={login}
                className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Sign In to Place Acca
              </button>
            ) : (
              <button
                onClick={submit.startReview}
                disabled={!isValid}
                className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                Review Acca
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
