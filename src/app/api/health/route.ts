import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { data: { status: "ok", service: "memorial" } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
