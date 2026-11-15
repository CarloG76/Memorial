"use client";
import {useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
type Kind="AGENCY"|"FAMILY";
export function OpenAsButton({kind,targetId,full=false,compact=false}:{kind:Kind;targetId:string;full?:boolean;compact?:boolean}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function open(){
  if(busy)return;
  // Create the tab synchronously during the click: browsers block windows opened after await.
  const tab=window.open("about:blank","_blank");
  if(!tab){setError("Il browser ha bloccato la nuova scheda. Abilita i popup per Memorial.");return;}
  tab.opener=null;
  tab.document.title="Apertura Memorial";
  tab.document.body.textContent="Apertura ambiente Memorial…";
  setBusy(true);setError("");
  try{
   const result=await db.rpc("platform_start_operator_context",{kind,target_id:targetId});
   if(result.error||!result.data){
    tab.close();
    setError("Impossibile aprire il contesto: "+(result.error?.message??"accesso negato"));
    return;
   }
   tab.location.replace("/console/piattaforma/apri-come/"+encodeURIComponent(result.data));
  }catch{
   tab.close();
   setError("Impossibile aprire una nuova scheda. Riprova.");
  }finally{setBusy(false);}
 }
 return <span style={{display:full?"block":"inline-flex",verticalAlign:"middle"}}>
  <button type="button" onClick={open} disabled={busy} className={compact?"ma-row-action ma-row-action-enter":undefined} style={compact?undefined:{
   background:"#f8edd9",color:"#29415b",border:"1px solid #dcc6a2",borderRadius:8,
   padding:"11px 15px",fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700,fontSize:12,
   cursor:busy?"progress":"pointer",width:full?"100%":undefined
  }}>{busy?"Apertura…":compact?"Entra come":kind==="AGENCY"?"Apri come Agenzia":"Apri come Famiglia"}</button>
  {error&&<small role="alert" style={{display:"block",color:"#a33434",maxWidth:350,marginLeft:8}}>{error}</small>}
 </span>;
}
