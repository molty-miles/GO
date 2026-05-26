import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { getVaultBalance, getUSDCBalance } from "@/lib/contract";

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
    isLoading: true,
    error: null,
  });
  const mounted = useRef(true);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      if (mounted.current) setState((s) => ({ ...s, available: 0, isLoading: false }));
      return;
    }

    if (mounted.current) setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const [vault, usdc] = await Promise.all([
        getVaultBalance(address as `0x${string}`),
        getUSDCBalance(address as `0x${string}`),
      ]);

      if (mounted.current) {
        setState({
          available: usdc,
          deployedCapital: vault.total - vault.available,
          pendingWinnings: 0,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      if (mounted.current) {
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
        } catch {
          setState((s) => ({
            ...s,
            isLoading: false,
            error: "Balance fetch failed on all paths",
          }));
        }
      }
    }
  }, [address]);

  useEffect(() => {
    mounted.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBalance();
    return () => {
      mounted.current = false;
    };
  }, [fetchBalance]);

  return { ...state, refetch: fetchBalance };
}
