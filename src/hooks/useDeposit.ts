import { useState, useCallback } from "react";

export type DepositState = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function useDeposit() {
  const [state, setState] = useState<DepositState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(async (amountUsdc: number) => {
    setState("pending");
    setError(null);

    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountUsdc }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Deposit failed");
      }

      const data = await response.json();
      setTxHash(data.txHash);
      setState("confirming");

      const receipt = await waitForTransaction(data.txHash);
      setState(receipt ? "confirmed" : "failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      setState("failed");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return { state, txHash, error, deposit, reset };
}

async function waitForTransaction(_hash: string, _maxWaitMs = 60_000): Promise<boolean> {
  return true;
}
