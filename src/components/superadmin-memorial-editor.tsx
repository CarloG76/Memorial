"use client";
import {useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import Link from "next/link";
import {SuperadminMemorialMedia} from "./superadmin-memorial-media";
import "./superadmin-memorial-editor.css";

export type EditorialHistory={actor:string|null;action:string;before:Record<string,unknown>;after:Record<string,unknown>;at:string};
export type MemorialPresentation={
 memorial_id:string;name:string;tier:string;status:string;is_demo:boolean;
 dedication:string;biography:string;portrait_url:string;portrait_focus_x:number;
 background:string;photos:{id:string;title:string;subtitle:string;image_url:string;position:number}[];presets:{id:string;label:string;image_url:string}[];history:EditorialHistory[];
};
export function SuperadminMemorialEditor({initial}:{initial:MemorialPresentation}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [data,setData]=useState(initial);
 const [name,setName]=useState(initial.name??"");
 const [dedication,setDedication]=useState(initial.dedication??"");
 const [biography,setBiography]=useState(initial.biography??"");
 const [portraitUrl,setPortraitUrl]=useState(initial.portrait_url??"");
 const [focus,setFocus]=useState(initial.portrait_focus_x??42);
 const [reason,setReason]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setSaving(true);setMessage("");
  const changes={name,dedication,biography,portrait_url:portraitUrl,portrait_focus_x:focus};
  const r=await db.rpc("platform_update_memorial_presentation",{target_memorial:data.memorial_id,changes,reason});
  if(r.error){setMessage("Errore: "+r.error.message);setSaving(false);return;}
  const next=await db.rpc("platform_get_memorial_presentation",{target_memorial:data.memorial_id});
  if(next.error){setMessage("Salvato, ma non è stato possibile ricaricare lo storico.");}
  else{setData(next.data as MemorialPresentation);setReason("");setMessage("Salvato in Supabase. Modifica tracciata nello storico.");}
  setSaving(false);
 }
 return <div className="me-layout">
  <header className="me-head"><div><span className="workspace-label">SUPERADMIN / MODIFICA MEMORIALE</span><h1>{data.name}</h1>
   <p>Modifica anche i contenuti DEMO. Tutte le operazioni sono verificate sul server e registrate nel database.</p></div>
   <span className="me-tag">{data.is_demo?"DEMO":"REALE"} · {data.status}</span></header>
  <div className="me-grid"><form className="me-card" onSubmit={save}>
    <h2>Presentazione pubblica</h2>
    <label htmlFor="me-name">Nome e cognome</label><input id="me-name" value={name} onChange={e=>setName(e.target.value)} maxLength={180} required/>
    <label htmlFor="me-dedication">Dedica</label><textarea id="me-dedication" value={dedication} onChange={e=>setDedication(e.target.value)} rows={3} maxLength={500}/>
    <label htmlFor="me-bio">Biografia</label><textarea id="me-bio" value={biography} onChange={e=>setBiography(e.target.value)} rows={8} maxLength={8000}/>
    <label htmlFor="me-portrait">Percorso dell'immagine ritratto</label><input id="me-portrait" value={portraitUrl} onChange={e=>setPortraitUrl(e.target.value)} placeholder="/images/ritratto.webp"/>
    <label htmlFor="me-focus">Posizione orizzontale del ritratto: {focus}%</label><input type="range" id="me-focus" min={0} max={100} value={focus} onChange={e=>setFocus(Number(e.target.value))}/>
    <label htmlFor="me-reason">Motivazione della modifica (obbligatoria)</label>
    <textarea id="me-reason" value={reason} onChange={e=>setReason(e.target.value)} minLength={8} maxLength={500} rows={2} required placeholder="Descrivi perché modifichi questo memoriale"/>
    <button type="submit" disabled={saving||reason.trim().length<8}>{saving?"Salvataggio…":"Salva e registra modifica"}</button>
    {message&&<p className="me-message" role="status">{message}</p>}
   </form>
   <section className="me-card"><h2>Anteprima ritratto</h2>
    {portraitUrl?<div className="me-portrait" role="img" aria-label="Anteprima del ritratto" style={{backgroundImage:"url("+portraitUrl+")",backgroundPosition:focus+"% 50%"}}/>:<p>Nessuna foto selezionata.</p>}
    <p>Paesaggio pubblicato: <strong>{data.background}</strong>. La famiglia gestisce le modifiche ordinarie; il SuperAdmin può intervenire con tracciamento.</p>
    {data.is_demo&&<Link href="/memoriale/demo" target="_blank" rel="noopener noreferrer">Apri il memoriale pubblico →</Link>}
   </section>
  </div>
  <SuperadminMemorialMedia data={data} onUpdate={next=>setData(next)}/>
  <section className="me-card me-history"><h2>Registro delle modifiche</h2>
   {data.history.length===0?<p>Non ci sono ancora modifiche amministrative registrate per questa presentazione.</p>:(
    <div className="me-events">{data.history.map((h,i)=><article key={i}>
     <div><strong>{h.action}</strong><span>{new Date(h.at).toLocaleString("it-IT")}</span></div>
     <p>Autore: <code>{h.actor??"Sistema · importazione autorizzata"}</code></p>
     <details><summary>Valori prima e dopo</summary><pre>{JSON.stringify({prima:h.before,dopo:h.after},null,2)}</pre></details>
    </article>)}</div>
   )}
  </section>
 </div>;
}
