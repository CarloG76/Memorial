"use server";

import { redirect } from "next/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  if (!hasPublicSupabaseConfiguration()) redirect("/accedi?errore=configurazione");

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || !email.includes("@") ||
      typeof password !== "string" || !password) {
    redirect("/accedi?errore=accesso");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/accedi?errore=accesso");

  // Unverified accounts are never allowed into a membership-bound workspace.
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect("/accedi?errore=verifica");
  }

  redirect("/console");
}
