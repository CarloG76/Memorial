import {memorialStateLabel,agencyStatusLabel} from "@/lib/memorial-states";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { WorkspaceShell } from "@/components/workspace-shell";
import { OpenAsButton } from "@/components/superadmin-open-as-button";

export const dynamic="force-dynamic";
export default async function AgencyDetail({params}:{params:Promise<{id:string}>}){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 const {id}=await params;
 const db=await createServerSupabaseClient();
 const [a,m,staff]=await Promise.all([
  db.from("agencies").select("id,legal_name,vat_number,contact_email,city,country_code,status,plan,is_demo,created_at,demo_code").eq("id",id).maybeSingle(),
  db.from("memorials").select("id,deceased_name,status,tier,is_demo,created_at").eq("agency_id",id).order("created_at",{ascending:false}),
  db.rpc("platform_agency_members_directory",{agency_key:id})
 ]);
 if(a.error||m.error||staff.error)throw new Error("Errore caricamento dettaglio agenzia.");
 if(!a.data)notFound();
 const agency=a.data;
 const members=(staff.data??[]) as Array<{
  user_id:string;role:string;active:boolean;display_name:string;
  first_name:string;last_name:string;phone:string;contact_email:string;
  login_email:string;contact_complete:boolean;
 }>;
 return <WorkspaceShell area="piattaforma">
  <Link href="/console/piattaforma?sezione=agenzie">← Tutte le agenzie</Link>
  <div className="catalog-header"><div><span className="workspace-label">Scheda agenzia</span><h1>{agency.legal_name}</h1></div>
  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><OpenAsButton kind="AGENCY" targetId={agency.id}/><span className="catalog-demo-tag">{agency.is_demo?"Demo":"Reale"}</span></div></div>
  <section className="workspace-panel"><h2>Anagrafica e contratto</h2>
   <dl className="catalog-details">
   <div><dt>Identificativo</dt><dd>{agency.id}</dd></div>
   <div><dt>Codice demo</dt><dd>{agency.demo_code??"—"}</dd></div>
   <div><dt>Città</dt><dd>{agency.city??"—"}</dd></div>
   <div><dt>Paese</dt><dd>{agency.country_code}</dd></div>
   <div><dt>Partita IVA</dt><dd>{agency.vat_number??"—"}</dd></div>
   <div><dt>Email contatto</dt><dd>{agency.contact_email??"—"}</dd></div>
   <div><dt>Piano</dt><dd>{agency.plan}</dd></div>
   <div><dt>Stato</dt><dd>{agencyStatusLabel(agency.status)}</dd></div>
   </dl></section>
  <section className="workspace-panel"><h2>Memoriali ({m.data?.length??0})</h2>
  <div className="catalog-table-wrap"><table className="catalog-table">
   <thead><tr><th>Persona</th><th>Tipologia</th><th>Stato</th><th>Demo</th><th>Apri</th></tr></thead>
   <tbody>{m.data?.map(row=><tr key={row.id}>
    <td data-label="Persona">{row.deceased_name??"In preparazione"}</td><td data-label="Tipologia">{row.tier??"—"}</td><td data-label="Stato">{memorialStateLabel(row.status)}</td>
    <td data-label="Demo">{row.is_demo?"Sì":"No"}</td>
    <td data-label="Azioni"><Link href={`/console/piattaforma/memoriali/${row.id}`}>Dettaglio →</Link></td>
   </tr>)}</tbody></table></div></section>
  <section className="workspace-panel"><h2>Titolare e collaboratori</h2><p>{members.length} utenti associati. Per aggiornare l&apos;anagrafica o i permessi usa «Entra come».</p>
   <div className="catalog-table-wrap"><table className="catalog-table">
    <thead><tr><th>Nome e cognome</th><th>Ruolo</th><th>Email</th><th>Telefono</th><th>Stato</th></tr></thead>
    <tbody>{members.map(u=><tr key={u.user_id}>
      <td data-label="Nome">{[u.first_name,u.last_name].filter(Boolean).join(" ")||u.display_name||"Anagrafica da completare"}</td>
      <td data-label="Ruolo">{u.role==="OWNER"?"Titolare":"Operatore"}</td>
      <td data-label="Email">{u.contact_email||u.login_email||"—"}{u.role==="OWNER"&&!u.contact_complete&&<small style={{display:"block",color:"#986e37"}}>Recapito da completare</small>}</td>
      <td data-label="Telefono">{u.phone||"Da compilare"}</td>
      <td data-label="Stato">{u.active?"Attivo":"Disattivato"}</td>
     </tr>)}</tbody>
   </table></div></section>
  <p className="catalog-footnote">Scheda in consultazione. Modifiche e azioni operative saranno disponibili quando i relativi flussi saranno implementati e autorizzati.</p>
 </WorkspaceShell>;
}
