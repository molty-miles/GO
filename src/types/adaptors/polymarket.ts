import { z } from "zod";

export const GammaMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
  conditionId: z.string().optional(),
  slug: z.string(),
  outcomes: z.string(),
  outcomePrices: z.string(),
  volume: z.string(),
  liquidity: z.string(),
  active: z.boolean(),
  closed: z.boolean().optional(),
  endDate: z.string(),
  image: z.string().optional(),
  clobTokenIds: z.string().optional(),
});
export type GammaMarket = z.infer<typeof GammaMarketSchema>;

export const GammaEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean(),
  closed: z.boolean().optional(),
  archived: z.boolean().optional(),
  liquidity: z.number(),
  volume: z.number(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  image: z.string().optional(),
  markets: z.array(GammaMarketSchema),
  tags: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
});
export type GammaEvent = z.infer<typeof GammaEventSchema>;

export const GammaEventsResponseSchema = z.array(GammaEventSchema);

export const GammaMarketResponseSchema = z.array(GammaMarketSchema);
