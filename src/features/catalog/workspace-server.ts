import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAgencyDashboard(userId: string) {
  const db = await createServerSupabaseClient();
  const memberships=await db.from("agency_members")
    .select("agency_id,role,active").eq("user_id",userId).eq("active",true);
  if(memberships.error) throw new Error("Accesso agenzia non disponibile.");
  const ids=(memberships.data??[]).map(m=>m.agency_id);
  if(!ids.length) return { agencies:[],memorials:[],membership:[] };
  const [agencies, memorials]=await Promise.all([
    db.from("agencies").select("id,legal_name,city,status,plan,is_demo").in("id",ids).order("legal_name"),
    db.from("memorials").select("id,agency_id,deceased_name,demo_code,status,tier,is_demo").in("agency_id",ids).order("created_at",{ascending:false})
  ]);
  if(agencies.error||memorials.error) throw new Error("Impossibile caricare i dati agenzia.");
  const allowed=new Set(ids);
  return {agencies:(agencies.data??[]).filter(a=>allowed.has(a.id)),
    memorials:(memorials.data??[]).filter(m=>allowed.has(m.agency_id)),
    membership:memberships.data??[]};
}

export async function getFamilyDashboard(userId: string) {
  const db=await createServerSupabaseClient();
  const memberships=await db.from("family_members").select("memorial_id,role,can_moderate,can_edit_content,can_view_contacts,active")
    .eq("user_id",userId).eq("active",true);
  if(memberships.error) throw new Error("Accesso famiglia non disponibile.");
  const ids=(memberships.data??[]).map(x=>x.memorial_id);
  if(!ids.length)return {memorials:[],memberships:[]};
  const result=await db.from("memorials")
    .select("id,deceased_name,status,tier,is_demo,agency_id,visibility").in("id",ids);
  if(result.error)throw new Error("Impossibile caricare i memoriali della famiglia.");
  const allowed=new Set(ids);
  return {memorials:(result.data??[]).filter(m=>allowed.has(m.id)),memberships:memberships.data??[]};
}
