import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      txHash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")}`,
      accaId: `0x${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")}`,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
