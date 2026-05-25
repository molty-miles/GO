export interface UnifiedMarket {
  id: string;
  venue: string;
  slug: string;
  question: string;
  category: string[];
  tags: string[];
  c_yes: number;
  volume: number;
  liquidity: number;
  resolution_date: string;
  active: boolean;
  end_time: string;
  link: string;
  isBestOdds?: boolean;
}
