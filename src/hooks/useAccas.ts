import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import type { Leg, AccaStatus } from "@/types/acca";
export interface AccaPosition {
  id: string;
  legs: Leg[];
  stake: number;
  combinedOdds: number;
  projectedPayout: number;
  status: AccaStatus;
  createdAt: string;
}

export function useAccas() {
  const { address } = useUser();
  const [accas, setAccas] = useState<AccaPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccasData = useCallback(async (): Promise<AccaPosition[]> => {
    if (!address) return [];

    try {
      const response = await fetch(`/api/acca?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        // Map server response shape to AccaPosition if needed
        if (Array.isArray(data) && data.length > 0 && "accaId" in data[0]) {
          return data.map(
            (a: {
              accaId: string;
              stake: number;
              combinedOdds?: string;
              potentialPayout: number;
              status?: string;
              expiresAt: number;
            }) => ({
              id: a.accaId,
              legs: [],
              stake: a.stake,
              combinedOdds: Number(a.combinedOdds ?? 1) / 1e18,
              projectedPayout: a.potentialPayout,
              status: (a.status ?? "OPEN") as AccaStatus,
              createdAt: new Date((a.expiresAt - 3600) * 1000).toISOString(),
            }),
          );
        }
        return data;
      }
    } catch {
      /* fall through */
    }
    return [];
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    fetchAccasData().then((data) => {
      if (!cancelled) {
        setAccas(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAccasData]);

  const activeAccas = accas.filter((a) => a.status === "OPEN");
  const wonAccas = accas.filter((a) => a.status === "WON");
  const lostAccas = accas.filter((a) => a.status === "LOST");

  return {
    accas,
    activeAccas,
    wonAccas,
    lostAccas,
    isLoading,
    refetch: () => fetchAccasData().then(setAccas),
  };
}
