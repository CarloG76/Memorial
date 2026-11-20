"use client";
import {useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

export function AgencyOpenAsFamilyButton({memorialId}:{memorialId:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function open(){
  if(busy)return;
  const tab=window.open("about:blank","_blank");
  if(!tab){setError("Abilita l'apertura delle nuove schede per Memorial.");return;}
  tab.opener=null;
  tab.document.title="Ambiente Famiglia";
  tab.document.body.textContent="Accesso delegato in corso…";
  setBusy(true);setError("");
  try{
   const r=await db.rpc("agency_start_family_context",{target_memorial:memorialId});
   if(r.error||!r.data){tab.close();setError(r.error?.message??"Accesso negato");return;}
   tab.location.replace("/console/agenzia/entra-come-famiglia/"+encodeURIComponent(String(r.data)));
  }catch(e){tab.close();setError(e instanceof Error?e.message:"Accesso non disponibile");}
  finally{setBusy(false);}
 }
 return <span style={{display:"inline-flex",flexDirection:"column",gap:7}}>
  <button type="button" onClick={()=>void open()} disabled={busy} style={{padding:"12px 16px",borderRadius:8,background:"#173c57",color:"white",border:0,cursor:"pointer",fontWeight:700}}>
   {busy?"Apertura…":"Entra come Famiglia"}
  </button>
  {error&&<small role="alert" style={{color:"#a33232"}}>{error}</small>}
 </span>;
}
