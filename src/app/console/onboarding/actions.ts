"use server";

import { redirect } from "next/navigation";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeAgencyName, normalizeItalianVat } from "@/lib/registration";

export async function activateAgencyFree(formData: FormData) {
  const identity = await readIdentityAndMemberships();
  if (!identity) redirect("/accedi");
  if (identity.workspaces.agencyCount > 0) redirect("/console/agenzia");
  if (formData.get("accept_terms") !== "on") redirect("/console/onboarding?errore=consenso");

  const name = formData.get("company");
  const vat = formData.get("vat");
  const terms = formData.get("terms_version");
  const privacy = formData.get("privacy_version");
  if (typeof name !== "string" || typeof vat !== "string" ||
      typeof terms !== "string" || typeof privacy !== "string") {
    redirect("/console/onboarding?errore=dati");
  }
  const legalName = normalizeAgencyName(name);
  const vatNumber = normalizeItalianVat(vat);
  if (!legalName || !vatNumber) redirect("/console/onboarding?errore=dati");

  const client = await createServerSupabaseClient();
  const { data, error } = await client.from("agency_legal_documents")
    .select("kind,version").eq("active", true);
  if (error || !data || data.length !== 2 ||
      !data.some(d => d.kind === "B2B_TERMS" && d.version === terms) ||
      !data.some(d => d.kind === "PRIVACY_NOTICE" && d.version === privacy)) {
    redirect("/console/onboarding?errore=documenti");
  }
  const result = await client.rpc("complete_agency_registration", {
    p_legal_name: legalName,
    p_vat_number: vatNumber,
    p_terms_version: terms,
    p_privacy_version: privacy,
  });
  if (result.error) redirect("/console/onboarding?errore=registrazione");
  redirect("/console/agenzia");
}
