"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import type {WorkNoticeSnapshot,WorkNotice} from "./workspace-notifications";
import "./context-action-notice.css";

export function ContextActionNotice({memorialId,onOpen}:{memorialId:string;onOpen:()=>void}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [pending,setPending]=useState(0);
 const [error,setError]=useState(false);
 const refresh=useCallback(async()=>{
  const result=await db.rpc("workspace_notifications_snapshot",{area_key:"piattaforma"});
  if(result.error){setError(true);return;}
  const items=((result.data as WorkNoticeSnapshot|null)?.items??[]) as WorkNotice[];
  setPending(items.filter(n=>n.memorial_id===memorialId&&n.kind==="VISITOR_MEMORY_PENDING").reduce((a,n)=>a+n.count,0));
  setError(false);
 },[db,memorialId]);
 useEffect(()=>{
  void Promise.resolve().then(refresh);
  const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},15000);
  const onFocus=()=>void refresh();
  window.addEventListener("focus",onFocus);
  window.addEventListener("memorial:moderation-updated",onFocus);
  return ()=>{window.clearInterval(timer);window.removeEventListener("focus",onFocus);window.removeEventListener("memorial:moderation-updated",onFocus);};
 },[refresh]);
 return <div className="context-action-alert" role="status">
  <div className="context-action-copy">
   <span className="context-action-symbol" aria-hidden="true">◉</span>
   <div><strong>{pending>0?pending+" "+(pending===1?"nuovo ricordo da approvare":"nuovi ricordi da approvare"):"Ricordi dei visitatori"}</strong>
    <small>{error?"Contatore temporaneamente non disponibile":pending>0?"Proposte complete di testo e fotografia. La famiglia decide sulla proposta intera.":"Nessuna proposta in attesa di approvazione."}</small></div>
  </div>
  <button type="button" onClick={onOpen}>{pending>0?"Esamina proposte":"Apri ricordi"}</button>
 </div>;
}
