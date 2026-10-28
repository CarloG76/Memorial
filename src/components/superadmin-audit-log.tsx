import {createServerSupabaseClient} from "@/lib/supabase/server";
import {SuperadminAuditViewer,type AuditEvent} from "./superadmin-audit-viewer";
export async function SuperadminAuditLog(){
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("platform_get_change_log",{max_results:200});
 if(error)throw new Error("Impossibile leggere il registro delle modifiche.");
 return <SuperadminAuditViewer events={(data??[]) as AuditEvent[]}/>;
}
