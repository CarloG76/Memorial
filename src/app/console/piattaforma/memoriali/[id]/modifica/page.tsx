import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {readIdentityAndMemberships} from "@/lib/authz/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {WorkspaceShell} from "@/components/workspace-shell";
import {SuperadminMemorialEditor,type MemorialPresentation} from "@/components/superadmin-memorial-editor";
import {SuperadminMemorialContributions,type ContributionSet} from "@/components/superadmin-contributions";
export const dynamic="force-dynamic";
export default async function EditMemorial({params}:{params:Promise<{id:string}>}){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const db=await createServerSupabaseClient();
 const [result,contributions]=await Promise.all([
 db.rpc("platform_get_memorial_presentation",{target_memorial:id}),
 db.rpc("platform_get_memorial_contributions",{target_memorial:id})
 ]);
 if(result.error)throw new Error("Impossibile caricare l'editor del memoriale.");
 if(!result.data)notFound();
 return <WorkspaceShell area="piattaforma">
  <Link href={`/console/piattaforma/memoriali/${id}`}>← Torna alla scheda memoriale</Link>
  <SuperadminMemorialEditor initial={result.data as MemorialPresentation}/>
  <SuperadminMemorialContributions memorialId={id} initial={contributions.data as ContributionSet}/>
 </WorkspaceShell>;
}