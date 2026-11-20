"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
export function AgencyExitFamilyContext({contextId,memorialId}:{contextId:string;memorialId:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function leave(){
  if(busy)return;setBusy(true);setError("");
  const result=await db.rpc("agency_close_family_context",{context_key:contextId});
  if(result.error){setBusy(false);setError("Uscita non completata: "+result.error.message);return;}
  router.replace("/console/agenzia/memoriali/"+memorialId);
 }
 return <div><button type="button" onClick={()=>void leave()} disabled={busy} style={{padding:"10px 14px",borderRadius:8,background:"#fff",border:"1px solid #d8c6a7",color:"#173c57",fontWeight:700}}>
  {busy?"Chiusura…":"Termina «Entra come Famiglia» e torna all'Agenzia"}
 </button>{error&&<p role="alert" style={{color:"#a13232"}}>{error}</p>}</div>;
}
