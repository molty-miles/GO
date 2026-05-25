import { useState, useEffect } from "react";
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

const MOCK_ACCAS: AccaPosition[] = [
  {
    id: "0x1234...abcd",
    legs: [
      {
        marketId: "1",
        venue: "polymarket",
        question: "Will BTC > $100k by June?",
        selectedOutcome: "Yes",
        odds: 0.6,
        state: "PENDING",
      },
      {
        marketId: "2",
        venue: "limitless",
        question: "Will ETH > $5k by July?",
        selectedOutcome: "Yes",
        odds: 0.55,
        state: "PENDING",
      },
    ],
    stake: 100,
    combinedOdds: 0.1485,
    projectedPayout: 673,
    status: "OPEN",
    createdAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "0x5678...ef01",
    legs: [
      {
        marketId: "3",
        venue: "polymarket",
        question: "Will the Fed cut rates in May?",
        selectedOutcome: "No",
        odds: 0.7,
        state: "WON",
      },
      {
        marketId: "4",
        venue: "kalshi",
        question: "US jobs report > 200k?",
        selectedOutcome: "Yes",
        odds: 0.65,
        state: "WON",
      },
      {
        marketId: "5",
        venue: "polymarket",
        question: "S&P 500 above 5500?",
        selectedOutcome: "Yes",
        odds: 0.55,
        state: "WON",
      },
    ],
    stake: 50,
    combinedOdds: 0.075,
    projectedPayout: 667,
    status: "WON",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "0x9012...3456",
    legs: [
      {
        marketId: "6",
        venue: "kalshi",
        question: "Trump wins 2024?",
        selectedOutcome: "Yes",
        odds: 0.4,
        state: "LOST",
      },
    ],
    stake: 25,
    combinedOdds: 0.15,
    projectedPayout: 0,
    status: "LOST",
    createdAt: "2026-04-20T14:00:00Z",
  },
];

async function fetchAccasData(): Promise<AccaPosition[]> {
  try {
    const response = await fetch("/api/acca");
    if (response.ok) {
      return await response.json();
    }
  } catch {
    /* fall through */
  }
  return MOCK_ACCAS;
}

export function useAccas() {
  const [accas, setAccas] = useState<AccaPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetchAccasData().then((data) => {
      if (!cancelled) {
        setAccas(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
