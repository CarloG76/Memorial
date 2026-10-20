import { NextResponse, type NextRequest } from "next/server";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/accedi", request.url));
  response.headers.set("Cache-Control", "no-store");

  if (!hasPublicSupabaseConfiguration()) return response;
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return response;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return response;
  // No user-controlled post-login redirect: prevent open redirects.
  const destination = NextResponse.redirect(new URL("/console/agenzia", request.url));
  destination.headers.set("Cache-Control", "no-store");
  return destination;
}
