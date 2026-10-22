import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { WorkspaceShell } from "@/components/workspace-shell";

export const dynamic="force-dynamic";
export default async function MemorialDetail({params}:{params:Promise<{id:string}>}){
 const identity=await readIdentityAndMemberships();
 if(!identity)redirect("/accedi");
 if(!identity.workspaces.platformRoles.includes("OWNER"))redirect("/console?errore=non-autorizzato");
 const {id}=await params;
 const db=await createServerSupabaseClient();
 const record=await db.from("memorials").select("id,agency_id,deceased_name,status,tier,visibility,is_demo,demo_code,birth_date,death_date,first_published_at,covered_until,created_at").eq("id",id).maybeSingle();
 if(record.error)throw new Error("Errore caricamento memoriale.");
 if(!record.data)notFound();
 const m=record.data;
 const [agency,memories,thoughts,family]=await Promise.all([
  db.from("agencies").select("id,legal_name").eq("id",m.agency_id).single(),
  db.from("memorial_memories").select("id,title,body,moderation_status,is_demo,created_at").eq("memorial_id",id).order("created_at",{ascending:false}),
  db.from("memorial_thoughts").select("id,author_name,body,moderation_status,is_demo,created_at").eq("memorial_id",id).order("created_at",{ascending:false}),
  db.from("family_members").select("user_id,role,active,can_moderate,can_edit_content").eq("memorial_id",id)
 ]);
 if(agency.error||memories.error||thoughts.error||family.error)
  throw new Error("Impossibile caricare alcuni dati del memoriale.");
 return <WorkspaceShell area="piattaforma">
  <Link href="/console/piattaforma?sezione=memoriali">← Tutti i memoriali</Link>
  <div className="catalog-header"><div><span className="workspace-label">Scheda memoriale</span>
   <h1>{m.deceased_name??"Memoriale in preparazione"}</h1>
   <p><Link href={`/console/piattaforma/agenzie/${m.agency_id}`}>{agency.data.legal_name}</Link></p></div>
   <span className="catalog-demo-tag">{m.is_demo?"Demo":"Reale"}</span></div>
  <section className="workspace-panel"><h2>Dati e ciclo di vita</h2><dl className="catalog-details">
   <div><dt>ID</dt><dd>{m.id}</dd></div><div><dt>Codice demo</dt><dd>{m.demo_code??"—"}</dd></div>
   <div><dt>Prodotto</dt><dd>{m.tier??"—"}</dd></div><div><dt>Stato</dt><dd>{m.status}</dd></div>
   <div><dt>Visibilità</dt><dd>{m.visibility}</dd></div><div><dt>Nascita</dt><dd>{m.birth_date??"—"}</dd></div>
   <div><dt>Scomparsa</dt><dd>{m.death_date??"—"}</dd></div>
   <div><dt>Prima pubblicazione</dt><dd>{m.first_published_at??"—"}</dd></div>
   <div><dt>Copertura fino al</dt><dd>{m.covered_until??"—"}</dd></div>
  </dl></section>
  <section className="workspace-panel"><h2>Famiglia ({family.data?.length??0})</h2><div className="catalog-table-wrap">
   <table className="catalog-table"><thead><tr><th>ID utente</th><th>Ruolo</th><th>Attivo</th><th>Moderazione</th></tr></thead>
   <tbody>{family.data?.map(u=><tr key={u.user_id}><td>{u.user_id}</td><td>{u.role}</td><td>{u.active?"Sì":"No"}</td><td>{u.can_moderate?"Sì":"No"}</td></tr>)}</tbody></table></div></section>
  <section className="workspace-panel"><h2>Ricordi ({memories.data?.length??0})</h2>
   {memories.data?.map(x=><article key={x.id} className="catalog-content"><strong>{x.title}</strong><p>{x.body}</p><small>Stato: {x.moderation_status}</small></article>)}
   {!memories.data?.length&&<p>Nessun ricordo.</p>}</section>
  <section className="workspace-panel"><h2>Pensieri ({thoughts.data?.length??0})</h2>
   {thoughts.data?.map(x=><article key={x.id} className="catalog-content"><strong>{x.author_name}</strong><p>{x.body}</p><small>Stato: {x.moderation_status}</small></article>)}
   {!thoughts.data?.length&&<p>Nessun pensiero.</p>}</section>
  <p className="catalog-footnote">Consultazione SuperAdmin; operazioni di modifica non ancora disponibili.</p>
 </WorkspaceShell>;
}
