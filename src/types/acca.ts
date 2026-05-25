export type LegState = "PENDING" | "WON" | "LOST";

export interface Leg {
  marketId: string;
  venue: string;
  question: string;
  selectedOutcome: string;
  odds: number;
  state: LegState;
}

export type AccaStatus = "OPEN" | "WON" | "LOST";

export interface AccaSlip {
  id: string;
  legs: Leg[];
  stake: number;
  combinedOdds: number;
  projectedPayout: number;
  userAddress: string;
  status: AccaStatus;
}
