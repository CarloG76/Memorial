"use client";
import {useEffect,useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {memorialPortraitSrc} from "@/lib/memorial-portrait-url";
import {validatePortraitFile} from "@/lib/portrait-validation";
import "./memorial-portrait-uploader.css";

export function MemorialPortraitUploader({memorialId,personName,initialUrl,onSaved,disabled=false,contextKey}:{
 memorialId:string;personName:string;initialUrl?:string|null;
 onSaved?:(url:string)=>void;disabled?:boolean;contextKey?:string;
}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [picture,setPicture]=useState(initialUrl??"");
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)setPicture(initialUrl??"");});return ()=>{active=false;};},[initialUrl,memorialId]);
 useEffect(()=>{
  let active=true;
  if(!file){void Promise.resolve().then(()=>{if(active)setPreview("");});return ()=>{active=false;};}
  const url=URL.createObjectURL(file);
  void Promise.resolve().then(()=>{if(active)setPreview(url);});
  return ()=>{active=false;URL.revokeObjectURL(url);};
 },[file]);
 async function upload(){
  if(!file||busy||disabled)return;
  const validation=validatePortraitFile(file);
  if(!validation.ok){setFile(null);setError(validation.message);return;}
  setError("");setMessage("");setBusy(true);
  const key=memorialId+"/"+crypto.randomUUID()+"."+validation.extension;
  try{
   const uploaded=await db.storage.from("memorial-portraits").upload(key,file,{
    upsert:false,contentType:file.type,cacheControl:"3600"
   });
   if(uploaded.error){setError("Caricamento non riuscito: "+uploaded.error.message);return;}
   // The RPC rechecks the actor, memorial and context. Upload success alone
   // never means that the portrait is linked to the memorial.
   const saved=await db.rpc(contextKey?"agency_family_set_memorial_portrait":"set_memorial_portrait",{
    memorial_key:memorialId,object_key:key,...(contextKey?{context_key:contextKey}:{})
   });
   if(saved.error){
    const cleanup=await db.storage.from("memorial-portraits").remove([key]);
    setError("Foto caricata ma non collegata: "+saved.error.message+
     (cleanup.error?" Il file non è stato eliminato automaticamente; segnala il problema all'assistenza.":" Il caricamento non valido è stato rimosso."));
    return;
   }
   if(typeof saved.data!=="string"||!saved.data.startsWith("/storage/v1/object/public/memorial-portraits/")){
    setError("Il server non ha confermato il percorso del ritratto. Aggiorna la pagina per verificarne il salvataggio prima di riprovare.");
    return;
   }
   setPicture(saved.data);
   setFile(null);
   setMessage("Foto salvata su Supabase e collegata a "+personName+".");
   onSaved?.(saved.data);
  }catch{
   // Network interruption might occur after the server committed a change;
   // never delete that file blindly or trigger an automatic retry.
   setError("Connessione interrotta. Aggiorna la pagina e verifica se il ritratto è stato salvato prima di riprovare.");
  }finally{
   setBusy(false);
  }
 }
 function choose(f:File|null){
  setError("");setMessage("");
  if(!f){setFile(null);return;}
  const result=validatePortraitFile(f);
  if(!result.ok){setFile(null);setError(result.message);return;}
  setFile(f);
 }
 return <section className="mpu-section">
  <h3>Fotografia della persona ricordata</h3>
  <p>Il ritratto è associato esclusivamente al memoriale di <strong>{personName}</strong>.</p>
  <div className="mpu-main">
   <div className="mpu-preview">{(preview||picture)?<img src={preview||memorialPortraitSrc(picture)} alt={"Ritratto di "+personName}/>:<span>Nessun ritratto caricato</span>}</div>
   <div className="mpu-controls">
    <label>Carica la fotografia del defunto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||disabled} onChange={e=>choose(e.target.files?.[0]??null)}/></label>
    <p>JPG, PNG o WebP · massimo 5 MB. La fotografia viene salvata, non resta soltanto in anteprima.</p>
    <button type="button" disabled={!file||busy||disabled} onClick={()=>void upload()}>{busy?"Caricamento…":"Salva fotografia su Memorial"}</button>
   </div>
  </div>
  {error&&<p className="mpu-error" role="alert">{error}</p>}
  {message&&<p className="mpu-success" role="status">{message}</p>}
 </section>;
}
