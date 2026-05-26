import { NextRequest, NextResponse } from "next/server";
import { getUserAccasServer } from "@/lib/contract/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json([]);
  }

  try {
    const accas = await getUserAccasServer(address as `0x${string}`);
    return NextResponse.json(accas);
  } catch (err) {
    console.error("Acca GET error:", err);
    return NextResponse.json({ error: "Failed to fetch accas" }, { status: 502 });
  }
}

// DEPRECATED: writes now happen client-side via Privy + viem
export async function POST() {
  return NextResponse.json(
    { error: "Use client-side wallet to submit accas directly" },
    { status: 410 },
  );
}
