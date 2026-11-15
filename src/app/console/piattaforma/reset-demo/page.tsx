import {redirect} from "next/navigation";
import {readIdentityAndMemberships} from "@/lib/authz/server";
import {WorkspaceShell} from "@/components/workspace-shell";
import {DemoResetControl} from "@/components/demo-reset-control";

export const dynamic="force-dynamic";
export default async function ResetDemoPage(){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 return <WorkspaceShell area="piattaforma"><DemoResetControl/></WorkspaceShell>;
}
