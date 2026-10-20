import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { visibleWorkspaces } from "@/lib/authz/workspaces";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  const identity = await readIdentityAndMemberships();

  if (!identity) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Accesso non verificato." }, requestId },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { data: { workspaces: visibleWorkspaces(identity.workspaces) }, meta: { requestId } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
