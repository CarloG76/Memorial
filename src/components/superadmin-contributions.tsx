"use client";
import {useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./superadmin-contributions.css";
export type Contribution={id:string;title?:string;author?:string;body:string;status:string};
export type ContributionSet={thoughts:Contribution[];memories:Contribution[]};
type Resource="THOUGHT"|"MEMORY";
type Action="CREATE"|"EDIT"|"APPROVE"|"REJECT"|"DELETE";
function ContributionRow({item,resource,onChange,busy}:{item:Contribution;resource:Resource;busy:boolean;onChange:(action:Action,item:Contribution)=>void}){
 const [label,setLabel]=useState(resource==="THOUGHT"?(item.author??""):(item.title??""));
 const [body,setBody]=useState(item.body);
 return <article className="mc-row">
  <header><strong>{resource==="THOUGHT"?"Pensiero":"Ricordo"}</strong><span className={"mc-status mc-"+item.status.toLowerCase()}>{item.status}</span></header>
  <label>{resource==="THOUGHT"?"Autore":"Titolo"}<input value={label} onChange={e=>setLabel(e.target.value)} maxLength={resource==="THOUGHT"?80:180}/></label>
  <label>Testo<textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={resource==="THOUGHT"?2000:10000} rows={3}/></label>
  <div className="mc-actions">
   <button type="button" disabled={busy} onClick={()=>onChange("EDIT",{...item,...(resource==="THOUGHT"?{author:label}:{title:label}),body})}>Salva modifiche</button>
   {item.status!=="APPROVED"&&<button type="button" disabled={busy} onClick={()=>onChange("APPROVE",item)}>Approva</button>}
   {item.status!=="REJECTED"&&<button type="button" disabled={busy} onClick={()=>onChange("REJECT",item)}>Rifiuta</button>}
   <button className="mc-danger" type="button" disabled={busy} onClick={()=>onChange("DELETE",item)}>Elimina</button>
  </div>
 </article>;
}
export function SuperadminMemorialContributions({memorialId,initial}:{memorialId:string;initial:ContributionSet}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [entries,setEntries]=useState(initial);
 const [version,setVersion]=useState(0);
 const [busy,setBusy]=useState(false);
 const [reason,setReason]=useState("");
 const [message,setMessage]=useState("");
 const [resource,setResource]=useState<Resource>("THOUGHT");
 const [label,setLabel]=useState("");
 const [body,setBody]=useState("");
 async function update(action:Action,item:Contribution,kind:Resource){
  if(reason.trim().length<8){setMessage("Inserisci una motivazione di almeno 8 caratteri.");return;}
  if(action==="DELETE"&&!window.confirm("Eliminare definitivamente il contenuto? L'azione verrà registrata."))return;
  setBusy(true);setMessage("");
  const fields=action==="CREATE"||action==="EDIT"?
    kind==="THOUGHT"?{author:item.author,body:item.body}:{title:item.title,body:item.body}: {};
  const result=await db.rpc("platform_manage_memorial_contribution",{
   target_memorial:memorialId,resource:kind,record_id:action==="CREATE"?null:item.id,
   operation:action,fields,reason
  });
  if(result.error){setMessage("Operazione non riuscita: "+result.error.message);setBusy(false);return;}
  const updated=await db.rpc("platform_get_memorial_contributions",{target_memorial:memorialId});
  if(updated.error)setMessage("Operazione eseguita, ma non è possibile aggiornare l'elenco.");
  else{
   setEntries(updated.data as ContributionSet);setVersion(v=>v+1);
   setReason("");setLabel("");setBody("");
   setMessage("Modifica salvata su Supabase e registrata nell'audit.");
  }
  setBusy(false);
 }
 function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  void update("CREATE",{id:"",body,...(resource==="THOUGHT"?{author:label}:{title:label}),status:"PENDING"},resource);
 }
 return <section className="me-card mc-editor">
  <h2>Ricordi e pensieri · gestione SuperAdmin</h2>
  <p>Modifica, approva, rifiuta o elimina contributi, anche DEMO. Solo i contenuti approvati compaiono nel memoriale pubblico.</p>
  <label htmlFor="mc-reason">Motivazione obbligatoria per ogni operazione</label>
  <textarea id="mc-reason" value={reason} onChange={e=>setReason(e.target.value)} rows={2} minLength={8} maxLength={500} placeholder="Indica la motivazione, registrata in audit"/>
  <div className="mc-collections" key={version}>
   {(["THOUGHT","MEMORY"] as Resource[]).map(kind=><section key={kind}>
    <h3>{kind==="THOUGHT"?"Pensieri":"Ricordi"} ({kind==="THOUGHT"?entries.thoughts.length:entries.memories.length})</h3>
    {(kind==="THOUGHT"?entries.thoughts:entries.memories).map(item=><ContributionRow key={item.id} item={item} resource={kind} busy={busy} onChange={(action,x)=>void update(action,x,kind)}/>)}
   </section>)}
  </div>
  <form className="mc-create" onSubmit={create}>
   <h3>Aggiungi un contenuto</h3>
   <label>Tipo
    <select value={resource} onChange={e=>setResource(e.target.value as Resource)}><option value="THOUGHT">Pensiero</option><option value="MEMORY">Ricordo</option></select>
   </label>
   <label>{resource==="THOUGHT"?"Autore":"Titolo"}<input value={label} onChange={e=>setLabel(e.target.value)} required maxLength={resource==="THOUGHT"?80:180}/></label>
   <label>Testo<textarea value={body} onChange={e=>setBody(e.target.value)} minLength={10} required rows={4} maxLength={resource==="THOUGHT"?2000:10000}/></label>
   <button disabled={busy||reason.trim().length<8} type="submit">Crea in attesa di approvazione</button>
  </form>
  {message&&<p className="me-message" role="status">{message}</p>}
 </section>;
}
