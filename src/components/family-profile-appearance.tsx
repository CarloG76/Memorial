import {getFamilyDashboard} from "@/features/catalog/workspace-server";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {FamilyBackgroundEditor,type FamilyHeroMemorial} from "./family-background-editor";
import {MEMORIAL_BACKGROUNDS,type MemorialBackgroundPreset} from "@/lib/memorial-backgrounds";
function preset(v:unknown):MemorialBackgroundPreset {
 return MEMORIAL_BACKGROUNDS.find(x=>x.id===v)?.id??"montagna";
}
export async function FamilyProfileAppearance({userId}:{userId:string}) {
 const {memorials,memberships}=await getFamilyDashboard(userId);
 const db=await createServerSupabaseClient();
 const ids=memorials.map(m=>m.id);
 const {data,error}=ids.length
  ?await db.from("memorial_visual_settings").select("memorial_id,draft_preset,published_preset").in("memorial_id",ids)
  :{data:[],error:null};
 if(error)throw new Error("Impossibile caricare le preferenze.");
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
   isSampleGiovanni:!!m.is_demo&&m.deceased_name==="Giovanni Rossi"
  };
 });
 return <FamilyBackgroundEditor memorials={items}/>;
}
