import { useState, useEffect, useCallback } from "react";
import type { LegState } from "@/types/acca";

interface SettlementEvent {
  accaId: string;
  marketId: string;
  newState: LegState;
  timestamp: string;
}

export function useSettlement(accaIds: string[]) {
  const [events, setEvents] = useState<SettlementEvent[]>([]);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/settlement?ids=${accaIds.join(",")}`);
      if (response.ok) {
        const data = await response.json();
        if (data.events) {
          setEvents(data.events);
        }
      }
    } catch {
      /* silent */
    }
  }, [accaIds]);

  useEffect(() => {
    if (accaIds.length === 0) return;
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [accaIds, poll]);

  return { events, poll };
}
