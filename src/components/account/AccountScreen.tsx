"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useBalance } from "@/hooks/useBalance";
import { useDeposit } from "@/hooks/useDeposit";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { formatUsdc } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const historyMock = [
  { type: "deposit", amount: 500, date: "2026-05-10", txHash: "0xabcd" },
  { type: "deposit", amount: 200, date: "2026-05-08", txHash: "0xef01" },
  { type: "withdrawal", amount: 50, date: "2026-05-05", txHash: "0x2345" },
];

export function AccountScreen() {
  const { authenticated, address, login, exportWallet } = useUser();
  const { available, deployedCapital, pendingWinnings, refetch: refetchBalance } = useBalance();
  const { state: depositState, error: depositError, deposit } = useDeposit();
  const { state: withdrawState, error: withdrawError, withdraw } = useWithdrawal();
  const [tab, setTab] = useState<"history" | "deposit" | "withdraw">("history");
  const [amount, setAmount] = useState("");

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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 text-lg font-semibold text-white">Balance</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-zinc-500">Available</div>
            <div className="text-xl font-bold text-white">{formatUsdc(available)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Deployed</div>
            <div className="text-xl font-bold text-yellow-400">{formatUsdc(deployedCapital)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Winnings</div>
            <div className="text-xl font-bold text-green-400">{formatUsdc(pendingWinnings)}</div>
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
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "history" && (
        <div className="space-y-2">
          {historyMock.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-medium",
                    h.type === "deposit" ? "text-green-400" : "text-red-400",
                  )}
                >
                  {h.type === "deposit" ? "+" : "-"}${h.amount}
                </span>
                <span className="text-xs text-zinc-500">{h.date}</span>
              </div>
              <span className="font-mono text-xs text-zinc-600">{h.txHash.slice(0, 10)}...</span>
            </div>
          ))}
        </div>
      )}

      {tab === "deposit" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <label className="mb-2 block text-sm text-zinc-400">Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-lg text-white outline-none placeholder-zinc-600 focus:border-indigo-500"
          />
          {depositError && <p className="mb-2 text-sm text-red-400">{depositError}</p>}
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
            className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <label className="mb-2 block text-sm text-zinc-400">Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-lg text-white outline-none placeholder-zinc-600 focus:border-indigo-500"
          />
          {withdrawError && <p className="mb-2 text-sm text-red-400">{withdrawError}</p>}
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
            className="w-full rounded-xl bg-red-600 py-3 font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
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
          className="w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900"
        >
          Export Wallet
        </button>
      )}
    </div>
  );
}
