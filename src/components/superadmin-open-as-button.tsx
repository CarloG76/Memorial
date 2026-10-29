"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
type Kind="AGENCY"|"FAMILY";
export function OpenAsButton({kind,targetId,full=false}:{kind:Kind;targetId:string;full?:boolean}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function open(){
  setBusy(true);setError("");
  const result=await db.rpc("platform_start_operator_context",{kind,target_id:targetId});
  if(result.error||!result.data){setError("Impossibile aprire il contesto: "+(result.error?.message??"accesso negato"));setBusy(false);return;}
  router.push("/console/piattaforma/apri-come/"+encodeURIComponent(result.data));
 }
 return <span style={{display:full?"block":"inline-flex",verticalAlign:"middle"}}>
  <button type="button" onClick={open} disabled={busy} style={{
   background:"#f8edd9",color:"#29415b",border:"1px solid #dcc6a2",borderRadius:8,
   padding:"11px 15px",fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700,fontSize:12,
   cursor:busy?"progress":"pointer",width:full?"100%":undefined
  }}>{busy?"Apertura…":kind==="AGENCY"?"Apri come Agenzia":"Apri come Famiglia"}</button>
  {error&&<small role="alert" style={{display:"block",color:"#a33434",maxWidth:350,marginLeft:8}}>{error}</small>}
 </span>;
}
