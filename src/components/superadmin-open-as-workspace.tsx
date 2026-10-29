"use client";
import {useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {WORKSPACE_NAV} from "@/lib/navigation";
import {OpenAsButton} from "./superadmin-open-as-button";
import "./superadmin-open-as-workspace.css";

type Agency={id:string;legal_name:string;city:string|null;country_code:string;vat_number:string|null;contact_email:string|null;plan:string;status:string;is_demo:boolean};
type Memorial={id:string;agency_id:string;name:string;status:string;tier:string;visibility?:string;is_demo:boolean;birth_date?:string|null;death_date?:string|null};
type Member={user_id:string;role:string;active:boolean;can_moderate?:boolean;can_edit_content?:boolean};
type Contribution={id:string;title?:string;author?:string;body:string;status:string};
type Preset={id:string;label:string;image_url:string};
type Presentation={name:string;dedication:string;biography:string;portrait_url:string|null;portrait_focus_x:number|null;background:string};
export type OperatorSnapshot={context_id:string;kind:"AGENCY"|"FAMILY";expires_at:string;agency:Agency;memorial?:Memorial;memorials?:Memorial[];members:Member[];presentation?:Presentation;backgrounds?:Preset[];thoughts?:Contribution[];memories?:Contribution[]};
type Event={action:string;at:string;reason:string|null;before:unknown;after:unknown};

function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="oa-panel"><h2>{title}</h2>{children}</section>;}
function Status({value}:{value:string}){return <span className="oa-status">{value.replaceAll("_"," ")}</span>;}

function ContributionEditor({item,resource,busy,onAction}:{item:Contribution;resource:"THOUGHT"|"MEMORY";busy:boolean;onAction:(operation:"EDIT"|"APPROVE"|"REJECT"|"DELETE",fields:Record<string,string>,item:Contribution)=>void}){
 const [label,setLabel]=useState(item.author??item.title??"");
 const [body,setBody]=useState(item.body);
 return <article className="oa-contribution">
  <div className="oa-flex"><strong>{resource==="THOUGHT"?"Pensiero":"Ricordo"}</strong><Status value={item.status}/></div>
  <label>{resource==="THOUGHT"?"Autore":"Titolo"}<input value={label} maxLength={resource==="THOUGHT"?80:180} onChange={e=>setLabel(e.target.value)}/></label>
  <label>Testo<textarea value={body} rows={3} maxLength={resource==="THOUGHT"?2000:10000} onChange={e=>setBody(e.target.value)}/></label>
  <div className="oa-row-actions">
   <button type="button" disabled={busy} onClick={()=>onAction("EDIT",resource==="THOUGHT"?{author:label,body}:{title:label,body},item)}>Salva</button>
   {item.status!=="APPROVED"&&<button type="button" disabled={busy} onClick={()=>onAction("APPROVE",{},item)}>Approva</button>}
   {item.status!=="REJECTED"&&<button type="button" disabled={busy} onClick={()=>onAction("REJECT",{},item)}>Rifiuta</button>}
   <button type="button" className="oa-danger" disabled={busy} onClick={()=>onAction("DELETE",{},item)}>Elimina</button>
  </div>
 </article>;
}
export function SuperadminOpenAsWorkspace({initial}:{initial:OperatorSnapshot}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const router=useRouter();
 const [snapshot,setSnapshot]=useState(initial);
 const [tab,setTab]=useState(initial.kind==="AGENCY"?"dashboard":"panoramica");
 const [editable,setEditable]=useState(false);
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [events,setEvents]=useState<Event[]|null>(null);
 const [agencyName,setAgencyName]=useState(initial.agency.legal_name);
 const [agencyCity,setAgencyCity]=useState(initial.agency.city??"");
 const [agencyEmail,setAgencyEmail]=useState(initial.agency.contact_email??"");
 const [personName,setPersonName]=useState(initial.presentation?.name??initial.memorial?.name??"");
 const [dedication,setDedication]=useState(initial.presentation?.dedication??"");
 const [bio,setBio]=useState(initial.presentation?.biography??"");
 const [portraitUrl,setPortraitUrl]=useState(initial.presentation?.portrait_url??"");
 const [portraitFocus,setPortraitFocus]=useState(initial.presentation?.portrait_focus_x??42);
 const area=initial.kind==="AGENCY"?"agenzia":"famiglia";
 const backUrl=initial.kind==="AGENCY"
  ?"/console/piattaforma/agenzie/"+initial.agency.id
  :"/console/piattaforma/memoriali/"+initial.memorial?.id;
 const title=initial.kind==="AGENCY"?snapshot.agency.legal_name:snapshot.memorial?.name??"Famiglia";
 const currentItems=WORKSPACE_NAV[area];
 const canSave=editable&&reason.trim().length>=8&&!busy;
 const fail=(e:string)=>{setNotice(e);setBusy(false);};
 async function reload(){
  const result=await db.rpc("platform_get_operator_context",{context_key:snapshot.context_id});
  if(result.error||!result.data){fail("Errore di aggiornamento: "+(result.error?.message??"contesto scaduto"));return;}
  setSnapshot(result.data as OperatorSnapshot);setEvents(null);setBusy(false);
 }
 async function write(action:()=>Promise<{error:{message:string}|null}>,success:string){
  if(!canSave)return;
  if(!window.confirm("Confermi l'intervento come SuperAdmin? Verranno registrati identità, motivazione e modifica."))return;
  setBusy(true);setNotice("");
  const r=await action();
  if(r.error){fail("Operazione non riuscita: "+r.error.message);return;}
  setNotice(success);setReason("");await reload();
 }
 async function saveAgency(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  await write(async()=>db.rpc("platform_context_update_agency",{
   context_key:snapshot.context_id,changes:{legal_name:agencyName,city:agencyCity,contact_email:agencyEmail},reason
  }),"Anagrafica agenzia aggiornata e tracciata.");
 }
 async function saveFamily(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  await write(async()=>db.rpc("platform_context_update_family",{
   context_key:snapshot.context_id,changes:{name:personName,dedication,biography:bio,portrait_url:portraitUrl,portrait_focus_x:portraitFocus},reason
  }),"Presentazione memoriale aggiornata e tracciata.");
 }
 async function saveBackground(){
  await write(async()=>db.rpc("platform_context_set_background",{context_key:snapshot.context_id,preset,reason}),
   "Sfondo del memoriale aggiornato e tracciato.");
 }
 async function moderate(resource:"THOUGHT"|"MEMORY",operation:"EDIT"|"APPROVE"|"REJECT"|"DELETE",fields:Record<string,string>,item:Contribution){
  await write(async()=>db.rpc("platform_context_moderate",{context_key:snapshot.context_id,resource,record_id:item.id,operation,fields,reason}),
   "Contributo aggiornato e registrato nel contesto.");
 }
 async function loadEvents(){
  setBusy(true);const r=await db.rpc("platform_get_operator_context_events",{context_key:snapshot.context_id});
  if(r.error)fail(r.error.message);else{setEvents(r.data as Event[]);setBusy(false);}
 }
 async function exit(){
  setBusy(true);
  const r=await db.rpc("platform_close_operator_context",{context_key:snapshot.context_id});
  if(r.error){fail(r.error.message);return;}
  router.push(backUrl);
 }
 const [preset,setPreset]=useState(initial.presentation?.background??"montagna");
 const family=snapshot.kind==="FAMILY";
 const members=snapshot.members??[];
 const memorials=snapshot.memorials??[];
 const thoughts=snapshot.thoughts??[];
 const memories=snapshot.memories??[];
 const commonReason=<div className="oa-reason"><label htmlFor="oa-reason">Motivazione dell&apos;intervento (obbligatoria)</label><textarea id="oa-reason" minLength={8} maxLength={500} rows={2} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Indica perché intervieni su questo account"/></div>;
 return <div className="oa-workspace">
  <div className="oa-banner" role="status"><div><strong>Modalità SuperAdmin · {family?"Vista Famiglia":"Vista Agenzia"}</strong>
   <p>Stai operando con la tua identità, non con le credenziali dell&apos;utente. Contesto: <b>{title}</b> · {snapshot.agency.is_demo||snapshot.memorial?.is_demo?"DEMO":"REALE"}</p>
   </div><button type="button" onClick={exit} disabled={busy}>Esci e torna a SuperAdmin</button></div>
  <div className="oa-heading"><div><span className="workspace-label">APRI COME / {family?"FAMIGLIA":"AGENZIA"}</span><h1>{title}</h1>
    <p>{editable?"Modalità intervento: ogni modifica richiede conferma e motivazione.":"Modalità visualizzazione: nessuna modifica possibile."}</p></div>
   <div className="oa-heading-buttons"><button type="button" className={editable?"oa-primary":"oa-secondary"} onClick={()=>{setEditable(v=>!v);setReason("");setNotice("");}}>{editable?"Termina intervento":"Intervieni come SuperAdmin"}</button>
    <Link href={backUrl}>Scheda SuperAdmin</Link></div></div>
  <nav className="oa-section-nav" aria-label={"Sezioni "+area}>{currentItems.map(item=><button type="button" key={item.slug} className={tab===item.slug?"oa-tab is-active":"oa-tab"} onClick={()=>setTab(item.slug)} aria-current={tab===item.slug?"page":undefined}>{item.label}</button>)}</nav>
  {notice&&<p role="status" className="oa-notice">{notice}</p>}
  {editable&&commonReason}

  {!family&&<>
   {tab==="dashboard"&&<div className="oa-summary"><div><span>Memoriali</span><strong>{memorials.length}</strong></div><div><span>Piano</span><strong>{snapshot.agency.plan}</strong></div><div><span>Stato</span><strong>{snapshot.agency.status}</strong></div><div><span>Operatori</span><strong>{members.length}</strong></div></div>}
   {(tab==="dashboard"||tab==="memoriali")&&<Panel title="Memoriali dell'agenzia">{memorials.length?memorials.map(m=><article key={m.id} className="oa-record">
     <div><strong>{m.name??"Memoriale in preparazione"}</strong><p>{m.tier} · {m.status} {m.is_demo?"· DEMO":""}</p></div>
     <OpenAsButton kind="FAMILY" targetId={m.id}/></article>):<p>Nessun memoriale associato.</p>}</Panel>}
   {(tab==="dashboard"||tab==="la-mia-agenzia")&&<Panel title="Anagrafica e operatori">
    {!editable?<dl className="oa-dl"><div><dt>Ragione sociale</dt><dd>{snapshot.agency.legal_name}</dd></div><div><dt>Città</dt><dd>{snapshot.agency.city??"—"}</dd></div><div><dt>Email contatto</dt><dd>{snapshot.agency.contact_email??"—"}</dd></div><div><dt>Partita IVA</dt><dd>{snapshot.agency.vat_number??"—"}</dd></div></dl>:
     <form className="oa-form" onSubmit={saveAgency}><label>Ragione sociale<input required minLength={2} maxLength={240} value={agencyName} onChange={e=>setAgencyName(e.target.value)}/></label>
      <label>Città<input maxLength={150} value={agencyCity} onChange={e=>setAgencyCity(e.target.value)}/></label>
      <label>Email contatto<input type="email" value={agencyEmail} maxLength={254} onChange={e=>setAgencyEmail(e.target.value)}/></label><button type="submit" disabled={!canSave}>Salva dati agenzia</button></form>}
    <h3>Utenti associati</h3><div className="oa-members">{members.map(m=><div key={m.user_id}><span>{m.user_id}</span><Status value={m.role}/><small>{m.active?"Attivo":"Disattivato"}</small></div>)}</div>
   </Panel>}
   {tab==="amministrazione"&&<Panel title="Contratto e amministrazione"><dl className="oa-dl"><div><dt>Piano attuale</dt><dd>{snapshot.agency.plan}</dd></div><div><dt>Stato</dt><dd>{snapshot.agency.status}</dd></div><div><dt>Partita IVA</dt><dd>{snapshot.agency.vat_number??"—"}</dd></div></dl><p>Modifica piani e fatturazione non ancora collegata a un workflow finanziario autorizzato.</p></Panel>}
   {tab==="statistiche"&&<Panel title="Statistiche operative"><div className="oa-summary"><div><span>Totale memoriali</span><strong>{memorials.length}</strong></div><div><span>Pubblicati</span><strong>{memorials.filter(x=>x.status==="PUBLISHED_ACTIVE").length}</strong></div><div><span>Demo</span><strong>{memorials.filter(x=>x.is_demo).length}</strong></div></div></Panel>}
  </>}

  {family&&snapshot.memorial&&<>
   {tab==="panoramica"&&<div className="oa-summary"><div><span>Prodotto</span><strong>{snapshot.memorial.tier}</strong></div><div><span>Stato</span><strong>{snapshot.memorial.status}</strong></div><div><span>Pensieri</span><strong>{thoughts.length}</strong></div><div><span>Ricordi</span><strong>{memories.length}</strong></div></div>}
   {(tab==="panoramica"||tab==="profilo-e-storia")&&<Panel title="Profilo e storia">
    {!editable?<div className="oa-profile"><dl className="oa-dl"><div><dt>Persona</dt><dd>{snapshot.memorial.name}</dd></div><div><dt>Visibilità</dt><dd>{snapshot.memorial.visibility}</dd></div><div><dt>Dedica</dt><dd>{snapshot.presentation?.dedication??"—"}</dd></div></dl><p>{snapshot.presentation?.biography??"Biografia non inserita."}</p>
    {snapshot.presentation?.portrait_url&&<div className="oa-portrait" style={{backgroundImage:"url("+snapshot.presentation.portrait_url+")"}} role="img" aria-label="Ritratto commemorativo"/>}</div>:
     <form className="oa-form" onSubmit={saveFamily}><label>Nome della persona<input value={personName} onChange={e=>setPersonName(e.target.value)} required minLength={3} maxLength={180}/></label>
      <label>Dedica<textarea value={dedication} onChange={e=>setDedication(e.target.value)} rows={2} maxLength={500}/></label>
      <label>Biografia<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={6} maxLength={8000}/></label>
      <label>Percorso ritratto<input value={portraitUrl} onChange={e=>setPortraitUrl(e.target.value)} placeholder="/images/ritratto.webp"/></label>
      <label>Fuoco ritratto: {portraitFocus}%<input type="range" min={0} max={100} value={portraitFocus} onChange={e=>setPortraitFocus(Number(e.target.value))}/></label>
      <button type="submit" disabled={!canSave}>Salva presentazione</button></form>}</Panel>}
   {(tab==="panoramica"||tab==="pensieri-e-commenti")&&<Panel title="Pensieri e commenti">
    {thoughts.length?thoughts.map(t=>editable?<ContributionEditor key={t.id} item={t} resource="THOUGHT" busy={busy} onAction={(op,fields,item)=>void moderate("THOUGHT",op,fields,item)}/>:<article className="oa-record" key={t.id}><div><strong>{t.author}</strong><p>{t.body}</p></div><Status value={t.status}/></article>):<p>Nessun pensiero registrato.</p>}
    <p className="oa-note">I contenuti in attesa non sono visibili pubblicamente.</p>
   </Panel>}
   {(tab==="panoramica"||tab==="ricordi")&&<Panel title="Ricordi">
    {memories.length?memories.map(m=>editable?<ContributionEditor key={m.id} item={m} resource="MEMORY" busy={busy} onAction={(op,fields,item)=>void moderate("MEMORY",op,fields,item)}/>:<article className="oa-record" key={m.id}><div><strong>{m.title}</strong><p>{m.body}</p></div><Status value={m.status}/></article>):<p>Nessun ricordo registrato.</p>}
   </Panel>}
   {tab==="famiglia-e-contatti"&&<Panel title="Membri della famiglia e contatti">
    {members.length?members.map(m=><div className="oa-record" key={m.user_id}><div><strong>{m.user_id}</strong><p>{m.can_moderate?"Può moderare":"Nessuna moderazione"} · {m.can_edit_content?"Può modificare":"Sola lettura"}</p></div><Status value={m.role}/></div>):<p>Nessun membro.</p>}
    <p>Recapiti e consensi dei visitatori non disponibili finché il flusso Consumer non sarà implementato.</p>
   </Panel>}
   {(tab==="impostazioni"||tab==="profilo-e-storia")&&<Panel title="Paesaggio del memoriale">
    <p>La selezione è normalmente riservata alla famiglia; qui puoi vedere e, in modalità operativa, correggere la versione pubblicata.</p>
    <div className="oa-presets">{(snapshot.backgrounds??[]).map(p=><button key={p.id} type="button" disabled={!editable} className={preset===p.id?"oa-preset selected":"oa-preset"} onClick={()=>setPreset(p.id)} aria-pressed={preset===p.id}>
      <span style={{backgroundImage:"url("+p.image_url+")"}}/><strong>{p.label}</strong></button>)}</div>
    <p>Attualmente pubblicato: <b>{snapshot.presentation?.background??"montagna"}</b></p>
    {editable&&<button type="button" className="oa-primary" disabled={!canSave||preset===snapshot.presentation?.background} onClick={saveBackground}>Applica sfondo al memoriale</button>}
   </Panel>}
   {tab==="anniversari-e-solidarieta"&&<Panel title="Ricorrenze e solidarietà"><p>La gestione delle ricorrenze e delle raccolte non è ancora operativa. Nessuna modifica simulata.</p></Panel>}
  </>}
  <section className="oa-audit"><div className="oa-flex"><h2>Storico degli interventi in questo contesto</h2><button type="button" onClick={loadEvents} disabled={busy}>Aggiorna storico</button></div>
   {events===null?<p>Apri lo storico per vedere identità, operazione, motivazione e dati prima/dopo.</p>:events.length?events.map((event,i)=><article key={i}><strong>{event.action}</strong> <small>{new Date(event.at).toLocaleString("it-IT")}</small>
     {event.reason&&<p>Motivazione: {event.reason}</p>}<details><summary>Dettaglio</summary><pre>{JSON.stringify({prima:event.before,dopo:event.after},null,2)}</pre></details></article>):<p>Nessuna operazione registrata.</p>}
  </section>
  <p className="oa-footer">Contesto valido fino alle {new Date(snapshot.expires_at).toLocaleString("it-IT")}. Alla scadenza o all’uscita, ulteriori azioni sono negate dal database.</p>
 </div>;
}
