import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import {WorkspaceShell} from "@/components/workspace-shell";
import {FamilyMemorialPublisher} from "@/components/family-memorial-publisher";
import {FamilyMemorialContentEditor} from "@/components/family-memorial-content-editor";
import {FamilyDirectMemory} from "@/components/family-direct-memory";
import {FamilyVisitorMemories} from "@/components/family-visitor-memories";
import {FamilyGalleryEditor} from "@/components/family-gallery-editor";
import {MemorialQrCard} from "@/components/memorial-qr-card";
import {readIdentityAndMemberships} from "@/lib/authz/server";

export const dynamic="force-dynamic";

export default async function AgencyFamilyDelegation({params}:{params:Promise<{contextId:string}>}){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 const {contextId}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId))notFound();
 const db=await createServerSupabaseClient();
 const {data,error}=await db.rpc("agency_get_family_context",{context_key:contextId});
 if(error||!data||typeof data!=="object")notFound();
 const c=data as {context_id:string;memorial_id:string;name:string;status:string;agency_name:string;expires_at:string;tier?:string};
 return <WorkspaceShell area="agenzia">
  <div style={{display:"grid",gap:17}}>
   <Link href={"/console/agenzia/memoriali/"+c.memorial_id}>← Torna all&apos;Agenzia</Link>
   <div role="status" style={{padding:"13px 17px",borderLeft:"4px solid #ba9862",background:"#fff6e7",borderRadius:8}}>
    <strong>Agenzia · Stai operando come Famiglia per {c.name}</strong>
    <p>Contesto delegato valido fino alle {new Date(c.expires_at).toLocaleString("it-IT")}. Le operazioni sono attribuite al tuo utente effettivo.</p>
   </div>
   <header><span className="workspace-label">ENTRA COME FAMIGLIA · {c.agency_name}</span><h1>{c.name}</h1>
    <p>Puoi verificare i requisiti e pubblicare per conto della famiglia. È necessaria una conferma esplicita.</p></header>
   <Link href={"/memoriale/anteprima/"+c.memorial_id} target="_blank" rel="noopener noreferrer">Apri l&apos;anteprima privata di {c.name} ↗</Link>
   <MemorialQrCard memorialId={c.memorial_id} personName={c.name} contextKey={c.context_id}/>
   <FamilyMemorialContentEditor memorialId={c.memorial_id} memorialName={c.name} contextKey={c.context_id}/>
   {c.tier==="PREMIUM"&&<FamilyGalleryEditor memorialId={c.memorial_id} personName={c.name} contextKey={c.context_id}/>}
   <FamilyDirectMemory memorialId={c.memorial_id} memorialName={c.name} contextKey={c.context_id}/>
   <FamilyVisitorMemories memorialId={c.memorial_id} memorialName={c.name} contextKey={c.context_id}/>
   <FamilyMemorialPublisher memorialId={c.memorial_id} personName={c.name} contextKey={c.context_id} delegatedBy="AGENCY"/>
  </div>
 </WorkspaceShell>;
}
