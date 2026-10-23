"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readIdentityAndMemberships } from "@/lib/authz/server";

export async function setCatalogDemoFilter(formData: FormData) {
  const identity=await readIdentityAndMemberships();
  if(!identity) redirect("/accedi");
  if(!identity.workspaces.platformRoles.includes("OWNER")) redirect("/console?errore=non-autorizzato");
  const raw=formData.get("demo");
  if(raw!=="ALL" && raw!=="ONLY_DEMO" && raw!=="NO_DEMO") throw new Error("Filtro non valido");
  const db=await createServerSupabaseClient();
  const {error}=await db.from("profiles").update({catalog_demo_filter:raw}).eq("user_id",identity.userId);
  if(error) throw new Error("Preferenza non salvata");
  revalidatePath("/console/piattaforma");
  const view=formData.get("sezione");
  redirect(`/console/piattaforma?sezione=${view==="agenzie"||view==="memoriali"?view:"dashboard"}`);
}
