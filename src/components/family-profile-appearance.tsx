import {getFamilyDashboard} from "@/features/catalog/workspace-server";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {FamilyBackgroundEditor,type FamilyHeroMemorial,type FamilyBackgroundOption} from "./family-background-editor";
import type {MemorialBackgroundPreset} from "@/lib/memorial-backgrounds";
function preset(v:unknown):MemorialBackgroundPreset {
 return typeof v==="string" ? v as MemorialBackgroundPreset : "montagna";
}
export async function FamilyProfileAppearance({userId}:{userId:string}) {
 const {memorials,memberships}=await getFamilyDashboard(userId);
 const db=await createServerSupabaseClient();
 const ids=memorials.map(m=>m.id);
 const [visualResult,portraitResult,presetResult]=await Promise.all([
  ids.length ? db.from("memorial_visual_settings").select("memorial_id,draft_preset,published_preset").in("memorial_id",ids) : Promise.resolve({data:[],error:null}),
  ids.length ? db.from("memorial_public_demo_profiles").select("memorial_id,portrait_url").in("memorial_id",ids) : Promise.resolve({data:[],error:null}),
  db.from("memorial_background_presets").select("id,label,image_url").eq("active",true).order("sort_order")
 ]);
 if(visualResult.error||portraitResult.error||presetResult.error)throw new Error("Impossibile caricare le preferenze.");
 const data=visualResult.data;
 const portraitById=new Map((portraitResult.data??[]).map(x=>[x.memorial_id,x.portrait_url]));
 const presets:FamilyBackgroundOption[]=(presetResult.data??[]).map(x=>({id:x.id as MemorialBackgroundPreset,label:x.label,image_url:x.image_url}));
 const configs=new Map((data??[]).map(c=>[c.memorial_id,c]));
 const roles=new Map(memberships.map(r=>[r.memorial_id,r]));
 const items:FamilyHeroMemorial[]=memorials.map(m=>{
  const settings=configs.get(m.id);
  const role=roles.get(m.id);
  return {
   id:m.id,name:m.deceased_name??"Memoriale senza nome",tier:m.tier??"STANDARD",status:m.status,
   draft:preset(settings?.draft_preset),published:preset(settings?.published_preset),
   canEdit:!!role?.active&&(role.role==="OWNER"||(role.role==="EDITOR"&&role.can_edit_content)),
   canPublish:!!role?.active&&role.role==="OWNER",
   portraitUrl:portraitById.get(m.id)??null
  };
 });
 return <FamilyBackgroundEditor memorials={items} presets={presets}/>;
}
