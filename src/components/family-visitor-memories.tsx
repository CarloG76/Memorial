"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./family-visitor-memories.css";

type Proposal={id:string;title:string;author:string|null;body:string;status:"PENDING"|"APPROVED"|"REJECTED";photo_url:string|null;created_at:string};
export function FamilyVisitorMemories({memorialId,contextKey=null,memorialName}:{memorialId:string;contextKey?:string|null;memorialName?:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [items,setItems]=useState<Proposal[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const headers=useCallback(async()=>{
  const {data,error:authError}=await db.auth.getSession();
  if(authError||!data.session?.access_token)throw new Error("Accedi come responsabile famiglia per gestire le proposte.");
  return {Authorization:"Bearer "+data.session.access_token};
 },[db]);
 const refresh=useCallback(async()=>{
  if(!endpoint){setError("Servizio proposte non configurato.");setLoading(false);return;}
  try{
   const authHeaders=await headers();
   const query=new URLSearchParams({action:"list",memorial_id:memorialId});
   if(contextKey)query.set("context_key",contextKey);
   const res=await fetch(endpoint+"/functions/v1/visitor-memory-flow?"+query,{headers:authHeaders,cache:"no-store"});
   const json=await res.json();
   if(!res.ok||!json.memories)throw new Error(json.error??"Impossibile caricare le proposte.");
   setItems(json.memories as Proposal[]);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Impossibile caricare le proposte.");}
  finally{setLoading(false);}
 },[endpoint,memorialId,contextKey,headers]);
 useEffect(()=>{void refresh();},[refresh]);
 async function moderate(item:Proposal,action:"APPROVE"|"REJECT"){
  if(busy)return;
  setBusy(item.id);setError("");setNotice("");
  try{
   if(!endpoint)throw new Error("Servizio non configurato.");
   const h=await headers();
   const res=await fetch(endpoint+"/functions/v1/visitor-memory-flow?action=moderate",{
    method:"POST",headers:{...h,"Content-Type":"application/json"},
    body:JSON.stringify({memorial_id:memorialId,context_key:contextKey,record_id:item.id,action})
   });
   const json=await res.json();
   if(!res.ok||!json.ok)throw new Error(json.error??"Operazione non riuscita.");
   setNotice(action==="APPROVE"?"Ricordo approvato e pubblicato. Aggiorna il memoriale pubblico per vederlo.":"Ricordo rifiutato: non compare sul memoriale pubblico.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Operazione non riuscita.");}
  finally{setBusy(null);}
 }
 const pending=items.filter(m=>m.status==="PENDING");
 const decided=items.filter(m=>m.status!=="PENDING");
 return <section className="family-visitor-memories" aria-label="Proposte dei visitatori">
  <div className="family-visitor-heading">
   <div><h2>Ricordi proposti dai visitatori</h2><p>{memorialName?memorialName+" · ":""}Le fotografie restano private fino all'approvazione.</p></div>
   <button type="button" onClick={()=>void refresh()} disabled={loading||!!busy}>Aggiorna proposte</button>
  </div>
  {error&&<p role="alert" className="family-visitor-error">{error}</p>}
  {notice&&<p role="status" className="family-visitor-success">{notice}</p>}
  {loading?<p>Caricamento ricordi…</p>:<>
    <p className="family-visitor-count"><strong>{pending.length}</strong> proposte in attesa · {decided.length} già esaminate</p>
    {pending.length===0&&<p>Nessuna proposta da approvare. Quando un visitatore invia un ricordo dal memoriale, comparirà qui.</p>}
    {pending.map(item=><article key={item.id} className="family-visitor-card">
     <div className="family-visitor-meta"><strong>{item.author??"Visitatore"}</strong><span>{new Date(item.created_at).toLocaleString("it-IT")}</span></div>
     <h3>{item.title}</h3><p>{item.body}</p>
     {item.photo_url&&<img src={item.photo_url} alt={"Fotografia proposta da "+(item.author??"un visitatore")} className="family-visitor-photo"/>}
     <div className="family-visitor-actions">
      <button type="button" disabled={!!busy} onClick={()=>void moderate(item,"APPROVE")}>{busy===item.id?"Salvataggio…":"Approva e pubblica"}</button>
      <button type="button" className="family-visitor-reject" disabled={!!busy} onClick={()=>void moderate(item,"REJECT")}>Rifiuta</button>
     </div>
    </article>)}
    {decided.length>0&&<details className="family-visitor-history"><summary>Già esaminati ({decided.length})</summary>
      {decided.map(item=><article className="family-visitor-card" key={item.id}>
       <div className="family-visitor-meta"><strong>{item.author??"Visitatore"}</strong><span>{item.status==="APPROVED"?"Pubblicato":"Rifiutato"}</span></div>
       <h3>{item.title}</h3><p>{item.body}</p>
       {item.photo_url&&<img className="family-visitor-photo" src={item.photo_url} alt="Fotografia del ricordo"/>}
       <div className="family-visitor-actions">
        {item.status==="REJECTED"?<button type="button" onClick={()=>void moderate(item,"APPROVE")} disabled={!!busy}>Approva ora</button>:
         <button type="button" onClick={()=>void moderate(item,"REJECT")} disabled={!!busy}>Rimuovi dalla pubblicazione</button>}
       </div>
      </article>)}
     </details>}
   </>}
 </section>;
}
