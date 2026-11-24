"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {MemorialPortraitUploader} from "./memorial-portrait-uploader";
import {MilestonesEditor,normalizeMilestones,validMilestoneDate,type MemorialMilestone} from "./memorial-milestones-editor";
import "./family-memorial-content-editor.css";

type Profile={name:string;dedication:string;biography:string;highlights:MemorialMilestone[];portrait_url:string|null;portrait_focus_x:number|null};
export function FamilyMemorialContentEditor({memorialId,memorialName,portraitUrl=null,contextKey}:{memorialId:string;memorialName:string;portraitUrl?:string|null;contextKey?:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [name,setName]=useState(memorialName);
 const [dedication,setDedication]=useState("");
 const [bio,setBio]=useState("");
 const [milestones,setMilestones]=useState<MemorialMilestone[]>([]);
 useEffect(()=>{
  let active=true;
  void db.rpc(contextKey?"family_get_memorial_editor_context":"family_get_memorial_editor",{target_memorial:memorialId,...(contextKey?{context_key:contextKey}:{})}).then(({data,error:dbError})=>{
   if(!active)return;
   if(dbError||!data){setError("Impossibile caricare il memoriale: "+(dbError?.message??"non disponibile"));setLoading(false);return;}
   const p=data as Profile;
   setName(p.name??memorialName);setDedication(p.dedication??"");setBio(p.biography??"");
   setMilestones(normalizeMilestones(p.highlights));setLoading(false);
  });
  return ()=>{active=false;};
 },[db,memorialId,memorialName,contextKey]);
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving||loading)return;
  setError("");setMessage("");
  if(milestones.some(x=>!validMilestoneDate(x.date)||!x.detail.trim())){setError("Controlla le date e le didascalie delle tappe.");return;}
  setSaving(true);
  const r=await db.rpc(contextKey?"family_save_memorial_editor_context":"family_save_memorial_editor",{target_memorial:memorialId,
   changes:{name,dedication,biography:bio,highlights:milestones},reason:null,...(contextKey?{context_key:contextKey}:{})});
  if(r.error)setError("Salvataggio non riuscito: "+r.error.message);
  else setMessage("Biografia e tappe salvate. Il memoriale resta in preparazione finché non viene pubblicato.");
  setSaving(false);
 }
 return <section className="fmce-card"><h2>{memorialName} · Contenuto del memoriale</h2>
  {loading?<p>Caricamento contenuti…</p>:
  <form onSubmit={e=>void save(e)}>
   <label>Nome della persona<input required minLength={3} maxLength={180} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>Dedica<textarea rows={2} maxLength={500} value={dedication} onChange={e=>setDedication(e.target.value)}/></label>
   <label>Biografia · descrizione della persona<textarea rows={5} maxLength={8000} value={bio} onChange={e=>setBio(e.target.value)}/></label>
   <fieldset><legend>Storia · tappe della vita</legend><MilestonesEditor items={milestones} onChange={setMilestones} disabled={saving}/></fieldset>
   <button className="fmce-save" disabled={saving} type="submit">{saving?"Salvataggio…":"Salva biografia e storia"}</button>
  </form>}
  <MemorialPortraitUploader memorialId={memorialId} personName={name||memorialName} initialUrl={portraitUrl}/>
  {error&&<p role="alert" className="fmce-error">{error}</p>}
  {message&&<p role="status" className="fmce-ok">{message}</p>}
 </section>;
}
