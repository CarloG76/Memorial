"use client";
import {useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./agency-console-sections.css";
import {memorialStateLabel,agencyStatusLabel} from "@/lib/memorial-states";

type Agency={id:string;legal_name:string;city:string|null;contact_email:string|null;vat_number:string|null;country_code:string;plan:string;status:string;is_demo:boolean};
type Memorial={id:string;agency_id:string;deceased_name:string|null;demo_code:string|null;status:string;tier:string|null;visibility:string;is_demo:boolean;created_at:string;first_published_at:string|null;covered_until:string|null};
function status(s:string){return ["ACTIVE","CLOSED","SUSPENDED"].includes(s)?agencyStatusLabel(s):memorialStateLabel(s);}
function date(s:string|null){return s?new Date(s).toLocaleDateString("it-IT"):"—";}

export function AgencyMemorials({agencies,memorials}:{agencies:Agency[];memorials:Memorial[]}){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("ALL");
 const [agency,setAgency]=useState("ALL");
 const labels=new Map(agencies.map(a=>[a.id,a.legal_name]));
 const filtered=memorials.filter(m=>(agency==="ALL"||m.agency_id===agency)&&(filter==="ALL"||m.status===filter)&&
  (m.deceased_name??"").toLocaleLowerCase("it").includes(query.toLocaleLowerCase("it")));
 return <section className="ac-section">
  <span className="workspace-label">AGENZIA / MEMORIALI</span><h1>Memoriali</h1>
  <p>Elenco effettivo dei memoriali associati alla tua agenzia, con stato di lavorazione e dettaglio consultabile.</p>
  <div className="ac-filters">
   <label>Cerca persona<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome e cognome…"/></label>
   {agencies.length>1&&<label>Agenzia<select value={agency} onChange={e=>setAgency(e.target.value)}><option value="ALL">Tutte</option>{agencies.map(a=><option key={a.id} value={a.id}>{a.legal_name}</option>)}</select></label>}
   <label>Stato<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Tutti gli stati</option>{[...new Set(memorials.map(m=>m.status))].map(s=><option key={s} value={s}>{status(s)}</option>)}</select></label>
  </div>
  <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Memoriale</th><th>Agenzia</th><th>Tipo</th><th>Stato</th><th>Creazione</th><th>Azioni</th></tr></thead><tbody>
   {filtered.map(m=><tr key={m.id}><td>{m.deceased_name??"Da completare"}</td><td>{labels.get(m.agency_id)??"—"}</td><td>{m.tier??"—"}</td><td>{status(m.status)}</td><td>{date(m.created_at)}</td><td><Link href={"/console/agenzia/memoriali/"+m.id}>Dettaglio</Link></td></tr>)}
  </tbody></table></div>
  {!filtered.length&&<p>Nessun memoriale corrisponde ai filtri.</p>}
  <div className="ac-explainer"><strong>Nuovi memoriali</strong><p>L&apos;acquisto e l&apos;attivazione dei due memoriali iniziali gratuiti richiedono il flusso transazionale di creazione, ancora da integrare. Non vengono effettuati acquisti o attivazioni simulate.</p></div>
 </section>;
}
export function AgencyStatistics({agencies,memorials}:{agencies:Agency[];memorials:Memorial[]}){
 const total=memorials.length;
 const groups=[["Pubblicati",memorials.filter(m=>m.status==="PUBLISHED_ACTIVE").length],["In preparazione",memorials.filter(m=>["DRAFT","SKELETON_ACTIVE","FAMILY_PREPARING","READY_FOR_PUBLICATION"].includes(m.status)).length],["Standard",memorials.filter(m=>m.tier==="STANDARD").length],["Premium",memorials.filter(m=>m.tier==="PREMIUM").length]];
 return <section className="ac-section"><span className="workspace-label">AGENZIA / STATISTICHE</span><h1>Statistiche</h1>
  <p>Numeri dal database della tua agenzia. Non sono fatturati né conversioni di vendita.</p>
  <div className="ac-metrics">{[["Totale memoriali",total],...groups].map(([label,count])=><div key={String(label)}><strong>{count}</strong><span>{label}</span></div>)}</div>
  <div className="ac-columns"><article className="ac-card"><h2>Prodotti</h2>
   {(["STANDARD","PREMIUM"] as const).map(t=><div className="ac-stat-row" key={t}><strong>{t==="STANDARD"?"Standard":"Premium"}</strong><span>{memorials.filter(m=>m.tier===t).length}</span></div>)}
   <p>Il conteggio comprende i memoriali dei diversi stati; non equivale a memoriali fatturati.</p>
  </article><article className="ac-card"><h2>Distribuzione per agenzia</h2>
   {agencies.map(a=><div className="ac-stat-row" key={a.id}><strong>{a.legal_name}</strong><span>{memorials.filter(m=>m.agency_id===a.id).length}</span></div>)}
  </article></div>
 </section>;
}
export function AgencyContactProfile({agency,canEdit}:{agency:Agency;canEdit:boolean}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [city,setCity]=useState(agency.city??"");
 const [email,setEmail]=useState(agency.contact_email??"");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!canEdit||saving)return;
  setSaving(true);setMessage("");setError("");
  const r=await db.rpc("agency_update_contact_profile",{agency_key:agency.id,new_city:city,new_contact_email:email});
  if(r.error)setError("Salvataggio non riuscito: "+r.error.message);
  else setMessage("Recapiti dell’agenzia salvati.");
  setSaving(false);
 }
 return <article className="ac-card">
  <h2>{agency.legal_name}</h2>
  <dl className="ac-details">
   <div><dt>Partita IVA</dt><dd>{agency.vat_number??"Non indicata"}</dd></div>
   <div><dt>Paese</dt><dd>{agency.country_code}</dd></div>
   <div><dt>Piano registrato</dt><dd>{agency.plan}</dd></div>
   <div><dt>Stato</dt><dd>{status(agency.status)}</dd></div>
  </dl>
  {canEdit?<form className="ac-profile-form" onSubmit={e=>void submit(e)}>
    <label>Città<input maxLength={150} value={city} onChange={e=>setCity(e.target.value)}/></label>
    <label>Email di contatto<input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <button type="submit" disabled={saving}>{saving?"Salvataggio…":"Salva recapiti"}</button>
    {message&&<p role="status" className="ac-success">{message}</p>}
    {error&&<p role="alert" className="ac-error">{error}</p>}
   </form>:<p>Solo il responsabile Owner può modificare i recapiti dell&apos;agenzia.</p>}
 </article>;
}
