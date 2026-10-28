import {createServerSupabaseClient} from "@/lib/supabase/server";
import {SuperadminAuditViewer,type AuditEvent} from "./superadmin-audit-viewer";
export async function SuperadminAuditLog({page=0}:{page?:number}){
 const safePage=Number.isFinite(page)?Math.max(0,Math.min(Math.floor(page),1000000)):0;
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("platform_get_change_log_page",{page_number:safePage,page_size:100});
 if(error)throw new Error("Impossibile leggere il registro delle modifiche.");
 const result=data as {events?:AuditEvent[];total?:number;page?:number;page_size?:number}|null;
 return <SuperadminAuditViewer events={result?.events??[]} page={safePage} total={result?.total??0} pageSize={result?.page_size??100}/>;
}
