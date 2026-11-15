import { type NextRequest, NextResponse } from "next/server";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Handles PKCE code or token_hash verification; never trusts a redirect URL. */
export async function GET(request: NextRequest) {
  const deny = () => {
    const response = NextResponse.redirect(new URL("/accedi?errore=verifica", request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  if (!hasPublicSupabaseConfiguration()) return deny();

  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return deny();
  } else if (token_hash && type === "email") {
    const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash });
    if (error) return deny();
  } else {
    return deny();
  }

  // Only invitation routes with a verified opaque token are safe return targets.
  const next = request.nextUrl.searchParams.get("next")??"";
  const safe = /^\\/invito-(titolare|famiglia)\\/[a-f0-9]{64}$/.test(next)?next:"/console";
  const response = NextResponse.redirect(new URL(safe, request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
