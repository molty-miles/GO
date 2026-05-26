import { useState, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useAccaBuilderContext } from "@/lib/providers/AccaBuilderProvider";
import { buildLegRequest, createAcca } from "@/lib/contract";
import { useUser } from "@/hooks/useUser";

export type SubmitState =
  | "idle"
  | "reviewing"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "failed";

export function useSubmitAcca() {
  const { wallets } = useWallets();
  const { address } = useUser();
  const ctx = useAccaBuilderContext();
  const [state, setState] = useState<SubmitState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startReview = useCallback(() => setState("reviewing"), []);

  const confirm = useCallback(async () => {
    setState("submitting");
    setError(null);

    try {
      const activeWallet = wallets[0];
      if (!activeWallet) throw new Error("No wallet connected");
      if (!address) throw new Error("User address not available");

      const provider = await activeWallet.getEthereumProvider();

      // Build on-chain leg requests from the context legs
      const legRequests = ctx.legs.map((leg) => {
        // Convert marketId to bytes32 hex for the contract
        const cleanId = leg.marketId.replace("0x", "");
        const paddedId = cleanId.padStart(64, "0").slice(0, 64);
        const venueMarketId = ("0x" + paddedId) as `0x${string}`;

        return buildLegRequest(leg.venue, venueMarketId, leg.selectedOutcome, leg.odds);
      });

      // Default 1-hour expiry from now
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      const { txHash: hash } = await createAcca(
        legRequests,
        ctx.stake,
        ctx.combinedOdds,
        expiresAt,
        provider,
      );

      setTxHash(hash);
      setState("confirmed");
      ctx.clearAll();
    } catch (err) {
      console.error("Acca submission failed:", err);
      setError(err instanceof Error ? err.message : "Submission failed");
      setState("failed");
    }
  }, [wallets, address, ctx]);

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return { state, txHash, error, startReview, confirm, reset };
}
