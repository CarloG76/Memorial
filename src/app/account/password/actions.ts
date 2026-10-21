"use server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseConfiguration } from "@/lib/env";

export async function changeOwnPassword(formData: FormData) {
  if (!hasPublicSupabaseConfiguration()) redirect("/accedi");
  const candidate=formData.get("new_password");
  const confirmation=formData.get("confirm_password");
  if (typeof candidate!=="string" || candidate.length<12 ||
      candidate.length>128 || candidate!==confirmation) {
    redirect("/account/password?errore=validazione");
  }
  const db=await createServerSupabaseClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error || !user)redirect("/accedi");
  const response=await db.auth.updateUser({password:candidate});
  if(response.error)redirect("/account/password?errore=aggiornamento");
  redirect("/account/password?esito=ok");
}
