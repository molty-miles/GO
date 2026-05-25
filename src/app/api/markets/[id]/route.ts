import { NextRequest, NextResponse } from "next/server";
import { getCachedMarkets } from "@/lib/aggregation/cache";
import { refreshAllVenues } from "@/lib/aggregation/service";
import { rateLimit } from "@/lib/aggregation/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(ip, 100, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { id } = await params;

  let all = getCachedMarkets("all");
  if (!all || all.length === 0) {
    all = await refreshAllVenues();
  }

  const market = all.find((m) => m.id === id);
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  return NextResponse.json(market);
}
