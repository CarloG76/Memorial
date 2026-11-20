"use client";
import {useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

export function FamilyDirectMemory({memorialId,memorialName,contextKey,onCreated}:{
 memorialId:string;memorialName:string;contextKey?:string;onCreated?:()=>void
}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [title,setTitle]=useState("");
 const [body,setBody]=useState("");
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving)return;
  setError("");setMessage("");setSaving(true);
  const result=await db.rpc("family_create_direct_memory",{
   target_memorial:memorialId,memory_title:title,memory_body:body,context_key:contextKey??null
  });
  setSaving(false);
  if(result.error){setError("Salvataggio non riuscito: "+result.error.message);return;}
  setTitle("");setBody("");
  setMessage("Ricordo salvato e approvato automaticamente. Sarà visibile ai visitatori quando il memoriale sarà pubblico.");
  onCreated?.();
 }
 return <section className="workspace-panel" style={{marginBlock:18}}>
  <h2>Aggiungi un ricordo a {memorialName}</h2>
  <p>Un familiare autorizzato pubblica i propri ricordi senza passare dalla coda di approvazione dei visitatori.</p>
  <form onSubmit={e=>void save(e)} style={{display:"grid",gap:12,maxWidth:720}}>
   <label style={{display:"grid",gap:6}}>Titolo<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={2} maxLength={180}/></label>
   <label style={{display:"grid",gap:6}}>Ricordo<textarea value={body} onChange={e=>setBody(e.target.value)} required minLength={10} maxLength={10000} rows={4}/></label>
   <button disabled={saving} type="submit">{saving?"Salvataggio…":"Salva e pubblica il ricordo"}</button>
  </form>
  {message&&<p role="status">{message}</p>}
  {error&&<p role="alert" style={{color:"#9b3030"}}>{error}</p>}
 </section>;
}
