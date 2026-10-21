import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AgencyCatalogRow = {
  id: string;
  demo_code: string;
  legal_name: string;
  city: string | null;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  plan: "FREE" | "PRO";
  is_demo: true;
};

export type MemorialCatalogRow = {
  id: string;
  demo_code: string;
  agency_id: string;
  deceased_name: string;
  tier: "STANDARD" | "PREMIUM";
  status: string;
  visibility: "UNLISTED" | "PUBLIC";
  is_demo: true;
};

/** Always reads through the signed-in user's RLS-scoped Supabase client. */
export async function getDemoCatalog() {
  const supabase = await createServerSupabaseClient();
  const [agenciesResponse, memorialsResponse] = await Promise.all([
    supabase
      .from("agencies")
      .select("id,demo_code,legal_name,city,status,plan,is_demo")
      .eq("is_demo", true)
      .order("demo_code"),
    supabase
      .from("memorials")
      .select("id,demo_code,agency_id,deceased_name,tier,status,visibility,is_demo")
      .eq("is_demo", true)
      .order("demo_code"),
  ]);

  if (agenciesResponse.error || memorialsResponse.error) {
    // Never silently present denied/failed queries as empty data.
    throw new Error("Impossibile leggere il catalogo demo autorizzato.");
  }

  return {
    agencies: (agenciesResponse.data ?? []) as AgencyCatalogRow[],
    memorials: (memorialsResponse.data ?? []) as MemorialCatalogRow[],
  };
}
