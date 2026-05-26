import { NextRequest, NextResponse } from "next/server";
import { getVaultBalanceServer } from "@/lib/contract/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address parameter is required" }, { status: 400 });
  }

  try {
    const vaultBalance = await getVaultBalanceServer(address as `0x${string}`);
    return NextResponse.json({
      available: vaultBalance.available * 1_000_000,
      deployedCapital: (vaultBalance.total - vaultBalance.available) * 1_000_000,
      pendingWinnings: 0,
    });
  } catch (err) {
    console.error("Balance route error:", err);
    return NextResponse.json({ error: "Failed to fetch on-chain balance" }, { status: 502 });
  }
}
