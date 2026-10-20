import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfiguration, hasPublicSupabaseConfiguration } from "@/lib/env";

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasPublicSupabaseConfiguration()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, key } = getPublicSupabaseConfiguration();
  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        if (headers) {
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        }
      },
    },
  });

  // Signed claims: never use getSession() as server-side authority.
  await client.auth.getClaims();
  return response;
}
