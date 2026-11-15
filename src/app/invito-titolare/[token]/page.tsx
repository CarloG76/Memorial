import {notFound} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {InvitationActivation} from "@/components/invitation-activation";
export const dynamic="force-dynamic";
export default async function OwnerInvitePage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token))notFound();
 const db=await createServerSupabaseClient();
 const docs=await db.from("agency_legal_documents").select("kind,version,document_url").eq("active",true);
 return <InvitationActivation token={token} kind="AGENCY" documents={docs.error?[]:docs.data??[]}/>;
}
