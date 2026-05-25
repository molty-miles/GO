import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address parameter is required" }, { status: 400 });
  }

  const balance = {
    available: 0,
    deployedCapital: 0,
    pendingWinnings: 0,
  };

  return NextResponse.json(balance);
}
