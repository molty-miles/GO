import { useState, useCallback } from "react";

export type WithdrawalState = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function useWithdrawal() {
  const [state, setState] = useState<WithdrawalState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withdraw = useCallback(async (amountUsdc: number) => {
    setState("pending");
    setError(null);

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountUsdc }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Withdrawal failed");
      }

      const data = await response.json();
      setTxHash(data.txHash);
      setState("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setState("failed");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return { state, txHash, error, withdraw, reset };
}
