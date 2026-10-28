"use client";
import { useEffect,useMemo,useRef,useState,type ChangeEvent } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { MemorialBackgroundPreset } from "@/lib/memorial-backgrounds";
import "./family-background-editor.css";

export type FamilyHeroMemorial={
 id:string;name:string;status:string;tier:string;
 draft:MemorialBackgroundPreset;published:MemorialBackgroundPreset;
 canEdit:boolean;canPublish:boolean;portraitUrl:string|null;
};
export type FamilyBackgroundOption={id:MemorialBackgroundPreset;label:string;image_url:string};
export function FamilyBackgroundEditor({memorials,presets}:{memorials:FamilyHeroMemorial[];presets:FamilyBackgroundOption[]}){
 const [records,setRecords]=useState(memorials);
 const [currentId,setCurrentId]=useState(memorials[0]?.id??"");
 const [selected,setSelected]=useState<MemorialBackgroundPreset|"custom">(memorials[0]?.draft??"montagna");
 const [upload,setUpload]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const [saving,setSaving]=useState(false);
 const uploadRef=useRef<string|null>(null);
 const current=records.find(x=>x.id===currentId);
 const client=useMemo(()=>createBrowserSupabaseClient(),[]);
 useEffect(()=>()=>{if(uploadRef.current)URL.revokeObjectURL(uploadRef.current);},[]);
 const fallback=presets[0]?.image_url??"";
 const background=selected==="custom"?(upload??fallback):(presets.find(p=>p.id===selected)?.image_url??fallback);
 function switchMemorial(id:string){
  const rec=records.find(x=>x.id===id);if(!rec)return;
  setCurrentId(id);setSelected(rec.draft);setMessage("");
  if(uploadRef.current){URL.revokeObjectURL(uploadRef.current);uploadRef.current=null;}setUpload(null);
 }
 function selectPreset(next:MemorialBackgroundPreset){setSelected(next);setMessage("");}
 function chooseFile(event:ChangeEvent<HTMLInputElement>){
  const f=event.target.files?.[0];if(!f)return;
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>6*1024*1024){
   setMessage("Accettati JPG, PNG o WebP fino a 6 MB.");event.target.value="";return;
  }
  const url=URL.createObjectURL(f);
  if(uploadRef.current)URL.revokeObjectURL(uploadRef.current);
  uploadRef.current=url;setUpload(url);setSelected("custom");
  setMessage("Anteprima locale: la foto personale non viene ancora caricata sul server.");
 }
 async function saveDraft(){
  if(!current||!current.canEdit||selected==="custom")return;
  setSaving(true);setMessage("");
  const result=await client.rpc("save_memorial_background_draft",{target_memorial:current.id,chosen_preset:selected});
  setSaving(false);
  if(result.error){setMessage("Salvataggio non riuscito: "+result.error.message);return;}
  setRecords(prev=>prev.map(x=>x.id===current.id?{...x,draft:selected}:x));
  setMessage("Bozza salvata. Lo sfondo pubblico non cambia finché il titolare non lo approva.");
 }
 async function publish(){
  if(!current||!current.canPublish||current.status!=="PUBLISHED_ACTIVE")return;
  setSaving(true);setMessage("");
  const result=await client.rpc("publish_memorial_background",{target_memorial:current.id});
  setSaving(false);
  if(result.error){setMessage("Pubblicazione non riuscita: "+result.error.message);return;}
  const updated=result.data as MemorialBackgroundPreset;
  setRecords(prev=>prev.map(x=>x.id===current.id?{...x,published:updated}:x));
  setMessage("Sfondo approvato e pubblicato. La pagina visitatore mostra ora questa scelta.");
 }
 return <div className="fb-editor">
  <div className="fb-header"><div><span className="fb-eyebrow">AREA FAMIGLIA · PROFILO E STORIA</span><h1>Aspetto del memoriale</h1><p>La famiglia sceglie il paesaggio dietro alla fotografia della persona ricordata. Il visitatore vede soltanto la versione approvata.</p></div><Link href="/memoriale/demo" className="fb-public-link">Vedi il memoriale demo ↗</Link></div>
  {records.length===0?<section className="fb-panel">Non ci sono memoriali associati al tuo account.</section>:
  <div className="fb-layout">
   <section className="fb-panel fb-settings">
    <label htmlFor="fb-memorial">Memoriale</label>
    <select id="fb-memorial" value={currentId} onChange={e=>switchMemorial(e.target.value)}>
     {records.map(r=><option key={r.id} value={r.id}>{r.name} · {r.status}</option>)}
    </select>
    <h2>Paesaggio di sfondo</h2>
    <p>La foto del defunto resta separata dallo sfondo e sfuma verso il paesaggio.</p>
    <div className="fb-options">{presets.map(item=><button type="button" key={item.id} className={selected===item.id?"fb-tile fb-active":"fb-tile"} onClick={()=>selectPreset(item.id)} disabled={!current?.canEdit} aria-pressed={selected===item.id}>
      <span className="fb-tile-img" style={{backgroundImage:"url("+item.image_url+")"}}/><span>{item.label}</span>{selected===item.id&&<b aria-hidden="true">✓</b>}</button>)}</div>
    <div className="fb-custom"><label htmlFor="fb-upload">Oppure carica un tuo sfondo</label><input id="fb-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={!current?.canEdit}/><p>Immagine personale: disponibile in anteprima locale. Il caricamento definitivo sarà attivato con la gestione media protetta della Famiglia.</p></div>
    <div className="fb-current"><span>Bozza salvata: <strong>{current?.draft}</strong></span><span>Pubblicato: <strong>{current?.published}</strong></span></div>
    <div className="fb-buttons"><button type="button" className="fb-primary" disabled={!current?.canEdit||saving||selected==="custom"} onClick={saveDraft}>{saving?"Salvataggio…":"Salva bozza"}</button>
      {current?.canPublish&&<button type="button" className="fb-secondary" disabled={saving||current.status!=="PUBLISHED_ACTIVE"||current.draft===current.published} onClick={publish}>Approva e pubblica</button>}</div>
    {message&&<p className="fb-message" role="status">{message}</p>}
    {current?.status!=="PUBLISHED_ACTIVE"&&<p className="fb-note">La pubblicazione dello sfondo sarà possibile dopo la pubblicazione del memoriale.</p>}
   </section>
   <div className="fb-preview-wrap"><div className="fb-preview-label">ANTEPRIMA PRIVATA · SOLO FAMIGLIA</div><div className="fb-preview" style={{backgroundImage:"linear-gradient(90deg,transparent,#061e32bd),url("+background+")"}}>
     {current?.portraitUrl?<div className="fb-preview-portrait" style={{backgroundImage:"url("+current.portraitUrl+")"}} aria-label="Ritratto commemorativo"/>:<div className="fb-preview-placeholder">Foto della persona da caricare</div>}
     <div className="fb-preview-name"><span>IN RICORDO DI</span><strong>{current?.name}</strong></div>
    </div>
    <div className="fb-preview-help">Il ritratto è sempre in primo piano. L&apos;immagine di sfondo può essere modificata dalla famiglia, non dai visitatori.</div></div>
  </div>}</div>;
}
