import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids") ?? "";

  if (!ids) {
    return NextResponse.json({ events: [] });
  }

  return NextResponse.json({ events: [] });
}
