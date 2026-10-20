import "server-only";
import { redirect } from "next/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Identity only. Never interpret this as role or tenant authorization. */
export async function requireAuthenticatedIdentity() {
  if (!hasPublicSupabaseConfiguration()) redirect("/accedi?errore=configurazione");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/accedi");
  return data.claims.sub;
}
