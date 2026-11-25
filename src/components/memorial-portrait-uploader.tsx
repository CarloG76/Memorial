"use client";
import {useEffect,useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {memorialPortraitSrc} from "@/lib/memorial-portrait-url";
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
  setError("");setMessage("");setBusy(true);
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key=memorialId+"/"+crypto.randomUUID()+"."+ext;
  const stored=await db.storage.from("memorial-portraits").upload(key,file,{upsert:false,contentType:file.type,cacheControl:"3600"});
  if(stored.error){setError("Caricamento non riuscito: "+stored.error.message);setBusy(false);return;}
  const saved=await db.rpc(contextKey?"agency_family_set_memorial_portrait":"set_memorial_portrait",{memorial_key:memorialId,object_key:key,...(contextKey?{context_key:contextKey}:{})});
  if(saved.error){setError("Foto caricata, ma salvataggio del ritratto non riuscito: "+saved.error.message);setBusy(false);return;}
  const path=String(saved.data);
  setPicture(path);setFile(null);setMessage("Foto salvata su Supabase e collegata a "+personName+".");onSaved?.(path);
  setBusy(false);
 }
 function choose(f:File|null){
  setError("");setMessage("");
  if(!f){setFile(null);return;}
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)){setError("Sono accettati solo JPG, PNG e WebP.");return;}
  if(f.size<1||f.size>5*1024*1024){setError("Dimensione massima: 5 MB.");return;}
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
