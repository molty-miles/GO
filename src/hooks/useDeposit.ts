import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { depositUSDC } from "@/lib/contract";

export type DepositState = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function useDeposit() {
  const { wallets } = useWallets();
  const [state, setState] = useState<DepositState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(
    async (amountUsdc: number) => {
      setState("pending");
      setError(null);
      setTxHash(null);

      try {
        // Get the active Privy wallet provider (embedded or external)
        const activeWallet = wallets[0];
        if (!activeWallet) {
          throw new Error("No wallet connected. Please log in.");
        }

        const provider = await activeWallet.getEthereumProvider();

        const hash = await depositUSDC(amountUsdc, provider);
        setTxHash(hash);
        setState("confirming");

        // For now we optimistically mark confirmed after submission.
        // In a future iteration we can poll publicClient for receipt.
        setState("confirmed");
      } catch (err) {
        console.error("Deposit failed:", err);
        setError(err instanceof Error ? err.message : "Deposit failed");
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

  return { state, txHash, error, deposit, reset };
}
