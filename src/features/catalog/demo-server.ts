import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AgencyCatalogRow = {
  id: string;
  demo_code: string;
  legal_name: string;
  city: string | null;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  plan: "FREE" | "PRO";
  is_demo: boolean;
};

export type MemorialCatalogRow = {
  id: string;
  demo_code: string;
  agency_id: string;
  deceased_name: string;
  tier: "STANDARD" | "PREMIUM";
  status: string;
  visibility: "UNLISTED" | "PUBLIC";
  is_demo: boolean;
};

/** Always reads through the signed-in user's RLS-scoped Supabase client. */
export async function getDemoCatalog(userId: string) {
  const supabase = await createServerSupabaseClient();
  const [agenciesResponse, memorialsResponse, preferenceResponse] = await Promise.all([
    supabase
      .from("agencies")
      .select("id,demo_code,legal_name,city,status,plan,is_demo")
      .order("legal_name"),
    supabase
      .from("memorials")
      .select("id,demo_code,agency_id,deceased_name,tier,status,visibility,is_demo")
      .order("created_at", {ascending:false}),
    supabase.from("profiles").select("catalog_demo_filter").eq("user_id",userId).single(),
  ]);

  if (agenciesResponse.error || memorialsResponse.error || preferenceResponse.error) {
    // Never silently present denied/failed queries as empty data.
    throw new Error("Impossibile leggere il catalogo demo autorizzato.");
  }

  return {
    preference: (preferenceResponse.data?.catalog_demo_filter ?? "ALL") as "ALL" | "ONLY_DEMO" | "NO_DEMO",
    agencies: (agenciesResponse.data ?? []) as AgencyCatalogRow[],
    memorials: (memorialsResponse.data ?? []) as MemorialCatalogRow[],
  };
}
