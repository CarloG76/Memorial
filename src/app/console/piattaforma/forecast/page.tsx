import {redirect} from "next/navigation";
import {readIdentityAndMemberships} from "@/lib/authz/server";
import {WorkspaceShell} from "@/components/workspace-shell";
import {RevenueForecast} from "@/components/revenue-forecast";
export const dynamic="force-dynamic";
export default async function ForecastPage(){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 return <WorkspaceShell area="piattaforma"><RevenueForecast/></WorkspaceShell>;
}
