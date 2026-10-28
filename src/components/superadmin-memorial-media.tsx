"use client";
import {useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import type {MemorialPresentation} from "./superadmin-memorial-editor";

type Photo=MemorialPresentation["photos"][number];
export function SuperadminMemorialMedia({data,onUpdate}:{data:MemorialPresentation;onUpdate:(v:MemorialPresentation)=>void}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [preset,setPreset]=useState(data.background);
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [editId,setEditId]=useState<string|null>(null);
 const [title,setTitle]=useState("");
 const [subtitle,setSubtitle]=useState("");
 const [imageUrl,setImageUrl]=useState("");
 const [position,setPosition]=useState(1);
 async function reload(success:string){
  const res=await db.rpc("platform_get_memorial_presentation",{target_memorial:data.memorial_id});
  if(res.error)setMessage("Modifica applicata, ma caricamento storico non riuscito.");
  else{const next=res.data as MemorialPresentation;onUpdate(next);setPreset(next.background);setMessage(success);}
  setBusy(false);
 }
 async function publishBackground(){
  if(reason.trim().length<8)return;
  if(!window.confirm("Pubblicare questo sfondo per il memoriale? L'operazione verrà registrata."))return;
  setBusy(true);setMessage("");
  const r=await db.rpc("platform_override_memorial_background",{target_memorial:data.memorial_id,chosen_preset:preset,reason});
  if(r.error){setMessage(r.error.message);setBusy(false);return;}
  setReason("");await reload("Sfondo pubblico aggiornato e registrato.");
 }
 function resetPhoto(){setEditId(null);setTitle("");setSubtitle("");setImageUrl("");setPosition(Math.min(99,Math.max(1,...data.photos.map(x=>x.position))+1));}
 function editPhoto(p:Photo){setEditId(p.id);setTitle(p.title);setSubtitle(p.subtitle);setImageUrl(p.image_url);setPosition(p.position);setMessage("");}
 async function savePhoto(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(reason.trim().length<8)return;
  setBusy(true);setMessage("");
  const r=await db.rpc("platform_upsert_memorial_gallery_photo",{target_memorial:data.memorial_id,photo_id:editId,photo_title:title,photo_subtitle:subtitle,photo_url:imageUrl,photo_position:position,reason});
  if(r.error){setMessage(r.error.message);setBusy(false);return;}
  resetPhoto();setReason("");await reload("Fotografia salvata nel database e registrata nello storico.");
 }
 async function deletePhoto(p:Photo){
  if(reason.trim().length<8){setMessage("Inserisci una motivazione di almeno otto caratteri.");return;}
  if(!window.confirm("Eliminare definitivamente questa fotografia dalla galleria?"))return;
  setBusy(true);
  const r=await db.rpc("platform_delete_memorial_gallery_photo",{target_memorial:data.memorial_id,photo_id:p.id,reason});
  if(r.error){setMessage(r.error.message);setBusy(false);return;}
  setReason("");resetPhoto();await reload("Fotografia eliminata e operazione registrata.");
 }
 return <div className="me-media">
  <section className="me-card">
   <h2>Sfondo del memoriale</h2>
   <p>Scelta SuperAdmin con registrazione della motivazione. Il visitatore vede soltanto lo sfondo pubblicato.</p>
   <div className="me-presets">{data.presets.map(p=><button key={p.id} type="button" onClick={()=>setPreset(p.id)} className={preset===p.id?"me-preset me-selected":"me-preset"} aria-pressed={preset===p.id} disabled={busy}>
     <span style={{backgroundImage:"url("+p.image_url+")"}}/><strong>{p.label}</strong>
    </button>)}</div>
   <label htmlFor="me-media-reason">Motivazione delle modifiche a sfondi e foto</label>
   <textarea id="me-media-reason" value={reason} onChange={e=>setReason(e.target.value)} rows={2} minLength={8} maxLength={500} placeholder="Motivazione obbligatoria per audit"/>
   <button type="button" onClick={publishBackground} disabled={busy||reason.trim().length<8||preset===data.background}>Pubblica sfondo scelto</button>
  </section>
  <section className="me-card">
   <h2>Fotografie del memoriale</h2>
   <p>Gestione reale della galleria, inclusi i record DEMO. Immagini esistenti o asset caricati nel progetto.</p>
   <div className="me-gallery">{data.photos.map(photo=><article key={photo.id} className="me-gallery-row">
     <div className="me-gallery-thumb" style={{backgroundImage:"url("+photo.image_url+")"}} role="img" aria-label={photo.title}/>
     <div><strong>{photo.position}. {photo.title}</strong><p>{photo.subtitle}</p></div>
     <div className="me-gallery-actions"><button type="button" disabled={busy} onClick={()=>editPhoto(photo)}>Modifica</button><button type="button" disabled={busy||reason.trim().length<8} onClick={()=>deletePhoto(photo)}>Elimina</button></div>
    </article>)}</div>
   <form onSubmit={savePhoto} className="me-gallery-form">
    <h3>{editId?"Modifica fotografia":"Aggiungi fotografia"}</h3>
    <label htmlFor="me-gallery-title">Titolo</label><input id="me-gallery-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required/>
    <label htmlFor="me-gallery-subtitle">Descrizione</label><input id="me-gallery-subtitle" value={subtitle} onChange={e=>setSubtitle(e.target.value)} maxLength={350}/>
    <label htmlFor="me-gallery-url">URL immagine (asset Memorial o Unsplash)</label><input id="me-gallery-url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} required placeholder="/images/fotografia.webp"/>
    <label htmlFor="me-gallery-position">Ordine</label><input id="me-gallery-position" type="number" min={1} max={99} value={position} onChange={e=>setPosition(Number(e.target.value))} required/>
    <button type="submit" disabled={busy||reason.trim().length<8}>{busy?"Salvataggio…":editId?"Aggiorna fotografia":"Aggiungi fotografia"}</button>
    {editId&&<button type="button" onClick={resetPhoto}>Annulla modifica</button>}
   </form>
   {message&&<p role="status" className="me-message">{message}</p>}
  </section>
 </div>;
}
