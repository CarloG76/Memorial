"use client";
import {useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {WORKSPACE_NAV} from "@/lib/navigation";
import {OpenAsButton} from "./superadmin-open-as-button";
import {AgencyTeamManager} from "./agency-team-manager";
import {AgencyAdministration} from "./agency-administration";
import {FamilyVisitorMemories} from "./family-visitor-memories";
import {ContextActionNotice} from "./context-action-notice";
import {MilestonesEditor,normalizeMilestones,validMilestoneDate,type MemorialMilestone} from "./memorial-milestones-editor";
import "./superadmin-open-as-workspace.css";

type Agency={id:string;legal_name:string;city:string|null;country_code:string;vat_number:string|null;contact_email:string|null;plan:string;status:string;is_demo:boolean};
type Memorial={id:string;agency_id:string;name:string;status:string;tier:string;visibility?:string;is_demo:boolean;birth_date?:string|null;death_date?:string|null};
type Member={user_id:string;role:string;active:boolean;display_name?:string;can_moderate?:boolean;can_edit_content?:boolean};
type Contribution={id:string;title?:string;author?:string;body:string;status:string};
type Preset={id:string;label:string;image_url:string};
type Presentation={name:string;dedication:string;biography:string;highlights:MemorialMilestone[];story?:string;portrait_url:string|null;portrait_focus_x:number|null;background:string};
export type OperatorSnapshot={context_id:string;kind:"AGENCY"|"FAMILY";expires_at:string;agency:Agency;memorial?:Memorial;memorials?:Memorial[];members:Member[];presentation?:Presentation;backgrounds?:Preset[];thoughts?:Contribution[];memories?:Contribution[]};
type Event={action:string;at:string;reason:string|null;before:unknown;after:unknown};

function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="oa-panel"><h2>{title}</h2>{children}</section>;}
function Status({value}:{value:string}){return <span className="oa-status">{value.replaceAll("_"," ")}</span>;}

function NewContribution({resource,busy,onCreate}:{resource:"THOUGHT"|"MEMORY";busy:boolean;onCreate:(fields:Record<string,string>)=>Promise<void>}){
 const [label,setLabel]=useState("");
 const [body,setBody]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{await onCreate(resource==="THOUGHT"?{author:label,body}:{title:label,body});setLabel("");setBody("");}
  catch{return;}
 }
 return <form className="oa-contribution oa-new-contribution" onSubmit={e=>void submit(e)}>
  <h3>Aggiungi {resource==="THOUGHT"?"un pensiero":"un ricordo"}</h3>
  <label>{resource==="THOUGHT"?"Autore":"Titolo"}<input required minLength={2} maxLength={resource==="THOUGHT"?80:180} value={label} onChange={e=>setLabel(e.target.value)}/></label>
  <label>Testo<textarea required minLength={10} maxLength={resource==="THOUGHT"?2000:10000} rows={3} value={body} onChange={e=>setBody(e.target.value)}/></label>
  <div className="oa-row-actions"><button type="submit" disabled={busy}>Aggiungi in attesa di approvazione</button></div>
 </form>;
}
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
 const [snapshot,setSnapshot]=useState(initial);
 const [tab,setTab]=useState(initial.kind==="AGENCY"?"dashboard":"panoramica");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [events,setEvents]=useState<Event[]|null>(null);
 const [agencyName,setAgencyName]=useState(initial.agency.legal_name);
 const [agencyCity,setAgencyCity]=useState(initial.agency.city??"");
 const [agencyEmail,setAgencyEmail]=useState(initial.agency.contact_email??"");
 const [personName,setPersonName]=useState(initial.presentation?.name??initial.memorial?.name??"");
 const [dedication,setDedication]=useState(initial.presentation?.dedication??"");
 const [bio,setBio]=useState(initial.presentation?.biography??"");
 const [milestones,setMilestones]=useState<MemorialMilestone[]>(normalizeMilestones(initial.presentation?.highlights));
 const [portraitUrl,setPortraitUrl]=useState(initial.presentation?.portrait_url??"");
 const [portraitFocus,setPortraitFocus]=useState(initial.presentation?.portrait_focus_x??42);
 const area=initial.kind==="AGENCY"?"agenzia":"famiglia";
 const title=initial.kind==="AGENCY"?snapshot.agency.legal_name:snapshot.memorial?.name??"Famiglia";
 const currentItems=WORKSPACE_NAV[area];
 const canSave=!busy;
 const fail=(e:string)=>{setNotice(e);setBusy(false);};
 async function reload(){
  const result=await db.rpc("platform_get_operator_context",{context_key:snapshot.context_id});
  if(result.error||!result.data){fail("Errore di aggiornamento: "+(result.error?.message??"contesto scaduto"));return;}
  setSnapshot(result.data as OperatorSnapshot);setEvents(null);setBusy(false);
 }
 async function write(action:()=>Promise<{error:{message:string}|null}>,success:string){
  if(!canSave)return;
  setBusy(true);setNotice("");
  const r=await action();
  if(r.error){fail("Operazione non riuscita: "+r.error.message);return;}
  setNotice(success);await reload();
 }
 async function saveAgency(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  await write(async()=>db.rpc("platform_context_update_agency",{
   context_key:snapshot.context_id,changes:{legal_name:agencyName,city:agencyCity,contact_email:agencyEmail},reason:null
  }),"Anagrafica agenzia aggiornata e tracciata.");
 }
 async function saveFamily(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(milestones.some(x=>!validMilestoneDate(x.date)||!x.detail.trim())){setNotice("Verifica date e didascalie delle tappe.");return;}
  await write(async()=>db.rpc("platform_context_update_family",{
   context_key:snapshot.context_id,changes:{name:personName,dedication,biography:bio,highlights:milestones,portrait_url:portraitUrl,portrait_focus_x:portraitFocus},reason:null
  }),"Presentazione memoriale aggiornata e tracciata.");
 }
 async function saveBackground(){
  await write(async()=>db.rpc("platform_context_set_background",{context_key:snapshot.context_id,preset,reason:null}),
   "Sfondo del memoriale aggiornato e tracciato.");
 }
 async function moderate(resource:"THOUGHT"|"MEMORY",operation:"EDIT"|"APPROVE"|"REJECT"|"DELETE",fields:Record<string,string>,item:Contribution){
  if(operation==="DELETE"&&!window.confirm("Eliminare definitivamente questo contenuto?"))return;
  await write(async()=>db.rpc("platform_context_moderate",{context_key:snapshot.context_id,resource,record_id:item.id,operation,fields,reason:null}),
   "Contributo aggiornato e registrato nel contesto.");
 }
 async function createContribution(resource:"THOUGHT"|"MEMORY",fields:Record<string,string>){
  if(!canSave)return;
  setBusy(true);setNotice("");
  const r=await db.rpc("platform_context_moderate",{context_key:snapshot.context_id,resource,record_id:null,operation:"CREATE",fields,reason:null});
  if(r.error){fail("Operazione non riuscita: "+r.error.message);throw new Error(r.error.message);}
  setNotice("Contributo creato in attesa di approvazione.");await reload();
 }
 async function loadEvents(){
  setBusy(true);const r=await db.rpc("platform_get_operator_context_events",{context_key:snapshot.context_id});
  if(r.error)fail(r.error.message);else{setEvents(r.data as Event[]);setBusy(false);}
 }
 const [preset,setPreset]=useState(initial.presentation?.background??"montagna");
 const family=snapshot.kind==="FAMILY";
 const members=snapshot.members??[];
 const memorials=snapshot.memorials??[];
 const thoughts=snapshot.thoughts??[];
 const memories=snapshot.memories??[];
 return <div className="oa-workspace">
  <div className="oa-banner" role="status"><div><strong>SuperAdmin · Stai gestendo {family?"la Famiglia":"l’Agenzia"}: {title}</strong>
   <p>{snapshot.agency.is_demo||snapshot.memorial?.is_demo?"Ambiente DEMO":"Ambiente reale"} · Operazioni effettuate con la tua identità.</p>
   </div></div>

  <div className="oa-heading"><div><span className="workspace-label">APRI COME / {family?"FAMIGLIA":"AGENZIA"}</span><h1>{title}</h1>
    </div>
  </div>

  <nav className="oa-section-nav" aria-label={"Sezioni "+area}>{currentItems.map(item=><button type="button" key={item.slug} className={tab===item.slug?"oa-tab is-active":"oa-tab"} onClick={()=>setTab(item.slug)} aria-current={tab===item.slug?"page":undefined}>{item.label}</button>)}</nav>
  {notice&&<p role="status" className="oa-notice">{notice}</p>}
  {family&&snapshot.memorial&&<ContextActionNotice memorialId={snapshot.memorial.id} onOpen={()=>setTab("ricordi")}/>}

  {!family&&<>
   {tab==="dashboard"&&<div className="oa-summary"><div><span>Memoriali</span><strong>{memorials.length}</strong></div><div><span>Piano</span><strong>{snapshot.agency.plan}</strong></div><div><span>Stato</span><strong>{snapshot.agency.status}</strong></div><div><span>Operatori</span><strong>{members.length}</strong></div></div>}
   {(tab==="dashboard"||tab==="memoriali")&&<Panel title="Memoriali dell'agenzia">{memorials.length?memorials.map(m=><article key={m.id} className="oa-record">
     <div><strong>{m.name??"Memoriale in preparazione"}</strong><p>{m.tier} · {m.status} {m.is_demo?"· DEMO":""}</p></div>
     <OpenAsButton kind="FAMILY" targetId={m.id}/></article>):<p>Nessun memoriale associato.</p>}</Panel>}
   {(tab==="dashboard"||tab==="la-mia-agenzia")&&<Panel title="Anagrafica e operatori">
    <form className="oa-form" onSubmit={saveAgency}><label>Ragione sociale<input required minLength={2} maxLength={240} value={agencyName} onChange={e=>setAgencyName(e.target.value)}/></label>
      <label>Città<input maxLength={150} value={agencyCity} onChange={e=>setAgencyCity(e.target.value)}/></label>
      <label>Email contatto<input type="email" value={agencyEmail} maxLength={254} onChange={e=>setAgencyEmail(e.target.value)}/></label><button type="submit" disabled={!canSave}>Salva dati agenzia</button></form>
    <AgencyTeamManager agencyId={snapshot.agency.id} contextKey={snapshot.context_id}/>
   </Panel>}
   {tab==="amministrazione"&&<AgencyAdministration agency={snapshot.agency} memorials={memorials.map(m=>({...m,agency_id:snapshot.agency.id}))}/>}
   {tab==="statistiche"&&<Panel title="Statistiche operative"><div className="oa-summary"><div><span>Totale memoriali</span><strong>{memorials.length}</strong></div><div><span>Pubblicati</span><strong>{memorials.filter(x=>x.status==="PUBLISHED_ACTIVE").length}</strong></div><div><span>Demo</span><strong>{memorials.filter(x=>x.is_demo).length}</strong></div></div></Panel>}
  </>}

  {family&&snapshot.memorial&&<>
   {tab==="panoramica"&&<div className="oa-summary"><div><span>Prodotto</span><strong>{snapshot.memorial.tier}</strong></div><div><span>Stato</span><strong>{snapshot.memorial.status}</strong></div><div><span>Pensieri</span><strong>{thoughts.length}</strong></div><div><span>Ricordi</span><strong>{memories.length}</strong></div></div>}
   {(tab==="panoramica"||tab==="profilo-e-storia")&&<Panel title="Profilo e storia">
    <form className="oa-form" onSubmit={saveFamily}><label>Nome della persona<input value={personName} onChange={e=>setPersonName(e.target.value)} required minLength={3} maxLength={180}/></label>
      <label>Dedica<textarea value={dedication} onChange={e=>setDedication(e.target.value)} rows={2} maxLength={500}/></label>
      <label>Biografia — introduzione breve<textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} maxLength={8000}/></label>
      <fieldset className="oa-timeline-fieldset"><legend>Storia · tappe della vita</legend><MilestonesEditor items={milestones} onChange={setMilestones} disabled={busy}/></fieldset>
      <label>Percorso ritratto<input value={portraitUrl} onChange={e=>setPortraitUrl(e.target.value)} placeholder="/images/ritratto.webp"/></label>
      <label>Fuoco ritratto: {portraitFocus}%<input type="range" min={0} max={100} value={portraitFocus} onChange={e=>setPortraitFocus(Number(e.target.value))}/></label>
      <button type="submit" disabled={!canSave}>Salva presentazione</button></form></Panel>}
   {(tab==="panoramica"||tab==="pensieri-e-commenti")&&<Panel title="Pensieri e commenti">
    {thoughts.length?thoughts.map(t=><ContributionEditor key={t.id} item={t} resource="THOUGHT" busy={busy} onAction={(op,fields,item)=>void moderate("THOUGHT",op,fields,item)}/>):<p>Nessun pensiero registrato.</p>}
    <NewContribution resource="THOUGHT" busy={busy} onCreate={fields=>createContribution("THOUGHT",fields)}/>
    <p className="oa-note">I contenuti in attesa non sono visibili pubblicamente.</p>
   </Panel>}
   {(tab==="panoramica"||tab==="ricordi")&&<FamilyVisitorMemories memorialId={snapshot.memorial.id} memorialName={snapshot.memorial.name} contextKey={snapshot.context_id}/>}
   {(tab==="panoramica"||tab==="ricordi")&&<Panel title="Ricordi">
    {memories.length?memories.map(m=><ContributionEditor key={m.id} item={m} resource="MEMORY" busy={busy} onAction={(op,fields,item)=>void moderate("MEMORY",op,fields,item)}/>):<p>Nessun ricordo registrato.</p>}
    <NewContribution resource="MEMORY" busy={busy} onCreate={fields=>createContribution("MEMORY",fields)}/>
   </Panel>}
   {tab==="famiglia-e-contatti"&&<Panel title="Membri della famiglia e contatti">
    {members.length?members.map(m=><div className="oa-record" key={m.user_id}><div><strong>{m.display_name?.trim()||"Anagrafica familiare da completare"}</strong><p>{m.can_moderate?"Può moderare":"Nessuna moderazione"} · {m.can_edit_content?"Può modificare":"Sola lettura"}</p></div><Status value={m.role}/></div>):<p>Nessun membro.</p>}
    <p>Recapiti e consensi dei visitatori non disponibili finché il flusso Consumer non sarà implementato.</p>
   </Panel>}
   {(tab==="impostazioni"||tab==="profilo-e-storia")&&<Panel title="Paesaggio del memoriale">
    <p>Puoi scegliere e pubblicare direttamente lo sfondo del memoriale.</p>
    <div className="oa-presets">{(snapshot.backgrounds??[]).map(p=><button key={p.id} type="button" disabled={busy} className={preset===p.id?"oa-preset selected":"oa-preset"} onClick={()=>setPreset(p.id)} aria-pressed={preset===p.id}>
      <span style={{backgroundImage:"url("+p.image_url+")"}}/><strong>{p.label}</strong></button>)}</div>
    <p>Attualmente pubblicato: <b>{snapshot.presentation?.background??"montagna"}</b></p>
    <button type="button" className="oa-primary" disabled={!canSave||preset===snapshot.presentation?.background} onClick={saveBackground}>Applica sfondo al memoriale</button>
   </Panel>}
   {tab==="anniversari-e-solidarieta"&&<Panel title="Ricorrenze e solidarietà"><p>La gestione delle ricorrenze e delle raccolte non è ancora operativa. Nessuna modifica simulata.</p></Panel>}
  </>}
  <section className="oa-audit"><div className="oa-flex"><h2>Storico degli interventi in questo contesto</h2><button type="button" onClick={loadEvents} disabled={busy}>Aggiorna storico</button></div>
   {events===null?<p>Apri lo storico per vedere operazione, ora e dati prima/dopo.</p>:events.length?events.map((event,i)=><article key={i}><strong>{event.action}</strong> <small>{new Date(event.at).toLocaleString("it-IT")}</small>
     {event.reason&&<p>Motivazione: {event.reason}</p>}<details><summary>Dettaglio</summary><pre>{JSON.stringify({prima:event.before,dopo:event.after},null,2)}</pre></details></article>):<p>Nessuna operazione registrata.</p>}
  </section>
  <p className="oa-footer">Contesto valido fino alle {new Date(snapshot.expires_at).toLocaleString("it-IT")}. Alla scadenza o all’uscita, ulteriori azioni sono negate dal database.</p>
 </div>;
}
