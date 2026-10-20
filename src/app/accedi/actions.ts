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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/accedi?errore=accesso");
  redirect("/console");
}
