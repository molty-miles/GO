import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { withdrawUSDC } from "@/lib/contract";

export type WithdrawalState = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function useWithdrawal() {
  const { wallets } = useWallets();
  const [state, setState] = useState<WithdrawalState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withdraw = useCallback(
    async (amountUsdc: number) => {
      setState("pending");
      setError(null);
      setTxHash(null);

      try {
        const activeWallet = wallets[0];
        if (!activeWallet) {
          throw new Error("No wallet connected. Please log in.");
        }

        const provider = await activeWallet.getEthereumProvider();

        const hash = await withdrawUSDC(amountUsdc, provider);
        setTxHash(hash);
        setState("confirmed");
      } catch (err) {
        console.error("Withdrawal failed:", err);
        setError(err instanceof Error ? err.message : "Withdrawal failed");
        setState("failed");
      }
    },
    [wallets],
  );

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return { state, txHash, error, withdraw, reset };
}
