"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import {
  canStartAgencySignup, normalizeAgencyName, normalizeEmail, normalizeItalianVat,
} from "@/lib/registration";

/**
 * Step 1 of WF01 only: creates personal Auth credentials, not a B2B agency.
 * The business registration stays pending until verified email, approved
 * conditions, audited database provisioning and RLS checks are available.
 */
export async function registerAgencyCredentials(formData: FormData) {
  if (!canStartAgencySignup() || !hasPublicSupabaseConfiguration()) {
    redirect("/registrati?errore=non-disponibile");
  }
  const company = formData.get("company");
  const vat = formData.get("vat");
  const emailRaw = formData.get("email");
  const password = formData.get("password");

  if (typeof company !== "string" || typeof vat !== "string" ||
      typeof emailRaw !== "string" || typeof password !== "string") {
    redirect("/registrati?errore=dati");
  }

  const legalName = normalizeAgencyName(company);
  const vatNumber = normalizeItalianVat(vat);
  const email = normalizeEmail(emailRaw);
  if (!legalName || !vatNumber || !email ||
      password.length < 12 || password.length > 128) {
    redirect("/registrati?errore=dati");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "https://memorial-ai-visions.vercel.app/auth/confirm",
      // Metadata is a NON-TRUSTED DRAFT, never an authoritative agency record.
      data: {
        registration_intent: "AGENCY",
        draft_agency_name: legalName,
        draft_agency_vat: vatNumber,
      },
    },
  });

  // When email confirmation is off, signUp can issue a session immediately.
  // Do not grant access prior to the explicit verification/contract workflow.
  await supabase.auth.signOut();
  if (error) {
    // Generic message: never confirm if an email or VAT already exists.
    redirect("/registrati?errore=generico");
  }
  redirect("/registrati/esito");
}
