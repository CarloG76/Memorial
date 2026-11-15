"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import type {WorkspaceArea} from "@/lib/navigation";
import "./workspace-notifications.css";

export type WorkNotice={
 kind:"VISITOR_MEMORY_PENDING"|"PAYMENT_PENDING"|"AGENCY_INACTIVE";
 agency_id:string;memorial_id:string|null;title:string;agency_name:string;
 count:number;last_at:string|null;
};
export type WorkNoticeSnapshot={items:WorkNotice[]};
export function noticeTarget(area:WorkspaceArea,n:WorkNotice):string{
 if(area==="famiglia")return "/console/famiglia?sezione=ricordi";
 if(area==="agenzia")return "/console/agenzia?sezione=dashboard";
 if(n.kind==="AGENCY_INACTIVE")return "/console/piattaforma/agenzie/"+n.agency_id;
 if(n.kind==="PAYMENT_PENDING")return n.memorial_id?"/console/piattaforma/memoriali/"+n.memorial_id:"/console/piattaforma?sezione=memoriali";
 return "/console/piattaforma?sezione=famiglie&q="+encodeURIComponent(n.title);
}
export function noticeDescription(n:WorkNotice):string{
 if(n.kind==="VISITOR_MEMORY_PENDING")return n.count===1?"1 ricordo completo da approvare":n.count+" ricordi completi da approvare";
 if(n.kind==="PAYMENT_PENDING")return "Memoriale in attesa di pagamento";
 return "Agenzia non attiva";
}
export function WorkspaceNotifications({area}:{area:WorkspaceArea}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [items,setItems]=useState<WorkNotice[]>([]);
 const [isOpen,setOpen]=useState(false);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const ref=useRef<HTMLDivElement>(null);
 const refresh=useCallback(async()=>{
  const r=await db.rpc("workspace_notifications_snapshot",{area_key:area});
  if(r.error){setError("Notifiche non disponibili.");}
  else{
   const value=r.data as WorkNoticeSnapshot|null;
   setItems(Array.isArray(value?.items)?value.items:[]);
   setError("");
  }
  setBusy(false);
 },[area,db]);
 useEffect(()=>{
  void refresh();
  const tick=window.setInterval(()=>{if(!document.hidden)void refresh();},60000);
  const visible=()=>{if(!document.hidden)void refresh();};
  document.addEventListener("visibilitychange",visible);
  return ()=>{window.clearInterval(tick);document.removeEventListener("visibilitychange",visible);};
 },[refresh]);
 useEffect(()=>{
  if(!isOpen)return;
  function close(e:MouseEvent){if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);}
  function escape(e:KeyboardEvent){if(e.key==="Escape")setOpen(false);}
  document.addEventListener("mousedown",close);document.addEventListener("keydown",escape);
  return ()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",escape);};
 },[isOpen]);
 const total=items.reduce((sum,n)=>sum+n.count,0);
 return <div className="wn-wrap" ref={ref}>
  <button className="wn-bell" type="button" aria-label={"Notifiche: "+total+" attività da gestire"} aria-expanded={isOpen}
    aria-haspopup="true" onClick={()=>{setOpen(v=>!v);void refresh();}} title="Notifiche e attività da gestire">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
     <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>
    </svg>
    {total>0&&<span className="wn-count">{total>99?"99+":total}</span>}
  </button>
  {isOpen&&<section className="wn-dropdown" aria-label="Notifiche">
   <div className="wn-head"><div><strong>Notifiche</strong><small>{busy?"Aggiornamento…":total+" attività da gestire"}</small></div>
    <button type="button" onClick={()=>void refresh()} aria-label="Aggiorna notifiche">Aggiorna</button></div>
   {error&&<p role="alert" className="wn-error">{error}</p>}
   {!error&&items.length===0&&<p className="wn-empty">Nessuna attività in sospeso.</p>}
   {items.length>0&&<div className="wn-list">{items.map((n,i)=><Link key={n.kind+"-"+n.memorial_id+"-"+n.agency_id+"-"+i}
    href={noticeTarget(area,n)} onClick={()=>setOpen(false)}>
    <span className="wn-type">{n.kind==="VISITOR_MEMORY_PENDING"?"RICORDI":n.kind==="PAYMENT_PENDING"?"PAGAMENTI":"AGENZIE"}</span>
    <strong>{n.title}</strong><small>{noticeDescription(n)}</small>
    {area==="piattaforma"&&<small className="wn-agency">{n.agency_name}</small>}
   </Link>)}</div>}
   <p className="wn-foot">Le notifiche si aggiornano quando cambia lo stato delle attività. Non sono messaggi già letti o notifiche email.</p>
  </section>}
 </div>;
}
