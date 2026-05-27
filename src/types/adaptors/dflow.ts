import { z } from "zod";

export const DflowMarketSchema = z.object({
  ticker: z.string(),
  eventTicker: z.string(),
  marketType: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  yesSubTitle: z.string().optional(),
  noSubTitle: z.string().optional(),
  openTime: z.number(),
  closeTime: z.number(),
  expirationTime: z.number(),
  status: z.string(),
  volume: z.number(),
  result: z.string().nullable().optional(),
  openInterest: z.number(),
  fractionalTradingEnabled: z.boolean().optional(),
  canCloseEarly: z.boolean().optional(),
  earlyCloseCondition: z.string().optional(),
  rulesPrimary: z.string().optional(),
  rulesSecondary: z.string().optional(),
  yesBid: z.number().nullable().optional(),
  yesAsk: z.number().nullable().optional(),
  noBid: z.number().nullable().optional(),
  noAsk: z.number().nullable().optional(),
  accounts: z.record(
    z.string(),
    z.object({
      marketLedger: z.string(),
      yesMint: z.string(),
      noMint: z.string(),
      isInitialized: z.boolean(),
      redemptionStatus: z.string().nullable().optional(),
      scalarOutcomePct: z.number().nullable().optional(),
    }),
  ),
});
export type DflowMarket = z.infer<typeof DflowMarketSchema>;

export const DflowMarketsResponseSchema = z.object({
  markets: z.array(DflowMarketSchema),
  cursor: z.number(),
});

export const DflowEventSchema = z.object({
  ticker: z.string(),
  seriesTicker: z.string(),
  strikeDate: z.number().nullable().optional(),
  strikePeriod: z.string().nullable().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  competition: z.string().optional(),
  competitionScope: z.string().optional(),
  settlementSources: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
  volume: z.number(),
  volume24h: z.number().optional(),
  liquidity: z.number(),
  openInterest: z.number(),
  volumeFp: z.string().optional(),
  volume24hFp: z.string().optional(),
  openInterestFp: z.string().optional(),
});
export type DflowEvent = z.infer<typeof DflowEventSchema>;

export const DflowEventsResponseSchema = z.object({
  events: z.array(DflowEventSchema),
  cursor: z.number(),
});

export const DflowTagsByCategoriesSchema = z.record(z.string(), z.array(z.string()).nullable());
