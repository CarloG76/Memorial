import {notFound,redirect} from "next/navigation";
import {readIdentityAndMemberships} from "@/lib/authz/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {WorkspaceShell} from "@/components/workspace-shell";
import {SuperadminOpenAsWorkspace,type OperatorSnapshot} from "@/components/superadmin-open-as-workspace";

export const dynamic="force-dynamic";

export default async function OperatorContextPage({params,searchParams}:{params:Promise<{contextId:string}>;searchParams:Promise<{sezione?:string}>}){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 const {contextId}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId))notFound();
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("platform_get_operator_context",{context_key:contextId});
 if(error||!data)notFound();
 const snapshot=data as OperatorSnapshot;
 const isAgency=snapshot.kind==="AGENCY";
 const section=(await searchParams).sezione;
 const area=isAgency?"agenzia":"famiglia";
 return <WorkspaceShell area={area} delegated={{contextId,kind:snapshot.kind,agencyName:isAgency?snapshot.agency.legal_name:snapshot.memorial?.name??"Famiglia"}}>
  <SuperadminOpenAsWorkspace initial={snapshot} section={section}/>
 </WorkspaceShell>;
}
