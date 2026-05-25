export type VenueId = "polymarket" | "kalshi" | "limitless";

export interface VenueDataAdapter {
  venueId: VenueId;
  requiresRelayer: boolean;
}
