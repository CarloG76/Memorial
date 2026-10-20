import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfiguration } from "@/lib/env";

export async function createServerSupabaseClient() {
  const { url, key } = getPublicSupabaseConfiguration();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components are read-only; proxy.ts handles refresh cookies.
        }
      },
    },
  });
}
