export interface CombinedOdds {
  venue: string;
  odds: number;
  weight: number;
}

export interface HedgeStake {
  legIndex: number;
  amount: number;
}

export interface OverroundFactor {
  legCount: number;
  factor: number;
}
