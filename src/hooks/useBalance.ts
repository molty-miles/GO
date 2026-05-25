import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
const USDC_DECIMALS = 6;

export interface BalanceState {
  available: number;
  deployedCapital: number;
  pendingWinnings: number;
  isLoading: boolean;
  error: string | null;
}

export function useBalance() {
  const { address } = useUser();
  const [state, setState] = useState<BalanceState>({
    available: 0,
    deployedCapital: 0,
    pendingWinnings: 0,
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setState((s) => ({ ...s, available: 0, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/balance?address=${address}`);
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      setState({
        available: data.available / 10 ** USDC_DECIMALS,
        deployedCapital: data.deployedCapital / 10 ** USDC_DECIMALS,
        pendingWinnings: data.pendingWinnings / 10 ** USDC_DECIMALS,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Balance fetch failed",
      }));
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { ...state, refetch: fetchBalance };
}
