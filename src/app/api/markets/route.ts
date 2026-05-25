import { NextRequest, NextResponse } from "next/server";
import { getCachedMarkets } from "@/lib/aggregation/cache";
import { filterMarkets, sortMarkets, type DiscoveryQuery } from "@/lib/aggregation/discovery";
import { refreshAllVenues } from "@/lib/aggregation/service";
import { rateLimit } from "@/lib/aggregation/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining } = rateLimit(ip, 100, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const query: DiscoveryQuery = {
    q: searchParams.get("q") ?? undefined,
    venue: searchParams.get("venue") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    minVolume: searchParams.get("minVolume") ? Number(searchParams.get("minVolume")) : undefined,
    sort: (searchParams.get("sort") as DiscoveryQuery["sort"]) ?? undefined,
  };

  let all = getCachedMarkets("all");
  if (!all || all.length === 0) {
    all = await refreshAllVenues();
  }

  const filtered = filterMarkets(all, query);
  const sorted = query.sort ? sortMarkets(filtered, query.sort) : filtered;

  return NextResponse.json(sorted, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
