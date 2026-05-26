"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useBalance } from "@/hooks/useBalance";
import { useDeposit } from "@/hooks/useDeposit";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { formatUsdc } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { fetchUserHistory, type HistoryItem } from "@/lib/contract/history";

export function AccountScreen() {
  const { authenticated, address, login, exportWallet } = useUser();
  const { available, deployedCapital, pendingWinnings, refetch: refetchBalance } = useBalance();
  const { state: depositState, error: depositError, deposit } = useDeposit();
  const { state: withdrawState, error: withdrawError, withdraw } = useWithdrawal();
  const [tab, setTab] = useState<"history" | "deposit" | "withdraw">("history");
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!address || tab !== "history") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryLoading(true);
    fetchUserHistory(address as `0x${string}`)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setHistoryLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, tab]);

  if (!authenticated) {
    return (
      <EmptyState
        title="Connect your wallet"
        description="Sign in to manage your account"
        action={{ label: "Sign In", onClick: login }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 text-lg font-semibold">Balance</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Available</div>
            <div className="text-xl font-bold">{formatUsdc(available)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deployed</div>
            <div className="text-xl font-bold text-amber-500">{formatUsdc(deployedCapital)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Winnings</div>
            <div className="text-xl font-bold text-emerald-500">{formatUsdc(pendingWinnings)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["history", "deposit", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "history" && (
        <div className="space-y-2">
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No activity yet
            </div>
          ) : (
            history.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.type === "deposit" || item.type === "acca_settled"
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {item.type === "deposit"
                      ? `+${item.amount.toFixed(2)}`
                      : item.type === "withdraw"
                        ? `-${item.amount.toFixed(2)}`
                        : item.type === "acca_created"
                          ? `${item.amount.toFixed(2)} stake`
                          : `+${item.amount.toFixed(2)} payout`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.type === "deposit"
                      ? "Deposit"
                      : item.type === "withdraw"
                        ? "Withdraw"
                        : item.type === "acca_created"
                          ? "Parlay"
                          : item.status === "WON"
                            ? "Won"
                            : item.status === "LOST"
                              ? "Lost"
                              : "Cancelled"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "deposit" && (
        <div className="rounded-xl border bg-card p-4">
          <label className="mb-2 block text-sm text-muted-foreground">Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mb-3 w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          {depositError && <p className="mb-2 text-sm text-destructive">{depositError}</p>}
          <button
            onClick={async () => {
              await deposit(Number(amount));
              setAmount("");
              refetchBalance();
            }}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              depositState === "pending" ||
              depositState === "confirming"
            }
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {depositState === "pending"
              ? "Approving..."
              : depositState === "confirming"
                ? "Depositing..."
                : depositState === "confirmed"
                  ? "Done ✓"
                  : depositState === "failed"
                    ? "Retry"
                    : "Deposit"}
          </button>
        </div>
      )}

      {tab === "withdraw" && (
        <div className="rounded-xl border bg-card p-4">
          <label className="mb-2 block text-sm text-muted-foreground">Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mb-3 w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          {withdrawError && <p className="mb-2 text-sm text-destructive">{withdrawError}</p>}
          <button
            onClick={async () => {
              await withdraw(Number(amount));
              setAmount("");
              refetchBalance();
            }}
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              withdrawState === "pending" ||
              withdrawState === "confirming"
            }
            className="w-full rounded-xl bg-destructive py-3 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {withdrawState === "pending"
              ? "Processing..."
              : withdrawState === "confirmed"
                ? "Done ✓"
                : withdrawState === "failed"
                  ? "Retry"
                  : "Withdraw"}
          </button>
        </div>
      )}

      {/* Wallet export */}
      {address && (
        <button
          onClick={exportWallet}
          className="w-full rounded-xl border py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Export Wallet
        </button>
      )}
    </div>
  );
}
