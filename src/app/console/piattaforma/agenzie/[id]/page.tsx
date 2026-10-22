import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { WorkspaceShell } from "@/components/workspace-shell";

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
  db.from("agency_members").select("user_id,role,active").eq("agency_id",id)
 ]);
 if(a.error||m.error||staff.error)throw new Error("Errore caricamento dettaglio agenzia.");
 if(!a.data)notFound();
 const agency=a.data;
 return <WorkspaceShell area="piattaforma">
  <Link href="/console/piattaforma?sezione=agenzie">← Tutte le agenzie</Link>
  <div className="catalog-header"><div><span className="workspace-label">Scheda agenzia</span><h1>{agency.legal_name}</h1></div>
  <span className="catalog-demo-tag">{agency.is_demo?"Demo":"Reale"}</span></div>
  <section className="workspace-panel"><h2>Anagrafica e contratto</h2>
   <dl className="catalog-details">
   <div><dt>Identificativo</dt><dd>{agency.id}</dd></div>
   <div><dt>Codice demo</dt><dd>{agency.demo_code??"—"}</dd></div>
   <div><dt>Città</dt><dd>{agency.city??"—"}</dd></div>
   <div><dt>Paese</dt><dd>{agency.country_code}</dd></div>
   <div><dt>Partita IVA</dt><dd>{agency.vat_number??"—"}</dd></div>
   <div><dt>Email contatto</dt><dd>{agency.contact_email??"—"}</dd></div>
   <div><dt>Piano</dt><dd>{agency.plan}</dd></div>
   <div><dt>Stato</dt><dd>{agency.status}</dd></div>
   </dl></section>
  <section className="workspace-panel"><h2>Memoriali ({m.data?.length??0})</h2>
  <div className="catalog-table-wrap"><table className="catalog-table">
   <thead><tr><th>Persona</th><th>Tipologia</th><th>Stato</th><th>Demo</th><th>Apri</th></tr></thead>
   <tbody>{m.data?.map(row=><tr key={row.id}>
    <td>{row.deceased_name??"In preparazione"}</td><td>{row.tier??"—"}</td><td>{row.status}</td>
    <td>{row.is_demo?"Sì":"No"}</td>
    <td><Link href={`/console/piattaforma/memoriali/${row.id}`}>Dettaglio →</Link></td>
   </tr>)}</tbody></table></div></section>
  <section className="workspace-panel"><h2>Accessi agenzia</h2><p>{staff.data?.length??0} membri registrati</p>
   <div className="catalog-table-wrap"><table className="catalog-table">
    <thead><tr><th>ID utente</th><th>Ruolo</th><th>Attivo</th></tr></thead>
    <tbody>{staff.data?.map(u=><tr key={u.user_id}><td>{u.user_id}</td><td>{u.role}</td><td>{u.active?"Sì":"No"}</td></tr>)}</tbody>
   </table></div></section>
  <p className="catalog-footnote">Scheda in consultazione. Modifiche e azioni operative saranno disponibili quando i relativi flussi saranno implementati e autorizzati.</p>
 </WorkspaceShell>;
}
