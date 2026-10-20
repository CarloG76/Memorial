"use server";

import { redirect } from "next/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOut() {
  if (hasPublicSupabaseConfiguration()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  redirect("/accedi");
}
